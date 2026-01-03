# Notification System Setup Guide

## Overview
The notification system provides real-time in-app notifications and push notifications for both customers and admins.

## Features
- ✅ In-app notifications with grouping
- ✅ Push notifications via Expo
- ✅ Real-time updates via WebSocket (Laravel Broadcasting)
- ✅ Notification preferences
- ✅ Auto-cleanup (30 days)
- ✅ Deep linking

## Backend Setup

### 1. Database Migrations
Migrations have been created and run:
- `notifications` table
- `notification_preferences` table
- `device_tokens` table

### 2. Laravel Broadcasting Setup

#### Option A: Using Redis (Recommended for Echo Server)

1. Install Redis:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
```

2. Install Laravel Echo Server:
```bash
npm install -g laravel-echo-server
```

3. Initialize Echo Server:
```bash
cd easybuy
laravel-echo-server init
```

4. Configure `.env`:
```env
BROADCAST_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

5. Start Echo Server:
```bash
laravel-echo-server start
```

6. Start Laravel Queue Worker:
```bash
php artisan queue:work
```

#### Option B: Using Pusher (Easier, but requires account)

1. Sign up at https://pusher.com
2. Create a new app
3. Configure `.env`:
```env
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=your-app-id
PUSHER_APP_KEY=your-app-key
PUSHER_APP_SECRET=your-app-secret
PUSHER_APP_CLUSTER=your-cluster
```

### 3. Scheduled Jobs

The following jobs run automatically:
- **Debt Warning Notifications**: Daily at midnight (checks for payments due in 2 days)
- **Notification Cleanup**: Daily (removes notifications older than 30 days)

Make sure Laravel scheduler is running:
```bash
# Add to crontab
* * * * * cd /path-to-project/easybuy && php artisan schedule:run >> /dev/null 2>&1
```

## Frontend Setup

### 1. Expo Push Notifications

The `expo-notifications` package is already installed. To test push notifications:

1. Build the app with EAS:
```bash
cd client
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

2. Push notifications work automatically when:
   - User grants notification permissions
   - Device token is registered via `/api/notifications/device-token`
   - Backend sends push notification via Expo API

### 2. Real-time Updates (WebSocket) ✅ SET UP

WebSocket client has been set up and integrated! The app will automatically use WebSocket when available, falling back to polling if WebSocket fails.

**What's been done:**
1. ✅ `socket.io-client` installed
2. ✅ WebSocket service created at `client/services/websocket.ts`
3. ✅ Integrated with `NotificationContext` for real-time notifications
4. ✅ Automatic fallback to polling if WebSocket connection fails

**How it works:**
- The app connects to Laravel Echo Server on port 6001
- Authenticates using the user's access token
- Subscribes to user-specific and admin notification channels
- Listens for real-time events (order placed, confirmed, cancelled, debt warnings, payments, etc.)
- Automatically refreshes notifications when events are received

**Configuration:**
- WebSocket URL is derived from `EXPO_PUBLIC_API_URL` (uses port 6001 for Echo Server)
- For Android emulator: uses `10.0.2.2:6001`
- For physical devices: uses your computer's IP address on port 6001

**Note**: Make sure Laravel Echo Server is running (`laravel-echo-server start`) and `BROADCAST_DRIVER=redis` is set in your `.env` file.

## Testing

### Test Notification Creation

1. Create an order - should trigger "Order Placed" notification for admins
2. Confirm an order - should trigger "Order Confirmed" notification for customer
3. Cancel an order - should trigger "Order Cancelled" notification for customer
4. Make a payment - should trigger "Payment Received" notifications
5. Wait for debt warning (2 days before due date) - scheduled job will send notifications

### Test Push Notifications

1. Register device token:
```bash
# Via API
POST /api/notifications/device-token
{
  "device_token": "ExponentPushToken[...]",
  "platform": "android" // or "ios"
}
```

2. Create a notification - push notification should be sent automatically

### Test Real-time Updates

1. Open notification center in app
2. In another session, create an order
3. Notification should appear within 30 seconds (polling) or immediately (WebSocket)

## API Endpoints

### Notifications
- `GET /api/notifications` - Get user's notifications
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/{id}/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/{id}` - Delete notification

### Preferences
- `GET /api/notifications/preferences` - Get preferences
- `POST /api/notifications/preferences` - Update preference

### Device Tokens
- `POST /api/notifications/device-token` - Register device token
- `DELETE /api/notifications/device-token` - Unregister device token

## Notification Types

- `order_placed` - New order placed (admin)
- `order_confirmed` - Order confirmed (customer)
- `order_cancelled` - Order cancelled (customer)
- `debt_warning_2days` - Payment due in 2 days (customer)
- `debt_warning_admin_2days` - Customer payment due in 2 days (admin)
- `debt_overdue` - Payment overdue (customer)
- `debt_overdue_admin` - Customer payment overdue (admin)
- `payment_received` - Payment received (customer)
- `payment_received_admin` - Payment received (admin)
- `sale_fully_paid` - Sale fully paid (customer)
- `low_stock_alert` - Low stock alert (admin)
- `refund_processed` - Refund processed (customer)
- `new_product_available` - New product available (customer)

## Troubleshooting

### Push Notifications Not Working
1. Check device token is registered
2. Check Expo Push API status
3. Check notification preferences are enabled
4. Check Laravel logs for errors

### Real-time Updates Not Working
1. Check `BROADCAST_DRIVER` in `.env`
2. Check Echo Server is running (if using Redis)
3. Check queue worker is running
4. Check WebSocket connection (if using WebSocket client)

### Notifications Not Appearing
1. Check user has notification preferences enabled
2. Check notification is created in database
3. Check user_id matches
4. Check notification is not archived

## Next Steps

1. Set up Laravel Echo Server (if using Redis)
2. Configure WebSocket client (optional)
3. Test all notification types
4. Monitor notification delivery rates
5. Adjust notification preferences defaults as needed
