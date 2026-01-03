<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Sale;
use App\Events\PaymentReceived;
use App\Events\PaymentRefunded;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Exceptions\PaymentAmountExceedsBalanceException;

class PaymentController extends Controller
{
    /**
     * Get all payments with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['sale.order.user', 'mpesaTransaction']);

        // Sale filter
        if ($request->has('sale_id')) {
            $query->where('sale_id', $request->sale_id);
        }

        // Payment method filter
        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Date range
        if ($request->has('date_from')) {
            $query->where('paid_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('paid_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 15);
        $payments = $query->latest('paid_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    /**
     * Get single payment
     */
    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['sale.order.user', 'mpesaTransaction']);

        return response()->json([
            'success' => true,
            'data' => $payment
        ]);
    }

    /**
     * Add payment to sale
     */
    public function store(Request $request, Sale $sale): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:mpesa,cash,card',
            'amount' => 'required|numeric|min:0.01',
            'phone_number' => 'required_if:payment_method,mpesa|string|regex:/^254\d{9}$/',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Validate amount doesn't exceed balance
            Payment::validateAmount($sale, (float) $validated['amount']);

            // Create payment (set status to pending initially)
            $payment = Payment::create([
                'sale_id' => $sale->id,
                'payment_method' => $validated['payment_method'],
                'amount' => $validated['amount'],
                'reference' => $validated['reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'pending',
            ]);

            // If cash payment, mark as completed immediately (this will update total_paid)
            if ($validated['payment_method'] === 'cash') {
                $payment->markAsCompleted();
                // Refresh payment and sale to get updated data
                $payment->refresh();
                $payment->sale->refresh();
            }
            // For M-Pesa, the MpesaController will handle the STK push and update status

            DB::commit();

            // Refresh payment and sale to ensure we have the latest data after transaction commit
            $payment->refresh();
            if ($payment->sale) {
                $payment->sale->refresh();
                // Ensure total_paid is recalculated after transaction commit
                $payment->sale->recalculateTotalPaid();
                $payment->sale->updatePaymentStatus();
            }

            // Dispatch event for email notification
            if ($payment->status === 'completed') {
                event(new PaymentReceived($payment));
            }

            // Reload all relationships including refreshed sale data
            $payment->load(['sale.order.user', 'mpesaTransaction']);

            return response()->json([
                'success' => true,
                'message' => 'Payment created successfully',
                'data' => $payment
            ], 201);

        } catch (PaymentAmountExceedsBalanceException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Verify payment
     */
    public function verify(Payment $payment): JsonResponse
    {
        // This would verify with the payment provider
        // For now, just return payment status
        return response()->json([
            'success' => true,
            'data' => [
                'payment' => $payment->load(['sale', 'mpesaTransaction']),
                'is_verified' => $payment->status === 'completed',
            ]
        ]);
    }

    /**
     * Process full refund
     */
    public function refund(Payment $payment): JsonResponse
    {
        if (!$payment->canRefund()) {
            return response()->json([
                'success' => false,
                'message' => 'Payment cannot be refunded'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $payment->processRefund();

            DB::commit();

            // Dispatch event for refund notification
            event(new PaymentRefunded($payment));

            return response()->json([
                'success' => true,
                'message' => 'Payment refunded successfully',
                'data' => $payment->load(['sale'])
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
     * Get payment summary
     */
    public function summary(Request $request): JsonResponse
    {
        try {
            $date = $request->get('date', now()->format('Y-m-d'));
            $startOfDay = \Carbon\Carbon::parse($date)->startOfDay();
            $endOfDay = \Carbon\Carbon::parse($date)->endOfDay();

            $payments = Payment::whereBetween('paid_at', [$startOfDay, $endOfDay])
                ->where('status', 'completed');

            $cashTotal = (clone $payments)->where('payment_method', 'cash')->sum('amount');
            $mpesaTotal = (clone $payments)->where('payment_method', 'mpesa')->sum('amount');
            $cardTotal = (clone $payments)->where('payment_method', 'card')->sum('amount');
            $totalPayments = $payments->sum('amount');
            $transactionCount = $payments->count();

            $recentPayments = Payment::whereBetween('paid_at', [$startOfDay, $endOfDay])
                ->where('status', 'completed')
                ->with(['sale.order.user'])
                ->orderBy('paid_at', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'date' => $date,
                    'total_payments' => (float) $totalPayments,
                    'cash_total' => (float) $cashTotal,
                    'mpesa_total' => (float) $mpesaTotal,
                    'card_total' => (float) $cardTotal,
                    'transaction_count' => $transactionCount,
                    'recent_payments' => $recentPayments,
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
