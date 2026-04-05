<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Broadcasts to the private channel for a specific order.
     * Only the customer, admin, and the assigned driver can listen (see channels.php).
     *
     * Why private channel? Prevents strangers from tracking drivers.
     */
    public function __construct(
        public readonly int   $orderId,
        public readonly int   $driverId,
        public readonly array $location
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("order.{$this->orderId}");
    }

    /**
     * Custom event name — prefixed with '.' by Echo to distinguish from class-based events.
     * React Native listens with: .listen('.driver.location.updated', ...)
     */
    public function broadcastAs(): string
    {
        return 'driver.location.updated';
    }

    /**
     * Only the location payload is broadcast — no server-side model data exposed.
     */
    public function broadcastWith(): array
    {
        return [
            'driver_id' => $this->driverId,
            'location'  => $this->location,
        ];
    }
}
