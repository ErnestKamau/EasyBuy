<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Refund;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Facades\Log;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Create a payment intent (amount in major currency units, e.g. KES).
     */
    public function createPaymentIntent(
        float $amount,
        string $currency = 'kes',
        array $metadata = []
    ): PaymentIntent {
        try {
            return PaymentIntent::create([
                'amount' => (int) round($amount * 100),
                'currency' => strtolower($currency),
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
                'metadata' => $metadata,
            ]);
        } catch (ApiErrorException $e) {
            Log::error('Stripe Payment Intent Creation Failed', [
                'error' => $e->getMessage(),
                'amount' => $amount,
            ]);
            throw $e;
        }
    }

    public function retrievePaymentIntent(string $paymentIntentId): PaymentIntent
    {
        try {
            return PaymentIntent::retrieve($paymentIntentId);
        } catch (ApiErrorException $e) {
            Log::error('Stripe Payment Intent Retrieval Failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);
            throw $e;
        }
    }

    public function createRefund(string $paymentIntentId, ?float $amount = null): Refund
    {
        try {
            $params = [
                'payment_intent' => $paymentIntentId,
            ];

            if ($amount !== null) {
                $params['amount'] = (int) round($amount * 100);
            }

            return Refund::create($params);
        } catch (ApiErrorException $e) {
            Log::error('Stripe Refund Failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);
            throw $e;
        }
    }
}
