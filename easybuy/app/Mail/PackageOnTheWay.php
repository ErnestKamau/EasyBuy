<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PackageOnTheWay extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your package is on the way — ' . $this->order->order_number,
        );
    }

    public function content(): Content
    {
        $driver = $this->order->driver;
        $driverName = $driver
            ? trim("{$driver->first_name} {$driver->last_name}")
            : 'Your rider';

        return new Content(
            view: 'emails.package-on-the-way',
            with: [
                'order' => $this->order,
                'customerName' => $this->order->user
                    ? trim("{$this->order->user->first_name} {$this->order->user->last_name}")
                    : 'Customer',
                'driverName' => $driverName,
                'vehicleType' => $driver?->vehicle_type,
                'vehicleModel' => $driver?->vehicle_model,
                'plate' => $driver?->vehicle_registration,
            ],
        );
    }
}
