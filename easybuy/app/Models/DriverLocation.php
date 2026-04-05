<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DriverLocation extends Model
{
    /**
     * This table is an append-only GPS history log.
     * Never update rows — only insert.
     * Uses UUID primary key for security (no sequential ID exposure).
     */
    public $incrementing = false;
    protected $keyType = 'string';

    // No updated_at — append-only log
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'driver_id',
        'order_id',
        'latitude',
        'longitude',
        'heading',
        'speed',
        'recorded_at',
    ];

    protected $casts = [
        'latitude'    => 'decimal:8',
        'longitude'   => 'decimal:8',
        'heading'     => 'decimal:2',
        'speed'       => 'decimal:2',
        'recorded_at' => 'datetime',
        'created_at'  => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
