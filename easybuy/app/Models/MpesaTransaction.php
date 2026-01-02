<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MpesaTransaction extends Model
{
    protected $fillable = [
        'payment_id',
        'transaction_id',
        'checkout_request_id',
        'merchant_request_id',
        'account_reference',
        'amount',
        'phone_number',
        'transaction_desc',
        'status',
        'mpesa_receipt_number',
        'transaction_date',
        'result_code',
        'result_desc',
        'callback_data',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'datetime',
        'result_code' => 'integer',
        'callback_data' => 'array',
    ];

    /**
     * Get the payment that owns this transaction
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Get the sale via payment
     */
    public function getSaleAttribute()
    {
        return $this->payment?->sale;
    }

    /**
     * Check if transaction is successful
     */
    public function isSuccessful(): bool
    {
        return $this->status === 'success' && $this->result_code === 0;
    }

    /**
     * Check if transaction failed
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed' || ($this->result_code !== null && $this->result_code !== 0);
    }

    /**
     * Mark transaction as successful
     */
    public function markAsSuccess(): bool
    {
        $this->status = 'success';
        return $this->save();
    }

    /**
     * Mark transaction as failed
     */
    public function markAsFailed(): bool
    {
        $this->status = 'failed';
        return $this->save();
    }

    /**
     * Mark transaction as cancelled
     */
    public function markAsCancelled(): bool
    {
        $this->status = 'cancelled';
        return $this->save();
    }
}
