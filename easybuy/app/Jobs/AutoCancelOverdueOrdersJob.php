<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\WalletTransaction;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoCancelOverdueOrdersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $graceHours = config('pickup.auto_cancel_hours', 24); // Default 24 hours grace period

        $overdueOrders = Order::where('fulfillment_status', 'ready')
            ->whereNotNull('pickup_time')
            ->where('pickup_time', '<', Carbon::now()->subHours($graceHours))
            ->get();

        foreach ($overdueOrders as $order) {
            DB::beginTransaction();
            try {
                // Refund if paid
                if ($order->sale && $order->sale->total_paid > 0) {
                    WalletTransaction::createTransaction(
                        $order->user_id,
                        (float) $order->sale->total_paid,
                        'refund',
                        "Refund for auto-cancelled order {$order->order_number} (Missed Pickup)",
                        $order->id,
                        $order->sale->id
                    );
                }

                // Cancel order logic (restock items)
                foreach ($order->items as $item) {
                    $item->product->increment('in_stock', $item->quantity); // Simplified logic, should match Order::cancelAndRestock
                }
                
                $order->update([
                    'order_status' => 'cancelled',
                    'fulfillment_status' => 'cancelled',
                    'notes' => ($order->notes ? $order->notes . "\n" : "") . "Auto-cancelled due to missed pickup."
                ]);

                // Notify user
                if ($order->user_id) {
                    NotificationService::create(
                        $order->user_id,
                        'order_update',
                        'Order Cancelled',
                        "Your order {$order->order_number} has been cancelled because it was not picked up. Any payments have been refunded to your wallet.",
                        ['order_id' => $order->id],
                        'high'
                    );
                }

                DB::commit();
                Log::info('Auto-cancelled overdue order', ['order_id' => $order->id]);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to auto-cancel overdue order', ['order_id' => $order->id, 'error' => $e->getMessage()]);
            }
        }
    }
}
