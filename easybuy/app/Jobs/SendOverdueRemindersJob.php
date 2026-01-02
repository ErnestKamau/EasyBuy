<?php

namespace App\Jobs;

use App\Models\Sale;
use App\Mail\OverdueReminder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendOverdueRemindersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Get configurable reminder frequency (default: daily)
        $reminderFrequency = config('app.overdue_reminder_frequency', 'daily');
        
        // Get overdue sales
        $overdueSales = Sale::where(function ($query) {
            $query->where('payment_status', 'overdue')
                ->orWhere(function ($q) {
                    $q->where('due_date', '<', Carbon::now())
                      ->whereIn('payment_status', ['no-payment', 'partial-payment']);
                });
        })
        ->whereNotNull('due_date')
        ->where('payment_status', '!=', 'fully-paid')
        ->get();

        foreach ($overdueSales as $sale) {
            try {
                // Send reminder to customer
                if ($sale->customer_email) {
                    Mail::to($sale->customer_email)->send(new OverdueReminder($sale, false));
                }

                // Send alert to admin (get admin email from config)
                $adminEmail = config('app.admin_email');
                if ($adminEmail) {
                    Mail::to($adminEmail)->send(new OverdueReminder($sale, true));
                }

                Log::info('Overdue reminder sent', ['sale_id' => $sale->id]);
            } catch (\Exception $e) {
                Log::error('Failed to send overdue reminder', [
                    'sale_id' => $sale->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
}
