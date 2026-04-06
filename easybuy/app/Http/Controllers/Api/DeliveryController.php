<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Actions\Delivery\AcceptDeliveryAction;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Services\Maps\DirectionsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Validation\ValidationException;

class DeliveryController extends Controller
{
    /**
     * Driver accepts an assigned delivery.
     */
    public function accept(Request $request, Order $order, AcceptDeliveryAction $action): JsonResponse
    {
        $order = $action->execute($order, $request->user());

        return response()->json([
            'message' => 'Delivery accepted successfully.',
            'order'   => $order,
        ]);
    }

    /**
     * Driver (or admin) starts the trip. Sets status to en_route.
     */
    public function start(Request $request, Order $order): JsonResponse
    {
        $driver = $request->user();

        if ($order->driver_id !== $driver->id) {
            throw ValidationException::withMessages(['order' => 'You are not the assigned driver.']);
        }

        if ($order->fulfillment_status !== 'driver_accepted') {
            throw ValidationException::withMessages(['order' => 'The delivery must be accepted before starting.']);
        }

        $order->update([
            'fulfillment_status' => 'en_route',
            'trip_started_at'    => now(),
        ]);

        broadcast(new OrderStatusUpdated($order->fresh(['driver', 'user'])))->toOthers();

        return response()->json(['message' => 'Trip started.', 'order' => $order]);
    }

    /**
     * Get the rider's current active delivery.
     */
    public function active(Request $request): JsonResponse
    {
        $order = Order::where('driver_id', $request->user()->id)
            ->whereIn('fulfillment_status', ['assigned', 'driver_accepted', 'en_route'])
            ->with(['user', 'items.product'])
            ->first();

        return response()->json(['order' => $order]);
    }

    /**
     * Get live tracking data for a specific order.
     * Used by both the Customer and Admin tracking screen.
     * Returns: driver's current GPS position (from Redis) + Google Maps route + ETA.
     */
    public function tracking(Request $request, Order $order, DirectionsService $maps): JsonResponse
    {
        // Fetch live driver location from Redis — instant O(1) lookup
        $locationJson = Redis::get("driver:{$order->driver_id}:location");
        $driverLocation = $locationJson ? json_decode($locationJson, true) : null;

        $route = null;
        if ($driverLocation && $order->delivery_lat && $order->delivery_lng) {
            $route = $maps->getRoute(
                $driverLocation['lat'],
                $driverLocation['lng'],
                (float) $order->delivery_lat,
                (float) $order->delivery_lng,
            );
        }

        return response()->json([
            'order_id'           => $order->id,
            'fulfillment_status' => $order->fulfillment_status,
            'driver'             => $order->driver ? [
                'id'                   => $order->driver->id,
                'name'                 => $order->driver->first_name . ' ' . $order->driver->last_name,
                'vehicle_type'         => $order->driver->vehicle_type,
                'vehicle_registration' => $order->driver->vehicle_registration,
            ] : null,
            'driver_location' => $driverLocation,
            'destination'     => [
                'lat'     => $order->delivery_lat,
                'lng'     => $order->delivery_lng,
                'address' => $order->delivery_address,
            ],
            'route' => $route,
        ]);
    }

    /**
     * Customer confirms they received their delivery.
     */
    public function confirmDelivery(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            abort(403, 'You do not own this order.');
        }

        if ($order->fulfillment_status !== 'en_route') {
            throw ValidationException::withMessages(['order' => 'Order is not currently en route.']);
        }

        $order->update([
            'fulfillment_status' => 'delivered',
            'delivered_at'       => now(),
        ]);

        // Clear Redis keys for this delivery
        Redis::del("order:{$order->id}:driver");

        broadcast(new OrderStatusUpdated($order->fresh(['driver', 'user'])))->toOthers();

        return response()->json(['message' => 'Delivery confirmed. Thank you!']);
    }

    /**
     * Rider confirms they delivered the order.
     */
    public function riderConfirm(Request $request, Order $order): JsonResponse
    {
        $driver = $request->user();

        if ($order->driver_id !== $driver->id) {
            throw ValidationException::withMessages(['order' => 'You are not the assigned driver.']);
        }

        if ($order->fulfillment_status !== 'en_route') {
            throw ValidationException::withMessages(['order' => 'Order is not currently en route.']);
        }

        $order->update([
            'fulfillment_status' => 'delivered',
            'delivered_at'       => now(),
        ]);

        // Clear Redis keys for this delivery
        Redis::del("order:{$order->id}:driver");

        broadcast(new OrderStatusUpdated($order->fresh(['driver', 'user'])))->toOthers();

        return response()->json(['message' => 'Delivery marked as completed.', 'order' => $order]);
    }
}
