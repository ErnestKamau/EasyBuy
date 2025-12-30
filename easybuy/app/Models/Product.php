<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Product extends Model
{
    protected $fillable = [
        'name',
        'image_url',
        'category_id',
        'description',
        'kilograms',
        'cost_price',
        'sale_price',
        'in_stock',
        'minimum_stock',
        'is_active',
    ];

    protected $casts = [
        'kilograms' => 'decimal:3',
        'cost_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'in_stock' => 'integer',
        'minimum_stock' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the category that owns the product
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get all order items for this product
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Scope a query to only include active products
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include low stock products
     */
    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereColumn('in_stock', '<=', 'minimum_stock')
            ->where('minimum_stock', '>', 0);
    }

    /**
     * Check if product is low on stock
     */
    public function isLowStock(): bool
    {
        return $this->in_stock <= $this->minimum_stock && $this->minimum_stock > 0;
    }

    /**
     * Calculate profit margin percentage
     */
    public function getProfitMarginAttribute(): float
    {
        if ($this->cost_price > 0 && $this->sale_price > 0) {
            return (($this->sale_price - $this->cost_price) / $this->cost_price) * 100;
        }
        return 0;
    }

    /**
     * Scope for searching products
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where('name', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%");
    }
}
