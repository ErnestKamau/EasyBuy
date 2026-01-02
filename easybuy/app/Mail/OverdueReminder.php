<?php

namespace App\Mail;

use App\Models\Sale;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OverdueReminder extends Mailable
{
    use Queueable, SerializesModels;

    public $sale;
    public $isAdmin;

    /**
     * Create a new message instance.
     */
    public function __construct(Sale $sale, bool $isAdmin = false)
    {
        $this->sale = $sale;
        $this->isAdmin = $isAdmin;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isAdmin
            ? 'Overdue Payment Alert - ' . $this->sale->sale_number
            : 'Payment Reminder - ' . $this->sale->sale_number;

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $view = $this->isAdmin
            ? 'emails.overdue-reminder-admin'
            : 'emails.overdue-reminder';

        return new Content(
            view: $view,
            with: [
                'sale' => $this->sale,
                'customerName' => $this->sale->customer_name ?? 'Customer',
                'daysRemaining' => $this->sale->days_remaining,
                'isOverdue' => $this->sale->is_overdue,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
