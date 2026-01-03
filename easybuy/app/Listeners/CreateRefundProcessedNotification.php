<?php

namespace App\Listeners;

use App\Events\PaymentRefunded;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateRefundProcessedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(PaymentRefunded $event): void
    {
        $payment = $event->payment;
        $sale = $payment->sale;
        $order = $sale->order;

        if ($order && $order->user_id) {
            // Create notification for customer
            NotificationService::create(
                $order->user_id,
                'refund_processed',
                'Refund Processed',
                "A refund of Ksh {$payment->refund_amount} has been processed for payment {$payment->payment_number}",
                [
                    'payment_id' => $payment->id,
                    'sale_id' => $sale->id,
                    'order_id' => $order->id,
                    'refund_amount' => $payment->refund_amount,
                ],
                'high'
            );
        }
    }
}
