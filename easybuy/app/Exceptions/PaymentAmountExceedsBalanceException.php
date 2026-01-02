<?php

namespace App\Exceptions;

use Exception;

class PaymentAmountExceedsBalanceException extends Exception
{
    public function __construct(
        string $saleNumber,
        float $balance,
        float $amount,
        $message = "Payment amount exceeds sale balance"
    ) {
        $details = sprintf(
            "%s. Sale: %s, Balance: %.2f, Attempted Amount: %.2f",
            $message,
            $saleNumber,
            $balance,
            $amount
        );
        parent::__construct($details);
    }
}
