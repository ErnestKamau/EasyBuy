<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;
use App\Events\DebtOverdue;

class Sale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sale_number',
        'order_id',
        'total_amount',
        'total_paid',
        'cost_amount',
        'profit_amount',
        'payment_status',
        'due_date',
        'receipt_generated',
        'made_on',
        'fulfillment_status',
        'fulfilled_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'cost_amount' => 'decimal:2',
        'profit_amount' => 'decimal:2',
        'due_date' => 'datetime',
        'receipt_generated' => 'boolean',
        'made_on' => 'datetime',
        'fulfilled_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = ['balance', 'is_fully_paid', 'is_overdue', 'days_remaining', 'is_near_due', 'customer_name', 'customer_phone', 'customer_email'];

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
     * Calculate total paid amount (use stored column, fallback to calculation)
     */
    public function getTotalPaidAttribute(): float
    {
        // If total_paid column exists and is set, use it
        if (isset($this->attributes['total_paid'])) {
            return (float) $this->attributes['total_paid'];
        }
        // Fallback: calculate from payments
        return (float) $this->completedPayments()->sum('amount');
    }

    /**
     * Recalculate and update total_paid from payments
     */
    public function recalculateTotalPaid(): void
    {
        $this->total_paid = (float) $this->completedPayments()->sum('amount');
        $this->save();
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
     * Update payment status based on total_paid
     */
    public function updatePaymentStatus(): void
    {
        // Ensure total_paid is up to date
        $this->recalculateTotalPaid();
        $totalPaid = $this->total_paid;
        $previousStatus = $this->payment_status;

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

        // Dispatch overdue event if status changed to overdue
        if ($this->payment_status === 'overdue' && $previousStatus !== 'overdue') {
            event(new \App\Events\DebtOverdue($this, false)); // Customer
            event(new \App\Events\DebtOverdue($this, true)); // Admin
        }

        // Sync payment status to related order
        if ($this->order) {
            $this->syncOrderPaymentStatus();
        }
    }

    /**
     * Sync payment status from sale to order
     */
    public function syncOrderPaymentStatus(): void
    {
        if (!$this->order) {
            return;
        }

        // Map sale payment status to order payment status
        $orderPaymentStatus = 'pending'; // Default value
        switch ($this->payment_status) {
            case 'no-payment':
                // If sale has a due_date, it's a debt order - keep as 'debt'
                // Otherwise, it's pending payment
                if ($this->due_date) {
                    $orderPaymentStatus = 'debt';
                } else {
                    $orderPaymentStatus = 'pending';
                }
                break;
            case 'partial-payment':
                $orderPaymentStatus = 'partially-paid';
                break;
            case 'fully-paid':
                $orderPaymentStatus = 'fully-paid';
                break;
            case 'overdue':
                // Overdue payments should show as 'debt' in orders
                $orderPaymentStatus = 'debt';
                break;
            default:
                // Default to pending for unknown statuses
                $orderPaymentStatus = 'pending';
                break;
        }

        // Only update if different to avoid unnecessary database writes
        if ($this->order->payment_status !== $orderPaymentStatus) {
            $this->order->payment_status = $orderPaymentStatus;
            $this->order->save();
        }
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

    /**
     * Process wallet adjustment after all payments are added
     * Called when admin confirms pickup
     */
    public function processWalletAdjustment(): void
    {
        if (!$this->order || !$this->order->user) {
            return;
        }
        
        $user = $this->order->user;
        $difference = (float) $this->total_paid - (float) $this->total_amount;
        
        // Exact payment - no adjustment needed
        if (abs($difference) < 0.01) {
            return;
        }
        
        if ($difference > 0) {
            // Overpayment - credit to wallet
            WalletTransaction::createTransaction(
                $user->id,
                $difference,
                'overpayment',
                "Overpayment from order {$this->order->order_number}: KES " . number_format($difference, 2),
                $this->order_id,
                $this->id
            );
        } else {
            // Underpayment - create debt
            WalletTransaction::createTransaction(
                $user->id,
                $difference, // Negative amount
                'underpayment',
                "Debt from order {$this->order->order_number}: KES " . number_format(abs($difference), 2) . " remaining",
                $this->order_id,
                $this->id
            );
        }
    }

    /**
     * Mark sale as fulfilled (pickup complete)
     */
    public function markAsFulfilled(): void
    {
        $this->fulfillment_status = 'fulfilled';
        $this->fulfilled_at = Carbon::now();
        $this->save();
    }
}
