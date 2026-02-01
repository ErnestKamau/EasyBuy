<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
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
        'pickup_time',
        'fulfillment_status',
        'pickup_verification_code',
        'pickup_qr_code',
        'cancelled_at',
        'cancellation_reason',
        'reminder_sent',
    ];

    protected $casts = [
        'order_date' => 'date',
        'pickup_time' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    /**
     * Accessors to append to model's array/JSON form
     */
    protected $appends = ['total_amount'];

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

    /**
     * Generate QR code for pickup verification
     */
    public function generatePickupQrCode(): string
    {
        $verificationCode = Str::upper(Str::random(8));
        
        // Format: ORDER-{id}-{verification_code}
        $qrCode = "ORDER-{$this->id}-{$verificationCode}";
        
        $this->pickup_verification_code = $verificationCode;
        $this->pickup_qr_code = $qrCode;
        $this->save();
        
        return $qrCode;
    }

    /**
     * Verify QR code for pickup
     */
    public static function verifyPickupQrCode(string $qrCode): ?self
    {
        // Parse: ORDER-123-ABC12345
        $parts = explode('-', $qrCode);
        
        if (count($parts) !== 3 || $parts[0] !== 'ORDER') {
            return null;
        }
        
        $orderId = $parts[1] ?? null;
        $code = $parts[2] ?? null;
        
        return self::where('id', $orderId)
            ->where('pickup_verification_code', $code)
            ->where('fulfillment_status', 'ready')
            ->first();
    }

    /**
     * Move order to awaiting pickup (ready status)
     */
    public function moveToAwaitingPickup(): void
    {
        $this->fulfillment_status = 'ready';
        $this->generatePickupQrCode();
        $this->save();
        
        // Deduct stock when order moves to awaiting pickup
        foreach ($this->items as $item) {
            $product = $item->product;
            
            if ($item->kilogram) {
                $product->kilograms_in_stock = bcsub($product->kilograms_in_stock, $item->kilogram, 3);
            }
            
            $currentStock = (float) $product->in_stock;
            $deduction = $item->kilogram ? (float) $item->kilogram : (float) $item->quantity;
            $newStock = $currentStock - $deduction;
            $product->in_stock = max(0, round($newStock, 3));
            $product->save();
        }
    }

    /**
     * Mark order as picked up
     */
    public function markAsPickedUp(): void
    {
        $this->fulfillment_status = 'picked_up';
        $this->save();
    }

    /**
     * Cancel order and restock inventory
     */
    public function cancelAndRestock(?string $reason = null): void
    {
        // Restock inventory (only if order was in awaiting pickup)
        if ($this->fulfillment_status === 'ready') {
            foreach ($this->items as $item) {
                $product = $item->product;
                
                if ($item->kilogram) {
                    $product->kilograms_in_stock = bcadd($product->kilograms_in_stock, $item->kilogram, 3);
                }
                
                $currentStock = (float) $product->in_stock;
                $restock = $item->kilogram ? (float) $item->kilogram : (float) $item->quantity;
                $newStock = $currentStock + $restock;
                $product->in_stock = round($newStock, 3);
                $product->save();
            }
        }
        
        $this->order_status = 'cancelled';
        $this->cancelled_at = Carbon::now();
        $this->cancellation_reason = $reason;
        $this->save();
    }

    /**
     * Check if order can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->order_status, ['pending', 'confirmed'])
            && $this->fulfillment_status !== 'picked_up';
    }

    /**
     * Check if order is overdue for pickup
     */
    public function isOverdueForPickup(int $hours = 12): bool
    {
        if (!$this->pickup_time || $this->fulfillment_status !== 'ready') {
            return false;
        }
        
        return Carbon::now()->greaterThan(
            $this->pickup_time->addHours($hours)
        );
    }

    /**
     * Get formatted pickup time slot
     */
    public function getPickupTimeSlotAttribute(): ?string
    {
        if (!$this->pickup_time) {
            return null;
        }
        
        $start = $this->pickup_time->format('g:i A');
        $end = $this->pickup_time->copy()->addHour()->format('g:i A');
        
        return "{$start} - {$end}";
    }
}
