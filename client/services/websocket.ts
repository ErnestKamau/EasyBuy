// services/websocket.ts
import io from 'socket.io-client';
import { tokenManager } from './api';

type Socket = ReturnType<typeof io>;

// Get the base URL for WebSocket connection
// Laravel Echo Server runs on port 6001 by default
const getWebSocketUrl = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
  // Extract host and port, use port 6001 for Echo Server
  const url = new URL(apiUrl);
  // For mobile, use the same hostname but port 6001
  // If using Android emulator, 10.0.2.2 maps to localhost
  const hostname = url.hostname === '10.0.2.2' ? '10.0.2.2' : url.hostname;
  return `http://${hostname}:6001`;
};

// Get auth endpoint URL
const getAuthUrl = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
  return `${apiUrl.replace('/api', '')}/broadcasting/auth`;
};

export interface WebSocketEvent {
  type: string;
  data: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;
  private readonly listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;

  /**
   * Connect to Laravel Echo Server
   */
  async connect(userId: number, userRole: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = await tokenManager.getAccessToken();
      if (!token) {
        console.warn('No access token available for WebSocket connection');
        this.isConnecting = false;
        return;
      }

      const wsUrl = getWebSocketUrl();
      console.log('Connecting to WebSocket server:', wsUrl);

      // Socket.IO v2.x compatible options
      // Laravel Echo Server uses Socket.IO v2.x protocol
      // Store token for use in channel subscriptions
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        // Socket.IO v2 uses 'query' for passing data
        // Laravel Echo Server can read token from query and forward it to Laravel
        query: {
          token: token,
          bearer_token: token, // Also send as bearer_token for Echo Server
        },
        forceNew: false,
      });

      this.setupEventHandlers(userId, userRole);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(userId: number, userRole: string): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.subscribeToChannels(userId, userRole);
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnecting = false;
      
      // Attempt to reconnect if not manually disconnected
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber: any) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      this.subscribeToChannels(userId, userRole);
    });

    // Listen for Laravel Echo events
    this.socket.on('notification', (data: any) => {
      console.log('Notification received via WebSocket:', data);
      this.emit('notification', data);
    });
  }

  /**
   * Subscribe to notification channels
   * Laravel Echo Server handles authentication automatically via /broadcasting/auth
   */
  private async subscribeToChannels(userId: number, userRole: string): Promise<void> {
    if (!this.socket) return;

    try {
      const token = await tokenManager.getAccessToken();
      if (!token) {
        console.warn('No token for channel subscription');
        return;
      }

      // Laravel Echo Server uses Socket.IO v2 with custom protocol
      // For private channels, authentication happens when Echo Server
      // makes HTTP POST to /broadcasting/auth
      // We need to ensure the token is available for Echo Server to forward
      
      const userChannel = `private-user.${userId}.notifications`;
      const adminChannel = 'private-admin.notifications';

      // Laravel Echo Server expects the token to be available when it authenticates
      // The token was sent in the connection query, but we also need to ensure
      // it's available when subscribing. Echo Server will use the token from
      // the socket's handshake data (query parameters) when making auth requests
      
      // Subscribe to user channel
      // Include token in subscription so Echo Server can forward it to Laravel
      this.socket.emit('subscribe', {
        channel: userChannel,
        socket_id: this.socket.id,
        token: token, // Include token for Echo Server to forward
      });

      // Subscribe to admin channel if user is admin
      if (userRole === 'admin') {
        this.socket.emit('subscribe', {
          channel: adminChannel,
          socket_id: this.socket.id,
          token: token, // Include token for Echo Server to forward
        });
      }

      // Laravel Echo Server broadcasts events with format: channel:eventName
      // Listen for all events on subscribed channels
      const eventTypes = [
        'order.placed',
        'order.confirmed',
        'order.cancelled',
        'debt.warning',
        'debt.overdue',
        'payment.received',
        'notification',
      ];

      // Set up listeners for each event type on user channel
      eventTypes.forEach(eventType => {
        const eventName = `${userChannel}:${eventType}`;
        this.socket?.on(eventName, (data: any) => {
          console.log(`Event ${eventType} on user channel:`, data);
          this.handleChannelEvent({ event: eventType, data });
        });
      });

      // Set up listeners for admin channel events
      if (userRole === 'admin') {
        eventTypes.forEach(eventType => {
          const eventName = `${adminChannel}:${eventType}`;
          this.socket?.on(eventName, (data: any) => {
            console.log(`Event ${eventType} on admin channel:`, data);
            this.handleChannelEvent({ event: eventType, data });
          });
        });
      }

      // Socket.IO v2.x doesn't have onAny() - we listen to specific events above
      // For any other events, we can add them to the eventTypes array above
    } catch (error) {
      console.error('Error subscribing to channels:', error);
    }
  }

  /**
   * Handle events from Laravel Echo channels
   */
  private handleChannelEvent(data: any): void {
    // Laravel Echo sends events in format: { event: 'event.name', data: {...} }
    if (data.event) {
      this.emit(data.event, data.data || data);
    } else {
      // Direct notification data
      this.emit('notification', data);
    }
  }

  /**
   * Subscribe to a specific event
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback?: (data: any) => void): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.isConnecting = false;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
