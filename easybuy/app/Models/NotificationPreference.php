<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'enabled',
        'push_enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'push_enabled' => 'boolean',
    ];

    /**
     * Get the user that owns the preference
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get or create default preferences for a user
     */
    public static function getDefaultsForUser(int $userId, string $role = 'customer'): array
    {
        $defaults = [
            'order_placed' => ['enabled' => $role === 'admin', 'push_enabled' => $role === 'admin'],
            'order_confirmed' => ['enabled' => true, 'push_enabled' => true],
            'order_cancelled' => ['enabled' => true, 'push_enabled' => true],
            'debt_warning_2days' => ['enabled' => true, 'push_enabled' => true],
            'debt_warning_admin_2days' => ['enabled' => $role === 'admin', 'push_enabled' => $role === 'admin'],
            'debt_overdue' => ['enabled' => true, 'push_enabled' => true],
            'debt_overdue_admin' => ['enabled' => $role === 'admin', 'push_enabled' => $role === 'admin'],
            'payment_received' => ['enabled' => true, 'push_enabled' => true],
            'payment_received_admin' => ['enabled' => $role === 'admin', 'push_enabled' => $role === 'admin'],
            'sale_fully_paid' => ['enabled' => true, 'push_enabled' => true],
            'low_stock_alert' => ['enabled' => $role === 'admin', 'push_enabled' => $role === 'admin'],
            'refund_processed' => ['enabled' => true, 'push_enabled' => true],
            'new_product_available' => ['enabled' => false, 'push_enabled' => false], // Disabled by default
        ];

        return $defaults;
    }
}
