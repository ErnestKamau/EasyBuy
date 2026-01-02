<?php

namespace App\Listeners;

use App\Events\SaleCreated;
use App\Mail\SaleConfirmation;
use App\Services\ReceiptService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendSaleConfirmationEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(SaleCreated $event): void
    {
        $sale = $event->sale;
        
        // Generate receipt synchronously before sending email
        // This ensures the receipt is ready to be attached
        if (!$sale->receipt_generated) {
            try {
                $receiptService = app(ReceiptService::class);
                $receiptService->generateReceipt($sale);
                // Refresh the sale model to get updated receipt_generated flag
                $sale->refresh();
            } catch (\Exception $e) {
                // Log error but continue with email sending
                Log::error('Failed to generate receipt for email', [
                    'sale_id' => $sale->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        // Send email to customer if email exists
        if ($sale->customer_email) {
            Mail::to($sale->customer_email)->send(new SaleConfirmation($sale));
        }
    }
}
