<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'first_name',
        'last_name',
        'email',
        'password',
        'phone_number',
        'gender',
        'role',
        'profile_photo',
        'national_id_number',
        'date_of_birth',
        'provider',
        'provider_id',
        'provider_token',
        'provider_refresh_token',
        'email_verified_at',
        'wallet_balance',
        'max_debt_limit',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'provider_token',
        'provider_refresh_token'
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'wallet_balance' => 'decimal:2',
            'max_debt_limit' => 'decimal:2',
        ];
    }

    /**
     * Get wallet transactions for this user
     */
    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /**
     * Check if user has debt
     */
    public function hasDebt(): bool
    {
        return $this->wallet_balance < 0;
    }

    /**
     * Get wallet status (credit/debt/zero)
     */
    public function getWalletStatusAttribute(): string
    {
        if ($this->wallet_balance > 0) {
            return 'credit';
        } elseif ($this->wallet_balance < 0) {
            return 'debt';
        }
        return 'zero';
    }

    /**
     * Check if user can take more debt
     */
    public function canTakeDebt(float $amount): bool
    {
        $newBalance = $this->wallet_balance - $amount;
        return $newBalance >= $this->max_debt_limit;
    }

    /**
     * Get available wallet credit (positive balance only)
     */
    public function getAvailableCreditAttribute(): float
    {
        return max(0, (float) $this->wallet_balance);
    }

    /**
     * Get total debt amount (negative balance only)
     */
    public function getTotalDebtAttribute(): float
    {
        return abs(min(0, (float) $this->wallet_balance));
    }
}
