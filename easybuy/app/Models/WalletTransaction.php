<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class WalletTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'sale_id',
        'amount',
        'type',
        'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    /**
     * Get the user that owns the transaction
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the order associated with the transaction
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the sale associated with the transaction
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Create wallet transaction and update user balance atomically
     */
    public static function createTransaction(
        int $userId,
        float $amount,
        string $type,
        string $description,
        ?int $orderId = null,
        ?int $saleId = null
    ): self {
        return DB::transaction(function () use ($userId, $amount, $type, $description, $orderId, $saleId) {
            // Create transaction record
            $transaction = self::create([
                'user_id' => $userId,
                'order_id' => $orderId,
                'sale_id' => $saleId,
                'amount' => $amount,
                'type' => $type,
                'description' => $description,
            ]);

            // Update user wallet balance
            $user = User::findOrFail($userId);
            $user->wallet_balance = bcadd($user->wallet_balance, $amount, 2);
            $user->save();

            return $transaction;
        });
    }

    /**
     * Get transaction display type label
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            'overpayment' => 'Overpayment Credit',
            'underpayment' => 'Debt (Underpayment)',
            'order_payment' => 'Applied to Order',
            'refund' => 'Order Refund',
            'adjustment' => 'Admin Adjustment',
            default => 'Unknown'
        };
    }
}
