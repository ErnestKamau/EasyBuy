<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;
use App\Exceptions\PaymentAmountExceedsBalanceException;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'payment_number',
        'sale_id',
        'payment_method',
        'amount',
        'mpesa_transaction_id',
        'stripe_payment_intent_id',
        'status',
        'reference',
        'notes',
        'paid_at',
        'refunded_at',
        'refund_amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            if (empty($payment->payment_number)) {
                $payment->payment_number = static::generatePaymentNumber();
            }
            if (empty($payment->paid_at)) {
                $payment->paid_at = Carbon::now();
            }
            if (empty($payment->status)) {
                $payment->status = 'pending';
            }
        });

        static::saved(function ($payment) {
            // Update sale's total_paid and payment status when payment is saved
            if ($payment->sale) {
                // Update if payment status is completed or refunded, or if status changed
                if (in_array($payment->status, ['completed', 'refunded']) || $payment->wasChanged('status')) {
                    $payment->sale->recalculateTotalPaid();
                    $payment->sale->updatePaymentStatus();
                }
            }
        });
    }

    /**
     * Generate unique payment number
     */
    public static function generatePaymentNumber(): string
    {
        $year = Carbon::now()->format('Y');
        $lastPayment = static::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastPayment ? ((int) substr($lastPayment->payment_number, -3)) + 1 : 1;
        
        return sprintf('PAY-%s-%03d', $year, $sequence);
    }

    /**
     * Get the sale that owns this payment
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Get M-Pesa transaction for this payment
     */
    public function mpesaTransaction(): HasOne
    {
        return $this->hasOne(MpesaTransaction::class);
    }

    /**
     * Check if payment is refunded
     */
    public function getIsRefundedAttribute(): bool
    {
        return $this->refunded_at !== null;
    }

    /**
     * Check if payment can be refunded
     */
    public function canRefund(): bool
    {
        return $this->status === 'completed' && !$this->is_refunded;
    }

    /**
     * Mark payment as completed
     */
    public function markAsCompleted(): bool
    {
        if ($this->status === 'completed') {
            return false; // Already completed
        }
        
        $this->status = 'completed';
        
        if ($this->save()) {
            // Update sale's total_paid
            if ($this->sale) {
                $this->sale->recalculateTotalPaid();
                $this->sale->updatePaymentStatus();
            }
            return true;
        }
        
        return false;
    }

    /**
     * Mark payment as failed
     */
    public function markAsFailed(): bool
    {
        if (in_array($this->status, ['pending', 'completed'])) {
            $this->status = 'failed';
            return $this->save();
        }
        return false;
    }

    /**
     * Process full refund
     */
    public function processRefund(): bool
    {
        if (!$this->canRefund()) {
            return false;
        }

        $this->refunded_at = Carbon::now();
        $this->refund_amount = $this->amount;
        $this->status = 'refunded';
        
        if ($this->save()) {
            // Update sale's total_paid (refunded payments don't count)
            if ($this->sale) {
                $this->sale->recalculateTotalPaid();
                $this->sale->updatePaymentStatus();
            }
            return true;
        }
        
        return false;
    }

    /**
     * Validate payment amount doesn't exceed sale balance
     */
    public static function validateAmount(Sale $sale, float $amount): void
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Payment amount must be greater than zero');
        }

        if ($amount > $sale->balance) {
            throw new PaymentAmountExceedsBalanceException(
                $sale->sale_number,
                $sale->balance,
                $amount
            );
        }
    }
}
