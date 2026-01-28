<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Services\NotificationService;

class CreateOrderPlacedNotification
{
    /**
     * Handle the event.
     */
    public function handle(OrderPlaced $event): void
    {
        $order = $event->order;
        $customerName = $order->user
            ? ($order->user->first_name . ' ' . $order->user->last_name) . ' (' . $order->user->username . ')'
            : 'Guest Customer';

        // Create notification for all admins
        NotificationService::createForAdmins(
            'order_placed',
            'New Order Placed',
            "Order {$order->order_number} has been placed by {$customerName}",
            [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'user_id' => $order->user_id,
            ],
            'medium'
        );
    }
}
