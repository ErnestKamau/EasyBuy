<?php

namespace App\Listeners;

use App\Events\PaymentReceived;
use App\Events\SaleFullyPaid;
use App\Mail\PaymentConfirmation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendPaymentConfirmationEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(PaymentReceived $event): void
    {
        $payment = $event->payment;
        $sale = $payment->sale;
        
        // Send email to customer if email exists
        if ($sale->customer_email) {
            Mail::to($sale->customer_email)->send(new PaymentConfirmation($payment));
        }
        
        // Check if sale is now fully paid and dispatch event
        $sale->refresh();
        if ($sale->is_fully_paid) {
            event(new SaleFullyPaid($sale));
        }
    }
}
