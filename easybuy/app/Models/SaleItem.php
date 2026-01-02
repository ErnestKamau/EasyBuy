<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'kilogram',
        'unit_price',
        'cost_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'kilogram' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
    ];

    /**
     * Get the sale that owns this item
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
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

    /**
     * Calculate profit for this item
     */
    public function getProfitAttribute(): float
    {
        $subtotal = $this->subtotal;
        if ($this->kilogram) {
            $costTotal = (float) ($this->cost_price * $this->kilogram);
        } else {
            $costTotal = (float) ($this->cost_price * $this->quantity);
        }
        return $subtotal - $costTotal;
    }
}
