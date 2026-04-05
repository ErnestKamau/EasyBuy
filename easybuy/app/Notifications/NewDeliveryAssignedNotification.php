<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewDeliveryAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Order $order) {}

    public function via(object $notifiable): array
    {
        // Only attempt FCM if the user has a token
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
        return [
            'title' => 'New Delivery Assigned!',
            'body'  => "Order #{$this->order->order_number} is ready. Tap to accept.",
            'data'  => [
                'type'     => 'new_delivery',
                'order_id' => (string) $this->order->id,
            ],
        ];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'         => 'new_delivery_assigned',
            'order_id'     => $this->order->id,
            'order_number' => $this->order->order_number,
            'address'      => $this->order->delivery_address,
            'message'      => "New delivery assigned: Order #{$this->order->order_number}. Tap to view details.",
        ];
    }
}
