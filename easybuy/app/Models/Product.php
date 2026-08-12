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
        'kilograms_in_stock',
        'cost_price',
        'sale_price',
        'in_stock',
        'minimum_stock',
        'is_active',
    ];

    protected $appends = ['profit_margin', 'is_low_stock', 'category_name'];

    protected $casts = [
        'kilograms_in_stock' => 'decimal:3',
        'cost_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'in_stock' => 'decimal:3',
        'minimum_stock' => 'decimal:3',
        'is_active' => 'boolean',
    ];

    public function getImageUrlAttribute(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        $relative = $value;
        if (preg_match('#/(?:api/media|storage)/(.+)$#', $value, $m)) {
            $relative = $m[1];
        } else {
            $relative = ltrim($value, '/');
            $relative = preg_replace('#^storage/#', '', $relative);
        }

        $host = rtrim((string) config('app.url'), '/');
        try {
            if (request()) {
                $host = rtrim(request()->getSchemeAndHttpHost(), '/');
            }
        } catch (\Throwable $e) {
            // keep configured APP_URL
        }

        return $host . '/api/media/' . ltrim($relative, '/');
    }

    public function setImageUrlAttribute(?string $value): void
    {
        if (!$value) {
            $this->attributes['image_url'] = null;
            return;
        }
        if (preg_match('#/(?:api/media|storage)/(.+)$#', $value, $m)) {
            $this->attributes['image_url'] = $m[1];
            return;
        }
        $this->attributes['image_url'] = $value;
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->isLowStock();
    }

    public function getCategoryNameAttribute(): ?string
    {
        return $this->category?->name;
    }

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
            ->whereNotNull('minimum_stock')
            ->where('minimum_stock', '>', 0);
    }

    /**
     * Check if product is low on stock
     */
    public function isLowStock(): bool
    {
        return $this->minimum_stock !== null 
            && $this->minimum_stock > 0 
            && $this->in_stock <= $this->minimum_stock;
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
