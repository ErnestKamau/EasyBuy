<?php

namespace App\Listeners;

use App\Events\PaymentReceived;
use App\Events\SaleFullyPaid;
use App\Mail\PaymentConfirmation;
use App\Services\ReceiptService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

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
        
        // Generate/regenerate receipt after payment (to include updated balance)
        // Use generatePaymentReceipt for payment confirmations (receipt format, not invoice)
        try {
            $receiptService = app(ReceiptService::class);
            $receiptService->generatePaymentReceipt($sale);
            $sale->refresh();
        } catch (\Exception $e) {
            Log::error('Failed to generate receipt after payment', [
                'payment_id' => $payment->id,
                'sale_id' => $sale->id,
                'error' => $e->getMessage()
            ]);
        }
        
        // Send email to customer if email exists
        $customerEmail = $sale->customer_email;
        if ($customerEmail) {
            Mail::to($customerEmail)->send(new PaymentConfirmation($payment));
        }
        
        // Send copy to admin (only if different from customer email to avoid duplicates)
        $adminEmail = config('app.admin_email');
        if ($adminEmail && $adminEmail !== $customerEmail) {
            Mail::to($adminEmail)->send(new PaymentConfirmation($payment));
        }
        
        // Check if sale is now fully paid and dispatch event
        $sale->refresh();
        if ($sale->is_fully_paid) {
            event(new SaleFullyPaid($sale));
        }
    }
}
