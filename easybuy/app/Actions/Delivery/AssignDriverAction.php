<?php

namespace App\Actions\Delivery;

use App\Models\Order;
use App\Models\User;
use App\Events\OrderStatusUpdated;
use App\Notifications\NewDeliveryAssignedNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Redis;
use Illuminate\Validation\ValidationException;

class AssignDriverAction
{
    /**
     * Assign a rider to a delivery order.
     * Called by Admin only.
     *
     * Steps:
     *  1. Validate the driver is still available at the moment of assignment.
     *  2. Update the order in MySQL.
     *  3. Write the order→driver mapping to Redis (fast lookup for tracking screen).
     *  4. Send FCM push notification to the driver's device.
     *  5. Broadcast order status change so Admin dashboard updates instantly.
     */
    public function execute(Order $order, User $driver): Order
    {
        // Guard: ensure order is in a state that can be assigned
        if (!in_array($order->fulfillment_status, ['pending', 'preparing'])) {
            throw ValidationException::withMessages([
                'order' => 'This order cannot be assigned in its current status: ' . $order->fulfillment_status,
            ]);
        }

        // Guard: ensure driver is available right now
        if (!$driver->isAvailableForDelivery()) {
            throw ValidationException::withMessages([
                'driver' => 'This driver is not available. They may be offline or already on a delivery.',
            ]);
        }

        // 1. Persist to MySQL
        $order->update([
            'driver_id'          => $driver->id,
            'fulfillment_status' => 'assigned',
            'driver_assigned_at' => now(),
        ]);

        // 2. Write fast lookup key to Redis — expires in 24 hours
        // Used by the tracking screen to quickly know who's delivering this order
        Redis::setex("order:{$order->id}:driver", 86400, $driver->id);

        // 3. Push notification to driver's device (even if app is closed)
        if ($driver->fcm_token) {
            Notification::send($driver, new NewDeliveryAssignedNotification($order));
        }

        // 4. Broadcast to admin channel so the dispatch dashboard updates instantly
        broadcast(new OrderStatusUpdated($order->fresh(['driver', 'user'])))->toOthers();

        return $order->fresh();
    }
}
