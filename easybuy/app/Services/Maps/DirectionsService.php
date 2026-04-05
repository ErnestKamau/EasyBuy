<?php

namespace App\Services\Maps;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class DirectionsService
{
    /**
     * Fetches a driving route from Google Maps Directions API.
     *
     * Why on the backend?
     *  - API key never leaves the server. No quota theft risk.
     *  - Results are consistent and cacheable.
     *  - The app just renders the polyline — no logic on client.
     *
     * @return array{polyline: string, duration: string, distance: string, eta_seconds: int}
     */
    public function getRoute(float $fromLat, float $fromLng, float $toLat, float $toLng): array
    {
        // Cache routes for 2 minutes to avoid redundant API calls
        // for rapidly updating driver positions (saves money at scale)
        $cacheKey = "route:{$fromLat},{$fromLng}:{$toLat},{$toLng}";

        return Cache::remember($cacheKey, 120, function () use ($fromLat, $fromLng, $toLat, $toLng) {
            $response = Http::timeout(5)->get('https://maps.googleapis.com/maps/api/directions/json', [
                'origin'      => "{$fromLat},{$fromLng}",
                'destination' => "{$toLat},{$toLng}",
                'mode'        => 'driving',
                'key'         => config('services.google_maps.key'),
            ]);

            if ($response->failed() || empty($response->json('routes'))) {
                return [
                    'polyline'    => '',
                    'duration'    => 'N/A',
                    'distance'    => 'N/A',
                    'eta_seconds' => 0,
                ];
            }

            $route = $response->json('routes.0');
            $leg   = $route['legs'][0];

            return [
                'polyline'    => $route['overview_polyline']['points'],
                'duration'    => $leg['duration']['text'],
                'distance'    => $leg['distance']['text'],
                'eta_seconds' => $leg['duration']['value'],
            ];
        });
    }
}
