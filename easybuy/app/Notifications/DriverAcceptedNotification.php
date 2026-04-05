<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DriverAcceptedNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Order $order) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if ($notifiable->fcm_token) {
            $channels[] = 'firebase';
        }
        return $channels;
    }

    /**
     * Firebase Cloud Messaging payload
     */
    public function toFirebase(object $notifiable): array
    {
        $driver = $this->order->driver;
        $name   = $driver ? "{$driver->first_name} {$driver->last_name}" : 'Your rider';

        return [
            'title' => 'Rider Accepted!',
            'body'  => "{$name} is on the way for order #{$this->order->order_number}.",
            'data'  => [
                'type'     => 'driver_accepted',
                'order_id' => (string) $this->order->id,
            ],
        ];
    }

    public function toArray(object $notifiable): array
    {
        $driver = $this->order->driver;
        $name   = $driver ? "{$driver->first_name} {$driver->last_name}" : 'Your rider';

        return [
            'type'         => 'driver_accepted',
            'order_id'     => $this->order->id,
            'order_number' => $this->order->order_number,
            'message'      => "{$name} has accepted your delivery! They are on their way.",
        ];
    }
}
