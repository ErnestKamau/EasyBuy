<?php

namespace App\Events;

use App\Models\Sale;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SaleFullyPaid
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sale;

    /**
     * Create a new event instance.
     */
    public function __construct(Sale $sale)
    {
        $this->sale = $sale;
    }
}
