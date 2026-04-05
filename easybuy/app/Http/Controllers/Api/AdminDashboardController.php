<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class AdminDashboardController extends Controller
{
    /**
     * Get consolidated dashboard statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $today = Carbon::today();
            $startOfWeek = Carbon::now()->startOfWeek();
            $startOfMonth = Carbon::now()->startOfMonth();

            // 1. Revenue Metrics
            $revenueToday = Sale::where('made_on', '>=', $today)->sum('total_amount');
            $revenueThisWeek = Sale::where('made_on', '>=', $startOfWeek)->sum('total_amount');
            $revenueThisMonth = Sale::where('made_on', '>=', $startOfMonth)->sum('total_amount');

            // 2. Order Statistics
            $orderStats = [
                'total' => Order::count(),
                'pending' => Order::where('order_status', 'pending')->count(),
                'confirmed' => Order::where('order_status', 'confirmed')->count(),
                'cancelled' => Order::where('order_status', 'cancelled')->count(),
                'delivered' => Order::whereNotNull('delivered_at')->count(),
            ];

            // 3. Product Statistics
            $productStats = [
                'total' => Product::count(),
                'low_stock' => Product::lowStock()->count(),
                'out_of_stock' => Product::where('in_stock', '<=', 0)->count(),
            ];

            // 4. Rider Statistics
            // Get online riders from Redis (heartbeat < 2 min ago)
            $minScore = now()->subMinutes(2)->timestamp;
            $onlineRiderIds = Redis::zrangebyscore('drivers:online', $minScore, '+inf');
            
            $riderStats = [
                'total' => User::where('role', 'rider')->count(),
                'online' => count($onlineRiderIds),
                'active' => Order::whereIn('driver_id', $onlineRiderIds)
                                 ->whereIn('fulfillment_status', ['assigned', 'driver_accepted', 'en_route'])
                                 ->distinct('driver_id')
                                 ->count(),
            ];

            // 5. Sales Trend (Last 14 days)
            $dailySales = [];
            for ($i = 13; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $dateString = $date->format('Y-m-d');
                
                $dayStats = Sale::whereDate('made_on', $dateString)
                    ->select(
                        DB::raw('COUNT(*) as count'),
                        DB::raw('SUM(total_amount) as revenue')
                    )
                    ->first();

                $dailySales[] = [
                    'date' => $date->format('M d'),
                    'full_date' => $dateString,
                    'count' => $dayStats->count ?? 0,
                    'revenue' => (float) ($dayStats->revenue ?? 0),
                ];
            }

            // 6. Recent Activities
            $recentOrders = Order::with('user')
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'customer' => $order->user ? ($order->user->first_name . ' ' . $order->user->last_name) : 'Guest',
                        'amount' => $order->total_amount,
                        'status' => $order->order_status,
                        'created_at' => $order->created_at->diffForHumans(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'revenue' => [
                        'today' => (float) $revenueToday,
                        'this_week' => (float) $revenueThisWeek,
                        'this_month' => (float) $revenueThisMonth,
                    ],
                    'orders' => $orderStats,
                    'products' => $productStats,
                    'riders' => $riderStats,
                    'sales_trend' => $dailySales,
                    'recent_orders' => $recentOrders,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
