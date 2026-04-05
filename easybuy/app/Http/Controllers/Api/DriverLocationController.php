<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Actions\Delivery\UpdateDriverLocationAction;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class DriverLocationController extends Controller
{
    /**
     * Receive GPS ping from the driver's device.
     * Called every 3 seconds while on an active delivery.
     * This must be FAST. All heavy work is in the Action and dispatched async.
     */
    public function update(Request $request, UpdateDriverLocationAction $action): JsonResponse
    {
        $validated = $request->validate([
            'lat'       => 'required|numeric|between:-90,90',
            'lng'       => 'required|numeric|between:-180,180',
            'heading'   => 'nullable|numeric|between:0,360',
            'speed'     => 'nullable|numeric|min:0',
            'order_id'  => 'nullable|integer|exists:orders,id',
        ]);

        $action->execute(
            driver:  $request->user(),
            lat:     $validated['lat'],
            lng:     $validated['lng'],
            heading: $validated['heading'] ?? 0,
            speed:   $validated['speed'] ?? 0,
            orderId: $validated['order_id'] ?? null,
        );

        return response()->json(['status' => 'ok']);
    }

    /**
     * Rider toggles their online/offline status.
     * Updates both MySQL and the Redis sorted set.
     */
    public function setStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:online,offline',
        ]);

        $driver = $request->user();
        $driver->update(['online_status' => $validated['status']]);

        if ($validated['status'] === 'online') {
            Redis::zadd('drivers:online', now()->timestamp, $driver->id);
        } else {
            Redis::zrem('drivers:online', $driver->id);
            Redis::del("driver:{$driver->id}:location");
        }

        return response()->json([
            'status'        => 'ok',
            'online_status' => $validated['status'],
        ]);
    }
}
