<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Actions\Delivery\AssignDriverAction;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class AdminDeliveryController extends Controller
{
    /**
     * List available drivers for admin to choose from.
     * A driver is available when:
     *   1. They have role = 'rider'.
     *   2. They are in the Redis 'drivers:online' sorted set (heartbeat < 2 min ago).
     *   3. They have no active delivery.
     */
    public function availableDrivers(Request $request): JsonResponse
    {
        // Get IDs of online drivers from Redis sorted set
        // Score = Unix timestamp of last heartbeat. Filter out entries older than 2 minutes.
        $minScore = now()->subMinutes(2)->timestamp;
        $onlineDriverIds = Redis::zrangebyscore('drivers:online', $minScore, '+inf');

        if (empty($onlineDriverIds)) {
            return response()->json(['drivers' => []]);
        }

        $drivers = User::where('role', 'rider')
            ->whereIn('id', $onlineDriverIds)
            ->whereDoesntHave('activeDelivery')
            ->get(['id', 'first_name', 'last_name', 'vehicle_type', 'vehicle_registration', 'online_status']);

        return response()->json(['drivers' => $drivers]);
    }

    /**
     * Admin assigns a specific driver to a delivery order.
     */
    public function assignDriver(Request $request, Order $order, AssignDriverAction $action): JsonResponse
    {
        $validated = $request->validate([
            'driver_id' => 'required|integer|exists:users,id',
        ]);

        $driver = User::findOrFail($validated['driver_id']);
        $order  = $action->execute($order, $driver);

        return response()->json([
            'message' => "Driver {$driver->first_name} assigned to order #{$order->order_number}.",
            'order'   => $order->load('driver'),
        ]);
    }

    /**
     * Admin force-starts a trip (overrides waiting for driver to tap start).
     * Used when driver starts moving but hasn't tapped the button.
     */
    public function startTrip(Request $request, Order $order): JsonResponse
    {
        if (!in_array($order->fulfillment_status, ['driver_accepted', 'assigned'])) {
            return response()->json(['message' => 'Order cannot be force-started at this status.'], 422);
        }

        $order->update([
            'fulfillment_status' => 'en_route',
            'trip_started_at'    => now(),
            'driver_accepted_at' => $order->driver_accepted_at ?? now(),
        ]);

        broadcast(new OrderStatusUpdated($order->fresh(['driver', 'user'])))->toOthers();

        return response()->json(['message' => 'Trip force-started by admin.', 'order' => $order]);
    }
}
