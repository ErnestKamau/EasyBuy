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
                'Fully settled.',
                "{$sale->sale_number} is paid in full. Nothing else is due — thank you.",
                [
                    'sale_id' => $sale->id,
                    'order_id' => $order->id,
                ],
                'medium'
            );
        }
    }
}
