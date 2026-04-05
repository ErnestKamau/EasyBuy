<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\SendOverdueRemindersJob;
use App\Jobs\SendDebtWarningNotifications;
use App\Services\NotificationService;
use App\Models\Sale;
use Carbon\Carbon;

Schedule::call(function () {
    // Mark overdue sales
    Sale::where('due_date', '<', Carbon::now())
        ->whereIn('payment_status', ['no-payment', 'partial-payment'])
        ->update(['payment_status' => 'overdue']);
})->daily();

// Send overdue reminders (configurable frequency)
Schedule::job(new SendOverdueRemindersJob)->daily();

// Send debt warning notifications (2 days before due date)
Schedule::job(new SendDebtWarningNotifications)->daily();

// Clean up old notifications (older than 30 days)
Schedule::call(function () {
    NotificationService::cleanupOldNotifications(30);
})->daily();

// Send pickup reminders (every 30 minutes)
Schedule::job(new \App\Jobs\SendPickupRemindersJob)->everyThirtyMinutes();

// Auto-cancel overdue orders (every hour)
Schedule::job(new \App\Jobs\AutoCancelOverdueOrdersJob)->hourly();

// -----------------------------------------------------------------------
// Delivery System Schedulers
// -----------------------------------------------------------------------

// Driver acceptance timeout: reset orders stuck in 'assigned' for > 3 minutes.
// This handles the case where a driver was assigned but their phone went offline
// or they ignored the notification. Admin will see the order return to 'pending'.
Schedule::call(function () {
    \App\Models\Order::where('fulfillment_status', 'assigned')
        ->where('driver_assigned_at', '<', now()->subMinutes(3))
        ->each(function ($order) {
            $order->resetTimedOutAssignment();
            broadcast(new \App\Events\OrderStatusUpdated($order->fresh(['user'])));
        });
})->everyMinute()->name('delivery:timeout-check')->withoutOverlapping();

// Clean stale drivers from the Redis online sorted set every minute.
// Removes entries where the last heartbeat was > 2 minutes ago.
Schedule::call(function () {
    $cutoff = now()->subMinutes(2)->timestamp;
    \Illuminate\Support\Facades\Redis::zremrangebyscore('drivers:online', '-inf', $cutoff);
})->everyMinute()->name('delivery:cleanup-stale-drivers')->withoutOverlapping();
