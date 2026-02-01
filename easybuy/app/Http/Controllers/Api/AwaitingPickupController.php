<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Sale;
use App\Models\Payment;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AwaitingPickupController extends Controller
{
    /**
     * Get all orders awaiting pickup (fulfillment_status = 'ready')
     * Sorted by pickup_time (earliest first - FIFO)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items.product', 'sale'])
            ->where('fulfillment_status', 'ready');

        // Date filter
        if ($request->has('date')) {
            $query->whereDate('pickup_time', $request->date);
        }

        // Sort by pickup_time (earliest first - first come first serve)
        $orders = $query->orderBy('pickup_time', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Verify QR code for pickup
     */
    public function verifyQrCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_code' => 'required|string'
        ]);

        $order = Order::verifyPickupQrCode($validated['qr_code']);

        if (!$order) {
           

 return response()->json([
                'success' => false,
                'message' => 'Invalid or expired QR code'
            ], 404);
        }

        $order->load(['user', 'items.product', 'sale']);

        return response()->json([
            'success' => true,
            'message' => 'Order verified successfully',
            'data' => $order
        ]);
    }

    /**
     * Add payment to order (in Awaiting Pickup)
     */
    public function addPayment(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,card,mpesa',
            'notes' => 'nullable|string'
        ]);

        if ($order->fulfillment_status !== 'ready') {
            return response()->json([
                'success' => false,
                'message' => 'Can only add payments to orders awaiting pickup'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Create sale if it doesn't exist
            if (!$order->sale) {
                $sale = Sale::create([
                    'order_id' => $order->id,
                    'total_amount' => $order->total_amount,
                    'total_paid' => 0,
                    'cost_amount' => $order->items->sum(function ($item) {
                        return $item->product->cost * ($item->kilogram ?: $item->quantity);
                    }),
                    'profit_amount' => 0,
                    'payment_status' => 'no-payment',
                    'fulfillment_status' => 'unfulfilled',
                ]);
            } else {
                $sale = $order->sale;
            }

            // Create payment linked to order and sale
            $payment = Payment::create([
                'order_id' => $order->id,
                'sale_id' => $sale->id,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
                'status' => 'completed'
            ]);

            // Recalculate sale totals
            $sale->recalculateTotalPaid();
            $sale->updatePaymentStatus();

            DB::commit();

            $order->load(['user', 'items.product', 'sale.payments']);

            return response()->json([
                'success' => true,
                'message' => 'Payment added successfully',
                'data' => [
                    'order' => $order,
                    'payment' => $payment
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Confirm pickup and convert to sale (final step)
     */
    public function confirmPickup(Order $order): JsonResponse
    {
        if ($order->fulfillment_status !== 'ready') {
            return response()->json([
                'success' => false,
                'message' => 'Order is not ready for pickup'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Ensure sale exists
            if (!$order->sale) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot confirm pickup - sale not created'
                ], 422);
            }

            $sale = $order->sale;

            // Process wallet adjustment (overpayment credit or underpayment debt)
            $sale->processWalletAdjustment();

            // Mark order as picked up
            $order->markAsPickedUp();

            // Mark sale as fulfilled
            $sale->markAsFulfilled();

            DB::commit();

            $order->load(['user', 'items.product', 'sale']);

            return response()->json([
                'success' => true,
                'message' => 'Pickup confirmed successfully',
                'data' => $order
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Cancel order with refund option
     */
    public function cancel(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string',
            'refund_to_wallet' => 'sometimes|boolean'
        ]);

        if (!$order->canBeCancelled()) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be cancelled'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // If payments exist, decide what to do with them
            if ($order->sale && $order->sale->total_paid > 0) {
                $refundToWallet = $validated['refund_to_wallet'] ?? true;

                if ($refundToWallet) {
                    // Refund to wallet
                    WalletTransaction::createTransaction(
                        $order->user_id,
                        (float) $order->sale->total_paid,
                        'refund',
                        "Refund for cancelled order {$order->order_number}",
                        $order->id,
                        $order->sale->id
                    );
                }
            }

            // Cancel and restock
            $order->cancelAndRestock($validated['reason']);

            DB::commit();

            $order->load(['user', 'items.product']);

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully',
                'data' => $order
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get overdue orders (past pickup time + grace period)
     */
    public function overdue(Request $request): JsonResponse
    {
        $graceHours = config('pickup.auto_cancel_hours', 12);

        $orders = Order::with(['user', 'items.product'])
            ->where('fulfillment_status', 'ready')
            ->whereNotNull('pickup_time')
            ->where('pickup_time', '<', Carbon::now()->subHours($graceHours))
            ->orderBy('pickup_time', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
            'meta' => [
                'grace_hours' => $graceHours,
                'count' => $orders->count()
            ]
        ]);
    }
}
