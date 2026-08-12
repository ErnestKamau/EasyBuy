<?php

namespace App\Listeners;

use App\Events\OrderConfirmed;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateOrderConfirmedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(OrderConfirmed $event): void
    {
        $order = $event->order;

        if (!$order->user_id) {
            return; // No user to notify
        }

        // Create notification for customer
        NotificationService::create(
            $order->user_id,
            'order_confirmed',
            'You’re on the list.',
            "Order {$order->order_number} is confirmed. Track it from Orders whenever you’re ready.",
            [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ],
            'medium'
        );
    }
}
