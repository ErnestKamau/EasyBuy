<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendPickupRemindersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // 1. Remind 1 hour before pickup
        $ordersUpcoming = Order::where('fulfillment_status', 'ready')
            ->whereNotNull('pickup_time')
            ->where('pickup_time', '>', Carbon::now())
            ->where('pickup_time', '<=', Carbon::now()->addHour())
            ->where('reminder_sent', false) // Need to add this column or check notification history
            ->get();

        foreach ($ordersUpcoming as $order) {
            try {
                // Send push notification
                if ($order->user_id) {
                    NotificationService::create(
                        $order->user_id,
                        'order_update',
                        'Pickup Reminder',
                        "Your order {$order->order_number} is scheduled for pickup at " . Carbon::parse($order->pickup_time)->format('H:i'),
                        ['order_id' => $order->id],
                        'high'
                    );
                    
                    // Mark as reminder sent (using cache or updating order based on implementation preference)
                    // For now, we'll update the order assuming we add the column or just rely on this
                     $order->update(['reminder_sent' => true]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send pickup reminder', ['order_id' => $order->id, 'error' => $e->getMessage()]);
            }
        }
    }
}
