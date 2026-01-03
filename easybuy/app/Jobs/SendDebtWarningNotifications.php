<?php

namespace App\Jobs;

use App\Models\Sale;
use App\Events\DebtWarning;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendDebtWarningNotifications implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Get sales that are 2 days before due date
        $twoDaysFromNow = Carbon::now()->addDays(2);
        $oneDayFromNow = Carbon::now()->addDays(1);

        $salesDueSoon = Sale::whereNotNull('due_date')
            ->whereBetween('due_date', [$oneDayFromNow, $twoDaysFromNow])
            ->whereIn('payment_status', ['no-payment', 'partial-payment'])
            ->where('payment_status', '!=', 'fully-paid')
            ->with('order.user')
            ->get();

        foreach ($salesDueSoon as $sale) {
            try {
                $order = $sale->order;
                $daysRemaining = $sale->days_remaining ?? 0;

                if ($daysRemaining <= 2 && $daysRemaining > 0) {
                    // Create notification for customer
                    if ($order && $order->user_id) {
                        NotificationService::create(
                            $order->user_id,
                            'debt_warning_2days',
                            'Payment Due Soon',
                            "Your payment of Ksh {$sale->balance} for sale {$sale->sale_number} is due in {$daysRemaining} day(s)",
                            [
                                'sale_id' => $sale->id,
                                'order_id' => $order->id,
                                'balance' => $sale->balance,
                                'due_date' => $sale->due_date,
                            ],
                            'high'
                        );

                        // Dispatch event for real-time notification
                        event(new DebtWarning($sale, false));
                    }

                    // Create notification for admin
                    NotificationService::createForAdmins(
                        'debt_warning_admin_2days',
                        'Customer Payment Due Soon',
                        "Customer has payment of Ksh {$sale->balance} due in {$daysRemaining} day(s) for sale {$sale->sale_number}",
                        [
                            'sale_id' => $sale->id,
                            'order_id' => $order?->id,
                            'balance' => $sale->balance,
                            'due_date' => $sale->due_date,
                            'customer_name' => $sale->customer_name,
                        ],
                        'high'
                    );

                    // Dispatch event for admin
                    event(new DebtWarning($sale, true));
                }
            } catch (\Exception $e) {
                Log::error('Failed to send debt warning notification', [
                    'sale_id' => $sale->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Also check for overdue debts
        $overdueSales = Sale::whereNotNull('due_date')
            ->where('due_date', '<', Carbon::now())
            ->whereIn('payment_status', ['no-payment', 'partial-payment'])
            ->where('payment_status', '!=', 'fully-paid')
            ->with('order.user')
            ->get();

        foreach ($overdueSales as $sale) {
            try {
                $order = $sale->order;

                // Create notification for customer
                if ($order && $order->user_id) {
                    // Check if we already notified about this overdue debt today
                    $today = Carbon::today();
                    $existingNotification = \App\Models\Notification::where('user_id', $order->user_id)
                        ->where('type', 'debt_overdue')
                        ->where('data->sale_id', $sale->id)
                        ->whereDate('created_at', $today)
                        ->first();

                    if (!$existingNotification) {
                        NotificationService::create(
                            $order->user_id,
                            'debt_overdue',
                            'Payment Overdue',
                            "Your payment of Ksh {$sale->balance} for sale {$sale->sale_number} is now overdue. Please make payment immediately.",
                            [
                                'sale_id' => $sale->id,
                                'order_id' => $order->id,
                                'balance' => $sale->balance,
                                'due_date' => $sale->due_date,
                            ],
                            'high'
                        );

                        // Dispatch event
                        event(new \App\Events\DebtOverdue($sale, false));
                    }
                }

                // Create notification for admin (only once per day per sale)
                $existingAdminNotification = \App\Models\Notification::whereNull('user_id')
                    ->where('type', 'debt_overdue_admin')
                    ->where('data->sale_id', $sale->id)
                    ->whereDate('created_at', $today)
                    ->first();

                if (!$existingAdminNotification) {
                    NotificationService::createForAdmins(
                        'debt_overdue_admin',
                        'Customer Payment Overdue',
                        "Customer {$sale->customer_name} has overdue payment of Ksh {$sale->balance} for sale {$sale->sale_number}",
                        [
                            'sale_id' => $sale->id,
                            'order_id' => $order?->id,
                            'balance' => $sale->balance,
                            'due_date' => $sale->due_date,
                            'customer_name' => $sale->customer_name,
                        ],
                        'high'
                    );

                    // Dispatch event for admin
                    event(new \App\Events\DebtOverdue($sale, true));
                }
            } catch (\Exception $e) {
                Log::error('Failed to send overdue notification', [
                    'sale_id' => $sale->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
}
