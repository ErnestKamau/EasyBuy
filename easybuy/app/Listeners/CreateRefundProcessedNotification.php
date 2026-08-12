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
            'It’s on its way back.',
            "A refund of KES {$payment->refund_amount} is processing for {$payment->payment_number}. Banks usually take 3–5 days.",
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
