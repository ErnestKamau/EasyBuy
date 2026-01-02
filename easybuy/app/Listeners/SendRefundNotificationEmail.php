<?php

namespace App\Listeners;

use App\Events\PaymentRefunded;
use App\Mail\RefundNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendRefundNotificationEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(PaymentRefunded $event): void
    {
        $payment = $event->payment;
        $sale = $payment->sale;
        
        // Send email to customer if email exists
        if ($sale->customer_email) {
            Mail::to($sale->customer_email)->send(new RefundNotification($payment));
        }
    }
}
