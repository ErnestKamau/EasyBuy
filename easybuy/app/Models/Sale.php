<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Sale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sale_number',
        'order_id',
        'total_amount',
        'cost_amount',
        'profit_amount',
        'payment_status',
        'due_date',
        'receipt_generated',
        'made_on',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'cost_amount' => 'decimal:2',
        'profit_amount' => 'decimal:2',
        'due_date' => 'datetime',
        'receipt_generated' => 'boolean',
        'made_on' => 'datetime',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($sale) {
            if (empty($sale->sale_number)) {
                $sale->sale_number = static::generateSaleNumber();
            }
            if (empty($sale->made_on)) {
                $sale->made_on = Carbon::now();
            }
            // Auto-set due_date if payment_status is no-payment or partial-payment
            if (in_array($sale->payment_status, ['no-payment', 'partial-payment']) && empty($sale->due_date)) {
                $sale->due_date = Carbon::now()->addDays(7);
            }
        });
    }

    /**
     * Generate unique sale number
     */
    public static function generateSaleNumber(): string
    {
        $year = Carbon::now()->format('Y');
        $lastSale = static::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastSale ? ((int) substr($lastSale->sale_number, -3)) + 1 : 1;

        return sprintf('SALE-%s-%03d', $year, $sequence);
    }

    /**
     * Get the order that owns this sale
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get all items in this sale
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Get all payments for this sale
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get completed payments only
     */
    public function completedPayments(): HasMany
    {
        return $this->payments()->where('status', 'completed');
    }

    /**
     * Calculate total paid amount
     */
    public function getTotalPaidAttribute(): float
    {
        return (float) $this->completedPayments()->sum('amount');
    }

    /**
     * Calculate balance (total_amount - total_paid)
     */
    public function getBalanceAttribute(): float
    {
        return (float) ($this->total_amount - $this->total_paid);
    }

    /**
     * Check if sale is fully paid
     */
    public function getIsFullyPaidAttribute(): bool
    {
        return $this->balance <= 0;
    }

    /**
     * Check if sale is overdue
     */
    public function getIsOverdueAttribute(): bool
    {
        return $this->due_date && Carbon::now()->greaterThan($this->due_date)
            && in_array($this->payment_status, ['no-payment', 'partial-payment']);
    }

    /**
     * Get days remaining until due date
     */
    public function getDaysRemainingAttribute(): ?int
    {
        if (!$this->due_date) {
            return null;
        }
        return Carbon::now()->diffInDays($this->due_date, false);
    }

    /**
     * Check if payment is near due (within 2 days)
     */
    public function getIsNearDueAttribute(): bool
    {
        if (!$this->due_date || !in_array($this->payment_status, ['no-payment', 'partial-payment'])) {
            return false;
        }
        $daysRemaining = $this->days_remaining;
        return $daysRemaining !== null && $daysRemaining <= 2 && $daysRemaining >= 0;
    }

    /**
     * Get user via order
     */
    public function getUserAttribute()
    {
        return $this->order?->user;
    }

    /**
     * Get customer name via order
     */
    public function getCustomerNameAttribute(): ?string
    {
        if ($this->order?->user) {
            return $this->order->user->first_name . ' ' . $this->order->user->last_name;
        }
        return null;
    }

    /**
     * Get customer phone via order
     */
    public function getCustomerPhoneAttribute(): ?string
    {
        return $this->order?->user?->phone_number;
    }

    /**
     * Get customer email via order
     */
    public function getCustomerEmailAttribute(): ?string
    {
        return $this->order?->user?->email;
    }

    /**
     * Update payment status based on payments
     */
    public function updatePaymentStatus(): void
    {
        $totalPaid = $this->total_paid;

        if ($totalPaid >= $this->total_amount) {
            $this->payment_status = 'fully-paid';
        } elseif ($this->due_date && Carbon::now()->greaterThan($this->due_date)) {
            $this->payment_status = 'overdue';
        } elseif ($totalPaid > 0) {
            $this->payment_status = 'partial-payment';
        } else {
            $this->payment_status = 'no-payment';
        }

        $this->save();
    }

    /**
     * Set sale as debt with due date
     */
    public function setAsDebt(int $days = 7): void
    {
        if (in_array($this->payment_status, ['no-payment', 'partial-payment'])) {
            $this->due_date = Carbon::now()->addDays($days);
            $this->save();
        }
    }

    /**
     * Mark sale as overdue
     */
    public function markAsOverdue(): void
    {
        if (in_array($this->payment_status, ['no-payment', 'partial-payment']) && $this->due_date) {
            if (Carbon::now()->greaterThan($this->due_date)) {
                $this->payment_status = 'overdue';
                $this->save();
            }
        }
    }

    /**
     * Check if payment can be added
     */
    public function canAddPayment(float $amount): bool
    {
        return $this->balance >= $amount && $this->payment_status !== 'fully-paid';
    }
}
