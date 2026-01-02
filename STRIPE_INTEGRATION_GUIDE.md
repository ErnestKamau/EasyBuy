# Stripe Payment Integration Guide

This guide will help you integrate Stripe payment processing into your EasyBuy application.

## Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Stripe API keys (Publishable Key and Secret Key)
3. Composer package: `stripe/stripe-php`

## Installation

### Step 1: Install Stripe PHP SDK

```bash
cd easybuy
composer require stripe/stripe-php
```

### Step 2: Configure Stripe in `config/services.php`

Add the following configuration:

```php
'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
],
```

### Step 3: Add Environment Variables

Add to your `.env` file:

```env
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Note:** Use test keys during development, production keys for live environment.

## Database Migration

The `payments` table already has a `stripe_payment_intent_id` column. No additional migration needed.

## Implementation Steps

### Step 1: Create Stripe Payment Service

Create `app/Services/StripeService.php`:

```php
<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Facades\Log;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Create a payment intent
     */
    public function createPaymentIntent(float $amount, string $currency = 'kes'): PaymentIntent
    {
        try {
            return PaymentIntent::create([
                'amount' => (int) ($amount * 100), // Convert to cents
                'currency' => $currency,
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
            ]);
        } catch (ApiErrorException $e) {
            Log::error('Stripe Payment Intent Creation Failed', [
                'error' => $e->getMessage(),
                'amount' => $amount,
            ]);
            throw $e;
        }
    }

    /**
     * Confirm a payment intent
     */
    public function confirmPaymentIntent(string $paymentIntentId): PaymentIntent
    {
        try {
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);
            return $paymentIntent->confirm();
        } catch (ApiErrorException $e) {
            Log::error('Stripe Payment Intent Confirmation Failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);
            throw $e;
        }
    }

    /**
     * Retrieve a payment intent
     */
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

    /**
     * Create a refund
     */
    public function createRefund(string $paymentIntentId, ?float $amount = null): \Stripe\Refund
    {
        try {
            $params = [
                'payment_intent' => $paymentIntentId,
            ];

            if ($amount !== null) {
                $params['amount'] = (int) ($amount * 100);
            }

            return \Stripe\Refund::create($params);
        } catch (ApiErrorException $e) {
            Log::error('Stripe Refund Failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);
            throw $e;
        }
    }
}
```

### Step 2: Create Stripe Controller

Create `app/Http/Controllers/Api/StripeController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Sale;
use App\Services\StripeService;
use App\Events\PaymentReceived;
use App\Events\PaymentRefunded;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Exceptions\PaymentAmountExceedsBalanceException;

class StripeController extends Controller
{
    protected $stripeService;

    public function __construct(StripeService $stripeService)
    {
        $this->stripeService = $stripeService;
    }

