<?php

namespace App\Listeners;

use App\Events\SaleFullyPaid;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateSaleFullyPaidNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(SaleFullyPaid $event): void
    {
        $sale = $event->sale;
        $order = $sale->order;

        if ($order && $order->user_id) {
            // Create notification for customer
            NotificationService::create(
                $order->user_id,
                'sale_fully_paid',
                'Payment Complete',
                "Your sale {$sale->sale_number} has been fully paid. Thank you!",
                [
                    'sale_id' => $sale->id,
                    'order_id' => $order->id,
                ],
                'medium'
            );
        }
    }
}
