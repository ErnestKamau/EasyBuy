// contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsApi, Notification, NotificationPreference } from '@/services/api';
import { useAuth } from '@/app/_layout';
import { Platform } from 'react-native';
import { websocketService } from '@/services/websocket';

import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreference[];
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  updatePreference: (type: string, enabled?: boolean, pushEnabled?: boolean) => Promise<void>;
  registerForPushNotifications: () => Promise<string | null>;
  markOrderNotificationsAsRead: (orderId: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  preferences: [],
  refreshNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  updatePreference: async () => {},
  registerForPushNotifications: async () => null,
  markOrderNotificationsAsRead: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [useWebSocket, setUseWebSocket] = useState(true); // Enable WebSocket by default

  // Fetch notifications
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const [notificationsData, count] = await Promise.all([
        notificationsApi.getNotifications({ per_page: 50 }),
        notificationsApi.getUnreadCount(),
      ]);

      setNotifications(notificationsData.data);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const prefs = await notificationsApi.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  }, [isAuthenticated, user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Update preference
  const updatePreference = useCallback(async (type: string, enabled?: boolean, pushEnabled?: boolean) => {
    try {
      const updated = await notificationsApi.updatePreference(type, enabled, pushEnabled);
      setPreferences(prev =>
        prev.map(p => p.type === type ? updated : p)
      );
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  }, []);

  // Mark order-related notifications as read
  const markOrderNotificationsAsRead = useCallback(async (orderId: number) => {
    try {
      const orderNotifications = notifications.filter(
        n => !n.read_at && n.data?.order_id === orderId
      );

      for (const notification of orderNotifications) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error marking order notifications as read:', error);
    }
  }, [notifications, markAsRead]);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated || !user || !Notifications) return null;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';

      // Register token with backend
      await notificationsApi.registerDeviceToken(token, platform);

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }, [isAuthenticated, user]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshNotifications();
      fetchPreferences();
      registerForPushNotifications();
    }
  }, [isAuthenticated, user, refreshNotifications, fetchPreferences, registerForPushNotifications]);

  // Set up WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user || !useWebSocket) {
      websocketService.disconnect();
      return;
    }

    // Connect to WebSocket
    websocketService.connect(user.id, user.role || 'user').catch((error) => {
      console.error('Failed to connect WebSocket, falling back to polling:', error);
      setUseWebSocket(false);
    });

    // Listen for notification events
    const handleNotification = (data: any) => {
      console.log('WebSocket notification received:', data);
      // Refresh notifications when a new one arrives
      refreshNotifications();
    };

    // Listen for various event types
    websocketService.on('notification', handleNotification);
    websocketService.on('order.placed', handleNotification);
    websocketService.on('order.confirmed', handleNotification);
    websocketService.on('order.cancelled', handleNotification);
    websocketService.on('debt.warning', handleNotification);
    websocketService.on('debt.overdue', handleNotification);
    websocketService.on('payment.received', handleNotification);

    return () => {
      websocketService.off('notification', handleNotification);
      websocketService.off('order.placed', handleNotification);
      websocketService.off('order.confirmed', handleNotification);
      websocketService.off('order.cancelled', handleNotification);
      websocketService.off('debt.warning', handleNotification);
      websocketService.off('debt.overdue', handleNotification);
      websocketService.off('payment.received', handleNotification);
    };
  }, [isAuthenticated, user, useWebSocket, refreshNotifications]);

  // Set up polling as fallback (every 30 seconds) - only if WebSocket is not used
  useEffect(() => {
    if (!isAuthenticated || !user || useWebSocket) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    // Fallback to polling if WebSocket fails
    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000); // Poll every 30 seconds

    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, user, useWebSocket, refreshNotifications]);

  // Handle notification received while app is foregrounded
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      // Refresh notifications when a push notification is received
      refreshNotifications();
    });

    return () => subscription.remove();
  }, [refreshNotifications]);

  // Handle notification tapped
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      // Handle deep linking here
      if (data?.order_id) {
        // Navigate to order detail
        const router = require('expo-router').router;
        router.push(`/order/${data.order_id}` as any);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        preferences,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updatePreference,
        registerForPushNotifications,
        markOrderNotificationsAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
