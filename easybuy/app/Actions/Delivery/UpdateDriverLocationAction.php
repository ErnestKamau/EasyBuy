<?php

namespace App\Actions\Delivery;

use App\Events\DriverLocationUpdated;
use App\Jobs\PersistDriverLocationJob;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Redis;

class UpdateDriverLocationAction
{
    /**
     * Process an incoming GPS update from the driver app.
     *
     * This is the hottest path in the delivery system.
     * Called every 3 seconds while a driver is en_route.
     * It MUST be fast — target < 20ms response time.
     *
     * What happens here (in order of speed):
     *  1. Write latest position to Redis (instant, ~1ms).
     *  2. Refresh the driver's heartbeat in the online sorted set.
     *  3. Check if driver has moved > 10 meters before broadcasting.
     *     (Prevents flooding the WebSocket server with micro-movements.)
     *  4. If moved significantly, broadcast to order channel.
     *  5. Dispatch async job to persist to MySQL. (Does NOT block the response.)
     */
    public function execute(
        User   $driver,
        float  $lat,
        float  $lng,
        float  $heading = 0,
        float  $speed = 0,
        ?int   $orderId = null
    ): void {
        $payload = [
            'lat'        => $lat,
            'lng'        => $lng,
            'heading'    => $heading,
            'speed'      => $speed,
            'updated_at' => now()->toISOString(),
        ];

        // 1. Update live position in Redis — TTL 5 minutes
        // If phone dies, key expires and admin knows driver went offline
        Redis::setex("driver:{$driver->id}:location", 300, json_encode($payload));

        // 2. Update heartbeat in online sorted set
        // Score = Unix timestamp. Stale entries with score < (now - 120s) are cleaned up by scheduler.
        Redis::zadd('drivers:online', now()->timestamp, $driver->id);

        // 3. Only push WebSocket event if driver has moved significantly
        // Reduces bandwidth. 10 meters is imperceptible on a map but avoids event spam.
        if ($orderId && $this->hasMovedSignificantly($driver->id, $lat, $lng)) {
            broadcast(new DriverLocationUpdated($orderId, $driver->id, $payload));
        }

        // 4. Async MySQL write — does NOT delay the HTTP response
        PersistDriverLocationJob::dispatch($driver->id, $lat, $lng, $heading, $speed, $orderId, now());
    }

    /**
     * Returns true if the driver has moved more than 10 meters since last recorded position.
     * Uses the Haversine formula approximation for short distances.
     */
    private function hasMovedSignificantly(int $driverId, float $newLat, float $newLng): bool
    {
        $cached = Redis::get("driver:{$driverId}:location");
        if (!$cached) {
            return true;
        }

        $last = json_decode($cached);

        // Haversine approximation (accurate for small distances ~< 1km)
        $earthRadius = 6371000; // Earth radius in meters
        $dLat = deg2rad($newLat - $last->lat);
        $dLng = deg2rad($newLng - $last->lng);
        $a = sin($dLat / 2) ** 2 +
             cos(deg2rad($last->lat)) * cos(deg2rad($newLat)) * sin($dLng / 2) ** 2;
        $meters = 2 * $earthRadius * asin(sqrt($a));

        return $meters > 10;
    }
}
