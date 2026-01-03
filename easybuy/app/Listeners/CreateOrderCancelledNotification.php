<?php

namespace App\Listeners;

use App\Events\OrderCancelled;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateOrderCancelledNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(OrderCancelled $event): void
    {
        $order = $event->order;

        if (!$order->user_id) {
            return; // No user to notify
        }

        // Create notification for customer
        NotificationService::create(
            $order->user_id,
            'order_cancelled',
            'Order Cancelled',
            "Your order {$order->order_number} has been cancelled",
            [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ],
            'high'
        );
    }
}
