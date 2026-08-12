<?php

namespace App\Http\Controllers\Api;

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
     * List riders available for assignment (online or offline, no active job).
     */
    public function availableDrivers(Request $request): JsonResponse
    {
        $minScore = now()->subMinutes(2)->timestamp;
        $onlineDriverIds = Redis::zrangebyscore('drivers:online', $minScore, '+inf') ?: [];
        $onlineSet = array_map('intval', $onlineDriverIds);

        $drivers = User::where('role', 'rider')
            ->whereDoesntHave('activeDelivery')
            ->get([
                'id',
                'first_name',
                'last_name',
                'phone_number',
                'vehicle_type',
                'vehicle_model',
                'vehicle_registration',
                'online_status',
            ])
            ->map(function (User $driver) use ($onlineSet) {
                $driver->online_status = in_array((int) $driver->id, $onlineSet, true) ? 'online' : 'offline';
                $driver->average_rating = $driver->average_rating;
                return $driver;
            });

        return response()->json(['drivers' => $drivers]);
    }

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
