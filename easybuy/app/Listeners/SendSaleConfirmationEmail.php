<?php

namespace App\Listeners;

use App\Events\SaleCreated;
use App\Mail\SaleConfirmation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendSaleConfirmationEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(SaleCreated $event): void
    {
        $sale = $event->sale;
        
        // Send email to customer if email exists
        if ($sale->customer_email) {
            Mail::to($sale->customer_email)->send(new SaleConfirmation($sale));
        }
    }
}
