<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'kilogram',
        'unit_price',
    ];

    protected $casts = [
        'kilogram' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    /**
     * Accessors to append to model's array/JSON form
     */
    protected $appends = ['subtotal'];

    /**
     * Get the order that owns this item
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the product for this item
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Calculate subtotal for this item
     */
    public function getSubtotalAttribute(): float
    {
        if ($this->kilogram) {
            return (float) ($this->unit_price * $this->kilogram);
        }
        return (float) ($this->unit_price * $this->quantity);
    }
}
