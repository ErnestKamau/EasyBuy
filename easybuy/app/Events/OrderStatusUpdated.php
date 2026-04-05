<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Fires whenever an order's fulfillment_status changes.
     * Used by:
     *  - Admin dashboard: live dispatch board updates
     *  - Customer app: status banner ("Rider is on the way!")
     *  - Driver app: order state changes (accepted, en_route, etc.)
     */
    public function __construct(public readonly Order $order) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("order.{$this->order->id}"),
            new PrivateChannel('admin.orders'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id'           => $this->order->id,
            'fulfillment_status' => $this->order->fulfillment_status,
            'driver'             => $this->order->driver ? [
                'id'                  => $this->order->driver->id,
                'name'                => $this->order->driver->first_name . ' ' . $this->order->driver->last_name,
                'vehicle_type'        => $this->order->driver->vehicle_type,
                'vehicle_registration'=> $this->order->driver->vehicle_registration,
            ] : null,
            'updated_at' => now()->toISOString(),
        ];
    }
}
