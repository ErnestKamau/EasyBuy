<?php

namespace App\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    public function __construct(string $productName, $message = "Insufficient stock")
    {
        parent::__construct("{$message} for product: {$productName}");
    }
}
