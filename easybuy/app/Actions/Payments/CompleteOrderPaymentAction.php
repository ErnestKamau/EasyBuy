<?php

namespace App\Actions\Payments;

use App\Events\PaymentReceived;
use App\Events\SaleCreated;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;

class CompleteOrderPaymentAction
{
    public function __construct(
        private CreateSaleFromOrderAction $createSaleFromOrder
    ) {}

    /**
     * Mark a payment completed and ensure order confirmation + sale linkage.
     * Idempotent: if already completed and linked, returns without re-firing events.
     */
    public function execute(Payment $payment, bool $dispatchEvent = true): Payment
    {
        $payment->loadMissing(['order.items.product', 'order.sale', 'sale', 'order.user']);

        $wasAlreadyCompleted = $payment->status === 'completed';

        if (!$wasAlreadyCompleted) {
            $payment->status = 'completed';
            $payment->paid_at = $payment->paid_at ?? now();
            // Save without triggering recursive sync that fights this action.
            $payment->saveQuietly();
        }

        // Sale-linked payments: recalculate ledger
        if ($payment->sale_id) {
            $payment->load('sale');
            if ($payment->sale) {
                $payment->sale->recalculateTotalPaid();
                $payment->sale->updatePaymentStatus();
            }

            if (!$wasAlreadyCompleted && $dispatchEvent) {
                event(new PaymentReceived($payment->fresh(['sale.order.user', 'mpesaTransaction'])));
            }

            return $payment->fresh(['sale', 'order', 'mpesaTransaction']);
        }

        // Pre-sale / order-linked payments
        if ($payment->order_id && $payment->order) {
            $order = $payment->order;
            $order->refresh();
            $order->load(['items.product', 'sale', 'user']);

            $paidAmount = (float) Payment::where('order_id', $order->id)
                ->where('status', 'completed')
                ->sum('amount');

            $orderTotal = (float) $order->total_amount;
            // Include delivery fee when present
            $orderTotal += (float) ($order->delivery_fee ?? 0);

            if ($paidAmount >= $orderTotal && $orderTotal > 0) {
                $order->payment_status = 'fully-paid';
            } elseif ($paidAmount > 0) {
                $order->payment_status = 'partially-paid';
            }

            if ($order->order_status === 'pending' && $paidAmount > 0) {
                try {
                    $order->confirm();
                } catch (\Exception $e) {
                    Log::error('Failed to auto-confirm order after payment', [
                        'order_id' => $order->id,
                        'payment_id' => $payment->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $order->save();
            $order->refresh();

            // Create sale once order is confirmed and none exists
            if ($order->order_status === 'confirmed') {
                $saleExisted = (bool) $order->sale;
                $sale = $this->createSaleFromOrder->execute($order, false);
                if (!$payment->sale_id) {
                    $payment->sale_id = $sale->id;
                    $payment->saveQuietly();
                }
                // Also link any other completed order payments to this sale
                Payment::where('order_id', $order->id)
                    ->whereNull('sale_id')
                    ->where('status', 'completed')
                    ->update(['sale_id' => $sale->id]);

                $sale->recalculateTotalPaid();
                $sale->updatePaymentStatus();

                if (!$saleExisted) {
                    event(new SaleCreated($sale->fresh(['order.user', 'items.product', 'payments'])));
                }
            }
        }

        if (!$wasAlreadyCompleted && $dispatchEvent) {
            event(new PaymentReceived($payment->fresh(['sale.order.user', 'order.user', 'mpesaTransaction'])));
        }

        return $payment->fresh(['sale', 'order', 'mpesaTransaction']);
    }
}
