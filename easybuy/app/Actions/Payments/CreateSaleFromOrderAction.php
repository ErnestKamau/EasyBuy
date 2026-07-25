<?php

namespace App\Actions\Payments;

use App\Events\SaleCreated;
use App\Models\Order;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class CreateSaleFromOrderAction
{
    /**
     * Create a Sale (and SaleItems) from a confirmed order.
     * Returns the existing sale if one already exists for the order.
     */
    public function execute(Order $order, bool $fireCreatedEvent = true): Sale
    {
        $order->loadMissing(['items.product', 'sale']);

        if ($order->sale) {
            return $order->sale;
        }

        if ($order->order_status !== 'confirmed') {
            throw ValidationException::withMessages([
                'order' => 'Order must be confirmed before creating a sale',
            ]);
        }

        $totalAmount = 0;
        $costAmount = 0;

        foreach ($order->items as $orderItem) {
            $totalAmount += $orderItem->subtotal;

            $product = $orderItem->product;
            if ($orderItem->kilogram) {
                $costAmount += (float) ($product->cost_price * $orderItem->kilogram);
            } else {
                $costAmount += (float) ($product->cost_price * $orderItem->quantity);
            }
        }

        $paymentStatus = 'no-payment';
        $dueDate = null;

        if ($order->payment_status === 'fully-paid') {
            $paymentStatus = 'fully-paid';
        } elseif ($order->payment_status === 'partially-paid') {
            $paymentStatus = 'partial-payment';
        } elseif ($order->payment_status === 'debt') {
            $paymentStatus = 'no-payment';
            $dueDate = Carbon::now()->addDays(7);
        } elseif ($order->payment_status === 'pending') {
            $paymentStatus = 'no-payment';
        }

        $sale = Sale::create([
            'order_id' => $order->id,
            'total_amount' => $totalAmount,
            'cost_amount' => $costAmount,
            'profit_amount' => $totalAmount - $costAmount,
            'payment_status' => $paymentStatus,
            'due_date' => $dueDate,
        ]);

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

        $sale->syncOrderPaymentStatus();

        if ($fireCreatedEvent) {
            event(new SaleCreated($sale));
        }

        return $sale->load(['order.user', 'items.product']);
    }
}
