<?php

use App\Models\Order;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// User-specific notification channel
Broadcast::channel('user.{userId}.notifications', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Admin notification channel
Broadcast::channel('admin.notifications', function ($user) {
    return $user->role === 'admin';
});

// Admin orders channel — for the live dispatch dashboard
Broadcast::channel('admin.orders', function ($user) {
    return $user->role === 'admin';
});

// Order-specific tracking channel.
// Allows: the customer who placed the order, any admin, and the assigned driver.
// CRITICAL: This is what prevents strangers from tracking drivers.
Broadcast::channel('order.{orderId}', function ($user, $orderId) {
    $order = Order::find($orderId);
    if (!$order) return false;

    return $user->id === $order->user_id      // customer
        || $user->role === 'admin'             // any admin
        || $user->id === $order->driver_id;    // assigned rider
});
