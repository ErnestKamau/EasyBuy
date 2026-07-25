<?php

namespace App\Actions\Delivery;

use App\Events\DriverLocationUpdated;
use App\Jobs\PersistDriverLocationJob;
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
     *  1. Read previous Redis position (for movement gate).
     *  2. Write latest position to Redis (instant, ~1ms).
     *  3. Refresh the driver's heartbeat in the online sorted set.
     *  4. Check if driver has moved > 10 meters before broadcasting.
     *     (Prevents flooding the WebSocket server with micro-movements.)
     *  5. If moved significantly, broadcast to order channel.
     *  6. Dispatch async job to persist to MySQL. (Does NOT block the response.)
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

        // Read previous position BEFORE overwriting Redis — used for movement gate.
        $previous = Redis::get("driver:{$driver->id}:location");

        // 1. Update live position in Redis — TTL 5 minutes
        // If phone dies, key expires and admin knows driver went offline
        Redis::setex("driver:{$driver->id}:location", 300, json_encode($payload));

        // 2. Update heartbeat in online sorted set
        // Score = Unix timestamp. Stale entries with score < (now - 120s) are cleaned up by scheduler.
        Redis::zadd('drivers:online', now()->timestamp, $driver->id);

        // 3. Only push WebSocket event if driver has moved significantly
        // Reduces bandwidth. 10 meters is imperceptible on a map but avoids event spam.
        if ($orderId && $this->hasMovedSignificantly($previous, $lat, $lng)) {
            broadcast(new DriverLocationUpdated($orderId, $driver->id, $payload));
        }

        // 4. Async MySQL write — does NOT delay the HTTP response
        PersistDriverLocationJob::dispatch($driver->id, $lat, $lng, $heading, $speed, $orderId, now());
    }

    /**
     * Returns true if the driver has moved more than 10 meters since last recorded position.
     * Uses the Haversine formula approximation for short distances.
     */
    private function hasMovedSignificantly(?string $previousJson, float $newLat, float $newLng): bool
    {
        if (!$previousJson) {
            return true;
        }

        $last = json_decode($previousJson);
        if (!$last || !isset($last->lat, $last->lng)) {
            return true;
        }

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
