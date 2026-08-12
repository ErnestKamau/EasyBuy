<?php

namespace App\Listeners;

use App\Events\PaymentReceived;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreatePaymentReceivedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(PaymentReceived $event): void
    {
        $payment = $event->payment;
        $sale = $payment->sale;
        $order = $sale->order;

        if ($order && $order->user_id) {
            // Create notification for customer
            NotificationService::create(
                $order->user_id,
                'payment_received',
                'That landed. Thank you.',
                "KES {$payment->amount} is in for {$sale->sale_number}. Open the app for the quiet receipt.",
                [
                    'payment_id' => $payment->id,
                    'sale_id' => $sale->id,
                    'order_id' => $order->id,
                    'amount' => $payment->amount,
                ],
                'medium'
            );
        }

        // Create notification for admin
        NotificationService::createForAdmins(
            'payment_received_admin',
            'Payment Received',
            "Payment of Ksh {$payment->amount} received for sale {$sale->sale_number}",
            [
                'payment_id' => $payment->id,
                'sale_id' => $sale->id,
                'amount' => $payment->amount,
            ],
            'medium'
        );
    }
}
