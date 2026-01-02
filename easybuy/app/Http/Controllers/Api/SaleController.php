<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Order;
use App\Events\SaleCreated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class SaleController extends Controller
{
    /**
     * Get all sales with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Sale::with(['order.user', 'items.product', 'payments']);

        // Status filter
        if ($request->has('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Date range
        if ($request->has('date_from')) {
            $query->where('made_on', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('made_on', '<=', $request->date_to);
        }

        // Overdue filter
        if ($request->boolean('overdue_only')) {
            $query->where('payment_status', 'overdue')
                ->orWhere(function ($q) {
                    $q->where('due_date', '<', Carbon::now())
                        ->whereIn('payment_status', ['no-payment', 'partial-payment']);
                });
        }

        // Unpaid filter
        if ($request->boolean('unpaid_only')) {
            $query->where('payment_status', '!=', 'fully-paid');
        }

        $perPage = $request->get('per_page', 15);
        $sales = $query->latest('made_on')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $sales
        ]);
    }

    /**
     * Get single sale
     */
    public function show(Sale $sale): JsonResponse
    {
        $sale->load(['order.user', 'items.product', 'payments.mpesaTransaction']);

        return response()->json([
            'success' => true,
            'data' => $sale
        ]);
    }

    /**
     * Create sale from confirmed order
     */
    public function createFromOrder(Order $order): JsonResponse
    {
        // Check if order is confirmed
        if ($order->order_status !== 'confirmed') {
            return response()->json([
                'success' => false,
                'message' => 'Order must be confirmed before creating a sale'
            ], 422);
        }

        // Check if sale already exists
        if ($order->sale) {
            return response()->json([
                'success' => false,
                'message' => 'Sale already exists for this order'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Calculate totals from order items
            $totalAmount = 0;
            $costAmount = 0;

            foreach ($order->items as $orderItem) {
                $subtotal = $orderItem->subtotal;
                $totalAmount += $subtotal;

                // Calculate cost (assuming cost_price is stored in product)
                $product = $orderItem->product;
                if ($orderItem->kilogram) {
                    $costAmount += (float) ($product->cost_price * $orderItem->kilogram);
                } else {
                    $costAmount += (float) ($product->cost_price * $orderItem->quantity);
                }
            }

            $profitAmount = $totalAmount - $costAmount;

            // Determine initial payment status
            $paymentStatus = 'no-payment';
            if ($order->payment_status === 'paid') {
                $paymentStatus = 'fully-paid';
            } elseif ($order->payment_status === 'debt') {
                $paymentStatus = 'no-payment';
            }

            // Create sale
            $sale = Sale::create([
                'order_id' => $order->id,
                'total_amount' => $totalAmount,
                'cost_amount' => $costAmount,
                'profit_amount' => $profitAmount,
                'payment_status' => $paymentStatus,
            ]);

            // Create sale items from order items
            foreach ($order->items as $orderItem) {
                $product = $orderItem->product;
                $sale->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $orderItem->quantity,
                    'kilogram' => $orderItem->kilogram,
                    'unit_price' => $orderItem->unit_price,
                    'cost_price' => $product->cost_price,
                ]);
            }

            DB::commit();

            // Dispatch event for receipt generation and email
            event(new SaleCreated($sale));

            $sale->load(['order.user', 'items.product']);

            return response()->json([
                'success' => true,
                'message' => 'Sale created successfully',
                'data' => $sale
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Download receipt
     */
    public function downloadReceipt(Sale $sale): JsonResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        if (!$sale->receipt_generated) {
            return response()->json([
                'success' => false,
                'message' => 'Receipt not generated yet'
            ], 404);
        }

        $receiptPath = "receipts/{$sale->sale_number}.pdf";

        if (!Storage::exists($receiptPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Receipt file not found'
            ], 404);
        }

        return Storage::download($receiptPath, "receipt-{$sale->sale_number}.pdf");
    }

    /**
     * Get sales analytics
     */
    public function analytics(Request $request): JsonResponse
    {
        try {
            $days = (int) $request->get('days', 30);
            $startDate = Carbon::now()->subDays($days);

            $sales = Sale::where('made_on', '>=', $startDate);

            // Basic metrics
            $totalSales = $sales->count();
            $totalRevenue = $sales->sum('total_amount');
            $totalCost = $sales->sum('cost_amount');
            $totalProfit = $sales->sum('profit_amount');
            $profitMargin = $totalRevenue > 0 ? ($totalProfit / $totalRevenue) * 100 : 0;

            // Payment status breakdown
            $paymentStatusBreakdown = [
                'fully-paid' => $sales->where('payment_status', 'fully-paid')->count(),
                'partial-payment' => $sales->where('payment_status', 'partial-payment')->count(),
                'no-payment' => $sales->where('payment_status', 'no-payment')->count(),
                'overdue' => $sales->where('payment_status', 'overdue')->count(),
            ];

            // Daily sales for chart (last 7 days)
            $dailySales = [];
            for ($i = 6; $i >= 0; $i--) {
                $day = Carbon::now()->subDays($i);
                $dayStart = $day->copy()->startOfDay();
                $dayEnd = $day->copy()->endOfDay();

                $daySales = $sales->whereBetween('made_on', [$dayStart, $dayEnd])->get();

                $dailySales[] = [
                    'date' => $day->format('Y-m-d'),
                    'sales_count' => $daySales->count(),
                    'revenue' => (float) $daySales->sum('total_amount'),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total_sales' => $totalSales,
                    'total_revenue' => (float) $totalRevenue,
                    'total_cost' => (float) $totalCost,
                    'total_profit' => (float) $totalProfit,
                    'profit_margin' => (float) $profitMargin,
                    'payment_status_breakdown' => $paymentStatusBreakdown,
                    'daily_sales' => $dailySales,
                    'period_days' => $days,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get overdue sales
     */
    public function overdue(): JsonResponse
    {
        try {
            $overdueSales = Sale::with(['order.user', 'items.product'])
                ->where(function ($query) {
                    $query->where('payment_status', 'overdue')
                        ->orWhere(function ($q) {
                            $q->where('due_date', '<', Carbon::now())
                                ->whereIn('payment_status', ['no-payment', 'partial-payment']);
                        });
                })
                ->orderBy('due_date')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $overdueSales,
                'count' => $overdueSales->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unpaid sales
     */
    public function unpaid(): JsonResponse
    {
        try {
            $unpaidSales = Sale::with(['order.user', 'items.product'])
                ->where('payment_status', '!=', 'fully-paid')
                ->orderBy('made_on')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $unpaidSales,
                'count' => $unpaidSales->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all debts
     */
    public function debts(): JsonResponse
    {
        try {
            $debts = Sale::with(['order.user', 'items.product'])
                ->whereNotNull('due_date')
                ->where('payment_status', '!=', 'fully-paid')
                ->orderBy('due_date')
                ->get();

            // Add days remaining for each debt
            $debtsData = $debts->map(function ($debt) {
                $debtData = $debt->toArray();
                $debtData['days_remaining'] = $debt->days_remaining;
                $debtData['is_near_due'] = $debt->is_near_due;
                $debtData['is_overdue'] = $debt->is_overdue;
                return $debtData;
            });

            return response()->json([
                'success' => true,
                'data' => $debtsData,
                'count' => $debts->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