    /**
     * Create payment intent
     */
    public function createIntent(Request $request, Sale $sale): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        try {
            // Validate amount doesn't exceed balance
            Payment::validateAmount($sale, (float) $validated['amount']);

            // Create payment intent
            $paymentIntent = $this->stripeService->createPaymentIntent(
                (float) $validated['amount'],
                'kes'
            );

            // Create payment record
            $payment = Payment::create([
                'sale_id' => $sale->id,
                'payment_method' => 'card',
                'amount' => $validated['amount'],
                'stripe_payment_intent_id' => $paymentIntent->id,
                'status' => 'pending',
                'paid_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'client_secret' => $paymentIntent->client_secret,
                    'payment_intent_id' => $paymentIntent->id,
                    'payment_id' => $payment->id,
                ]
            ]);

        } catch (PaymentAmountExceedsBalanceException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Stripe Intent Creation Error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment intent'
            ], 500);
        }
    }

    /**
     * Confirm payment
     */
    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        DB::beginTransaction();
        try {
            $paymentIntent = $this->stripeService->confirmPaymentIntent($validated['payment_intent_id']);

            // Find payment by payment intent ID
            $payment = Payment::where('stripe_payment_intent_id', $validated['payment_intent_id'])->first();

            if (!$payment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment not found'
                ], 404);
            }

            if ($paymentIntent->status === 'succeeded') {
                $payment->status = 'completed';
                $payment->markAsCompleted();

                DB::commit();

                // Dispatch event
                event(new PaymentReceived($payment));

                return response()->json([
                    'success' => true,
                    'message' => 'Payment confirmed successfully',
                    'data' => $payment->load(['sale'])
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Payment not succeeded',
                'status' => $paymentIntent->status
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Stripe Confirmation Error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm payment'
            ], 500);
        }
    }

    /**
     * Handle Stripe webhook
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $sigHeader,
                $webhookSecret
            );
        } catch (\Exception $e) {
            Log::error('Stripe Webhook Signature Verification Failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        DB::beginTransaction();
        try {
            switch ($event->type) {
                case 'payment_intent.succeeded':
                    $paymentIntent = $event->data->object;
                    $this->handlePaymentSuccess($paymentIntent);
                    break;

                case 'payment_intent.payment_failed':
                    $paymentIntent = $event->data->object;
                    $this->handlePaymentFailure($paymentIntent);
                    break;

                case 'charge.refunded':
                    $charge = $event->data->object;
                    $this->handleRefund($charge);
                    break;
            }

            DB::commit();

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Stripe Webhook Processing Error', [
                'error' => $e->getMessage(),
                'event_type' => $event->type
            ]);
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle successful payment
     */
    private function handlePaymentSuccess($paymentIntent): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if ($payment && $payment->status === 'pending') {
            $payment->status = 'completed';
            $payment->markAsCompleted();
            event(new PaymentReceived($payment));
        }
    }

    /**
     * Handle failed payment
     */
    private function handlePaymentFailure($paymentIntent): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $paymentIntent->id)->first();

        if ($payment) {
            $payment->markAsFailed();
        }
    }

    /**
     * Handle refund
     */
    private function handleRefund($charge): void
    {
        $payment = Payment::where('stripe_payment_intent_id', $charge->payment_intent)->first();

        if ($payment && !$payment->is_refunded) {
            $payment->processRefund();
            event(new PaymentRefunded($payment));
        }
    }
}
```

### Step 3: Add Routes

Add to `routes/api.php`:

```php
// Stripe routes (protected)
Route::prefix('stripe')->middleware('auth:sanctum')->group(function () {
    Route::post('/create-intent/{sale}', [StripeController::class, 'createIntent']);
    Route::post('/confirm', [StripeController::class, 'confirm']);
});

// Stripe webhook (public, no auth)
Route::post('/stripe/webhook', [StripeController::class, 'webhook']);
```

### Step 4: Frontend Integration

#### React Native Example

```javascript
import { loadStripe } from '@stripe/stripe-react-native';

const stripe = await loadStripe('YOUR_PUBLISHABLE_KEY');

// Create payment intent
const response = await fetch(`${API_URL}/api/stripe/create-intent/${saleId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ amount: balance }),
});

const { client_secret, payment_intent_id } = await response.json();

// Confirm payment
const { error, paymentIntent } = await stripe.confirmPayment(client_secret, {
  paymentMethodType: 'Card',
});

if (error) {
  console.error('Payment failed:', error);
} else {
  // Confirm on backend
  await fetch(`${API_URL}/api/stripe/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ payment_intent_id }),
  });
}
```

## Webhook Setup

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:8000/api/stripe/webhook`
4. In production, configure webhook endpoint in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

## Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## Security Considerations

1. Never expose secret keys in frontend
2. Always verify webhook signatures
3. Use HTTPS in production
4. Validate payment amounts on backend
5. Implement idempotency for payment processing

## Refunds

To process a refund:

```php
$stripeService = new StripeService();
$refund = $stripeService->createRefund($paymentIntentId, $amount);

// Update payment record
$payment->processRefund();
```

## Support

For issues or questions:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

