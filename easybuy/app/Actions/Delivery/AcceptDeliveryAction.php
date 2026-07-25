<?php

namespace App\Actions\Delivery;

use App\Models\Order;
use App\Models\User;
use App\Events\OrderStatusUpdated;
use App\Services\NotificationService;
use Illuminate\Validation\ValidationException;

class AcceptDeliveryAction
{
    /**
     * Driver taps "Accept" for an assigned delivery.
     *
     * Steps:
     *  1. Validate the order is assigned to THIS driver and still awaiting acceptance.
     *  2. Update order status in MySQL.
     *  3. Notify the customer that their rider is confirmed.
     *  4. Broadcast to admin dashboard.
     */
    public function execute(Order $order, User $driver): Order
    {
        // Guard: only the assigned driver can accept
        if ($order->driver_id !== $driver->id) {
            throw ValidationException::withMessages([
                'order' => 'You are not the assigned driver for this order.',
            ]);
        }

        if ($order->fulfillment_status !== 'assigned') {
            throw ValidationException::withMessages([
                'order' => 'This order is not in the assigned state.',
            ]);
        }

        $order->update([
            'fulfillment_status' => 'driver_accepted',
            'driver_accepted_at' => now(),
        ]);

        // Notify the customer: "Your rider has accepted the delivery"
        if ($order->user_id) {
            $driverName = trim("{$driver->first_name} {$driver->last_name}");
            NotificationService::create(
                $order->user_id,
                'delivery_accepted',
                'Rider Confirmed',
                "{$driverName} accepted your delivery for order #{$order->order_number}.",
                [
                    'type'         => 'delivery_accepted',
                    'order_id'     => $order->id,
                    'order_number' => $order->order_number,
                    'driver_id'    => $driver->id,
                ],
                'high'
            );
        }

        broadcast(new OrderStatusUpdated($order->fresh(['driver', 'user'])))->toOthers();

        return $order->fresh();
    }
}
