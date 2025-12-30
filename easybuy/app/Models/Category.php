<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'name',
        'is_active',
    ];

    protected $cast = [
        'is_active' => 'boolean',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get only active products in this category
     */
    public function activeProducts(): HasMany
    {
        return $this->products()->where('is_active',true);
    }
}
