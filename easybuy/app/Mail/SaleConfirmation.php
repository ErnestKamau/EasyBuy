<?php

namespace App\Mail;

use App\Models\Sale;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class SaleConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public $sale;

    /**
     * Create a new message instance.
     */
    public function __construct(Sale $sale)
    {
        $this->sale = $sale;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Sale Confirmation - ' . $this->sale->sale_number,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.sale-confirmation',
            with: [
                'sale' => $this->sale,
                'customerName' => $this->sale->customer_name ?? 'Customer',
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        $attachments = [];

        // Attach receipt if generated
        if ($this->sale->receipt_generated) {
            $filename = "{$this->sale->sale_number}.pdf";
            $receiptPath = "receipts/{$filename}";
            
            // Check if file exists in storage (using default disk, same as ReceiptService)
            if (Storage::exists($receiptPath)) {
                $attachments[] = Attachment::fromStorage($receiptPath)
                    ->as("receipt-{$this->sale->sale_number}.pdf")
                    ->withMime('application/pdf');
            }
        }

        return $attachments;
    }
}
