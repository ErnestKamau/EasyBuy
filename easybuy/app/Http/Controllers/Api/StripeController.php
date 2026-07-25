<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Actions\Payments\CompleteOrderPaymentAction;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\Order;
use App\Services\StripeService;
use App\Events\PaymentRefunded;
use App\Exceptions\PaymentAmountExceedsBalanceException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class StripeController extends Controller
{
    public function __construct(
        protected StripeService $stripeService
    ) {}

    /**
     * Create a PaymentIntent for an order or sale.
     */
    public function createIntent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sale_id' => 'nullable|exists:sales,id',
            'order_id' => 'nullable|exists:orders,id',
            'amount' => 'required|numeric|min:0.01',
        ]);

        if (empty($validated['sale_id']) && empty($validated['order_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Either sale_id or order_id is required',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $sale = null;
            $order = null;
            $amount = (float) $validated['amount'];
            $metadata = [];

            if (!empty($validated['sale_id'])) {
                $sale = Sale::findOrFail($validated['sale_id']);
                Payment::validateAmount($sale, $amount);
                $metadata = [
                    'sale_id' => (string) $sale->id,
                    'sale_number' => $sale->sale_number,
                ];
            } else {
                $order = Order::with(['items', 'user', 'sale'])->findOrFail($validated['order_id']);
                if ($order->sale) {
                    $sale = $order->sale;
                    Payment::validateAmount($sale, $amount);
                    $metadata = [
                        'sale_id' => (string) $sale->id,
                        'order_id' => (string) $order->id,
                    ];
                } else {
                    $orderTotal = (float) $order->total_amount + (float) ($order->delivery_fee ?? 0);
                    $walletCredit = $order->user ? max(0, (float) $order->user->wallet_balance) : 0.0;
                    $amountDue = max(0, $orderTotal - $walletCredit);
                    $alreadyPaid = (float) Payment::where('order_id', $order->id)
                        ->where('status', 'completed')
                        ->sum('amount');
                    $remaining = max(0, $amountDue - $alreadyPaid);

                    if ($amount > $remaining + 0.01) {
                        throw new \InvalidArgumentException(
                            'Payment amount KES ' . number_format($amount, 2) .
                            ' exceeds remaining order balance KES ' . number_format($remaining, 2)
                        );
                    }

                    $metadata = [
                        'order_id' => (string) $order->id,
                        'order_number' => $order->order_number,
                    ];
                }
            }

            // Reuse pending card payment with same amount if intent still open
            $existingQuery = Payment::where('payment_method', 'card')
                ->where('status', 'pending')
                ->where('amount', $amount)
                ->whereNotNull('stripe_payment_intent_id');

            if ($sale) {
                $existingQuery->where('sale_id', $sale->id);
            } else {
                $existingQuery->where('order_id', $order->id)->whereNull('sale_id');
            }

            $existing = $existingQuery->latest()->first();
            if ($existing) {
                $intent = $this->stripeService->retrievePaymentIntent($existing->stripe_payment_intent_id);
                if (in_array($intent->status, ['requires_payment_method', 'requires_confirmation', 'requires_action'])) {
                    DB::commit();
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'client_secret' => $intent->client_secret,
                            'payment_intent_id' => $intent->id,
                            'payment_id' => $existing->id,
                        ],
                    ]);
                }
            }

            $paymentIntent = $this->stripeService->createPaymentIntent($amount, 'kes', $metadata);

            $payment = Payment::create([
                'sale_id' => $sale?->id,
                'order_id' => $order && !$sale ? $order->id : ($order?->id),
                'payment_method' => 'card',
                'amount' => $amount,
                'stripe_payment_intent_id' => $paymentIntent->id,
                'status' => 'pending',
                'paid_at' => Carbon::now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'client_secret' => $paymentIntent->client_secret,
                    'payment_intent_id' => $paymentIntent->id,
                    'payment_id' => $payment->id,
                ],
            ]);
        } catch (PaymentAmountExceedsBalanceException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Stripe Intent Creation Error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Failed to create payment intent',
            ], 500);
        }
    }

    /**
     * Client-side confirm after Payment Sheet succeeds (optimistic).
     * Webhook remains source of truth.
     */
    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        try {
            $paymentIntent = $this->stripeService->retrievePaymentIntent($validated['payment_intent_id']);
            $payment = Payment::where('stripe_payment_intent_id', $validated['payment_intent_id'])->first();

            if (!$payment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment not found',
                ], 404);
            }

            if ($paymentIntent->status === 'succeeded') {
                if ($payment->status !== 'completed') {
                    app(CompleteOrderPaymentAction::class)->execute($payment);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Payment confirmed successfully',
                    'data' => $payment->fresh(['sale', 'order']),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Payment not succeeded',
                'status' => $paymentIntent->status,
            ], 422);
        } catch (\Exception $e) {
            Log::error('Stripe Confirmation Error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm payment',
            ], 500);
        }
    }

    /**
     * Stripe webhook — source of truth for payment status.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $sigHeader,
                $webhookSecret
            );
        } catch (\Exception $e) {
            Log::error('Stripe Webhook Signature Verification Failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        try {
            switch ($event->type) {
                case 'payment_intent.succeeded':
                    $this->handlePaymentSuccess($event->data->object);
                    break;

                case 'payment_intent.payment_failed':
                    $this->handlePaymentFailure($event->data->object);
                    break;

                case 'charge.refunded':
                    $this->handleRefund($event->data->object);
                    break;
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Stripe Webhook Processing Error', [
                'error' => $e->getMessage(),
                'event_type' => $event->type,
            ]);
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    private function handlePaymentSuccess(object $paymentIntent): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if ($payment && $payment->status !== 'completed') {
            app(CompleteOrderPaymentAction::class)->execute($payment);
        }
    }

    private function handlePaymentFailure(object $paymentIntent): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if ($payment && $payment->status === 'pending') {
            $payment->markAsFailed();
        }
    }

    private function handleRefund(object $charge): void
    {
        $intentId = is_string($charge->payment_intent)
            ? $charge->payment_intent
            : ($charge->payment_intent->id ?? null);

        if (!$intentId) {
            return;
        }

        $payment = Payment::where('stripe_payment_intent_id', $intentId)->first();

        if ($payment && $payment->canRefund()) {
            $payment->processRefund();
            event(new PaymentRefunded($payment));
        }
    }
}
