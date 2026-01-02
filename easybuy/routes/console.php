<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\SendOverdueRemindersJob;
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
