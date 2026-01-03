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
            'Order Confirmed',
            "Your order {$order->order_number} has been confirmed and is ready for pickup",
            [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ],
            'medium'
        );
    }
}
