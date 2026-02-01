<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class PickupSlotController extends Controller
{
    /**
     * Get available pickup slots for a specific date
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date|after_or_equal:today'
        ]);

        $date = Carbon::parse($validated['date'])->startOfDay();
        $slots = config('pickup.slots', []);
        $availableSlots = [];

        foreach ($slots as $time => $config) {
            // Create datetime for this slot
            $slotDateTime = Carbon::parse("{$date->toDateString()} {$time}");
            
            // Skip past slots
            if ($slotDateTime->isPast()) {
                continue;
            }

            // Count orders for this slot
            $bookedOrders = Order::where('fulfillment_status', 'ready')
                ->whereDate('pickup_time', $date)
                ->whereTime('pickup_time', $time)
                ->count();

            $remaining = $config['max_orders'] - $bookedOrders;
            $available = $remaining > 0;

            $availableSlots[] = [
                'time' => $time,
                'datetime' => $slotDateTime->toIso8601String(),
                'label' => $config['label'],
                'available' => $available,
                'capacity' => $config['max_orders'],
                'booked' => $bookedOrders,
                'remaining' => max(0, $remaining),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date->toDateString(),
                'slots' => $availableSlots,
            ]
        ]);
    }

    /**
     * Check if a specific slot is available
     */
    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pickup_time' => 'required|date|after:now'
        ]);

        $pickupTime = Carbon::parse($validated['pickup_time']);
        $timeKey = $pickupTime->format('H:i');
        
        $slotConfig = config("pickup.slots.{$timeKey}");
        
        if (!$slotConfig) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid pickup time slot'
            ], 422);
        }

        // Count existing bookings
        $bookedOrders = Order::where('fulfillment_status', 'ready')
            ->whereDate('pickup_time', $pickupTime->toDateString())
            ->whereTime('pickup_time', $timeKey)
            ->count();

        $remaining = $slotConfig['max_orders'] - $bookedOrders;
        $available = $remaining > 0;

        if (!$available) {
            return response()->json([
                'success' => false,
                'message' => 'This time slot is fully booked. Please select another time.',
                'data' => [
                    'available' => false,
                    'capacity' => $slotConfig['max_orders'],
                    'booked' => $bookedOrders,
                ]
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Time slot is available',
            'data' => [
                'available' => true,
                'capacity' => $slotConfig['max_orders'],
                'booked' => $bookedOrders,
                'remaining' => $remaining,
            ]
        ]);
    }
}
