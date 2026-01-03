<?php

namespace App\Events;

use App\Models\Sale;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DebtWarning implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sale;
    public $isAdmin;

    /**
     * Create a new event instance.
     */
    public function __construct(Sale $sale, bool $isAdmin = false)
    {
        $this->sale = $sale;
        $this->isAdmin = $isAdmin;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        if ($this->isAdmin) {
            return [
                new PrivateChannel('admin.notifications'),
            ];
        } else {
            $userId = $this->sale->order?->user_id;
            if ($userId) {
                return [
                    new PrivateChannel('user.' . $userId . '.notifications'),
                ];
            }
        }
        return [];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'debt.warning';
    }
}
