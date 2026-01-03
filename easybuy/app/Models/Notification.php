<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'priority',
        'read_at',
        'archived_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    /**
     * Get the user that owns the notification
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(): bool
    {
        if ($this->read_at) {
            return false; // Already read
        }

        $this->read_at = Carbon::now();
        return $this->save();
    }

    /**
     * Mark notification as archived
     */
    public function archive(): bool
    {
        if ($this->archived_at) {
            return false; // Already archived
        }

        $this->archived_at = Carbon::now();
        return $this->save();
    }

    /**
     * Scope for unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope for read notifications
     */
    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    /**
     * Scope for non-archived notifications
     */
    public function scopeNotArchived($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Scope for archived notifications
     */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Scope for notifications older than X days (for auto-delete)
     */
    public function scopeOlderThan($query, int $days)
    {
        return $query->where('created_at', '<', Carbon::now()->subDays($days));
    }
}
