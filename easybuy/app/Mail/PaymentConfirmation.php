<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public $payment;
    public $sale;

    /**
     * Create a new message instance.
     */
    public function __construct(Payment $payment)
    {
        $this->payment = $payment;
        $this->sale = $payment->sale;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payment Received - Invoice ' . $this->sale->sale_number . ' - ' . $this->payment->payment_number,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-confirmation',
            with: [
                'payment' => $this->payment,
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
        
        // Attach receipt/invoice if generated
        if ($this->sale->receipt_generated) {
            $filename = "{$this->sale->sale_number}.pdf";
            $receiptPath = "receipts/{$filename}";
            
            if (\Storage::disk('local')->exists($receiptPath)) {
                $attachments[] = \Illuminate\Mail\Mailables\Attachment::fromStorageDisk('local', $receiptPath)
                    ->as("receipt-{$this->sale->sale_number}.pdf")
                    ->withMime('application/pdf');
            }
        }
        
        return $attachments;
    }
}
