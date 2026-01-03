<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Carbon\Carbon;
use App\Exceptions\InsufficientStockException;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'user_id',
        'order_status',
        'payment_status',
        'order_date',
        'order_time',
        'notes',
    ];

    protected $casts = [
        'order_date' => 'date',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = static::generateOrderNumber();
            }
            if (empty($order->order_date)) {
                $order->order_date = Carbon::today();
            }
            if (empty($order->order_time)) {
                $order->order_time = Carbon::now()->format('H:i:s');
            }
        });
    }

    /**
     * Generate unique order number
     */
    public static function generateOrderNumber(): string
    {
        $year = Carbon::now()->format('Y');
        $lastOrder = static::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastOrder ? ((int) substr($lastOrder->order_number, -3)) + 1 : 1;

        return sprintf('ORD-%s-%03d', $year, $sequence);
    }

    /**
     * Get the user that owns the order
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all items in this order
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the sale for this order (one-to-one)
     */
    public function sale(): HasOne
    {
        return $this->hasOne(Sale::class);
    }

    /**
     * Calculate total order amount
     */
    public function getTotalAmountAttribute(): float
    {
        return $this->items->sum(function ($item) {
            return $item->subtotal;
        });
    }

    /**
     * Check if order can be confirmed
     */
    public function canBeConfirmed(): bool
    {
        return $this->order_status === 'pending' && $this->items()->count() > 0;
    }

    /**
     * Confirm the order
     */
    public function confirm(): bool
    {
        if (!$this->canBeConfirmed()) {
            return false;
        }

        // Update stock for each item
        foreach ($this->items as $item) {
            $product = $item->product;
            if ($item->kilogram) {
                // For items sold by weight, check if we have enough stock (decimal comparison)
                $kilogramValue = (float) $item->kilogram;
                $currentStock = (float) $product->in_stock;
                
                if ($currentStock < $kilogramValue) {
                    throw new InsufficientStockException($product->name);
                }
                // Decrement with decimal precision - ensure proper decimal arithmetic
                $newStock = $currentStock - $kilogramValue;
                $product->in_stock = round($newStock, 3); // Round to 3 decimal places to match database precision
                $product->save();
            } else {
                // For quantity-based products
                if ($product->in_stock < $item->quantity) {
                    throw new InsufficientStockException($product->name);
                }
                // For quantity-based, in_stock should be integer, but handle as decimal for consistency
                $currentStock = (float) $product->in_stock;
                $newStock = $currentStock - (float) $item->quantity;
                $product->in_stock = round($newStock, 3);
                $product->save();
            }
        }

        $this->order_status = 'confirmed';
        return $this->save();
    }
}
