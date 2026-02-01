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
