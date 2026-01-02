# SMS Integration Guide

This guide will help you integrate SMS notifications into your EasyBuy application for payment confirmations and overdue reminders.

## Supported SMS Providers

This guide covers integration with popular SMS providers:
1. **Twilio** (Recommended - Global)
2. **Africa's Talking** (Recommended for Africa)
3. **SMS Gateway API** (Generic REST API)

## Option 1: Twilio Integration

### Prerequisites

1. Twilio account (sign up at https://www.twilio.com)
2. Twilio Phone Number
3. Account SID and Auth Token

### Installation

```bash
cd easybuy
composer require twilio/sdk
```

### Configuration

Add to `config/services.php`:

```php
'twilio' => [
    'account_sid' => env('TWILIO_ACCOUNT_SID'),
    'auth_token' => env('TWILIO_AUTH_TOKEN'),
    'from' => env('TWILIO_FROM_NUMBER'),
],
```

Add to `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

### Implementation

Create `app/Services/SmsService.php`:

```php
<?php

namespace App\Services;

use Twilio\Rest\Client;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected $client;
    protected $from;

    public function __construct()
    {
        $accountSid = config('services.twilio.account_sid');
        $authToken = config('services.twilio.auth_token');
        $this->from = config('services.twilio.from');

        if ($accountSid && $authToken) {
            $this->client = new Client($accountSid, $authToken);
        }
    }

    /**
     * Send SMS
     */
    public function send(string $to, string $message): bool
    {
        if (!$this->client) {
            Log::warning('SMS Service not configured');
            return false;
        }

        try {
            $this->client->messages->create(
                $to,
                [
                    'from' => $this->from,
                    'body' => $message
                ]
            );

            Log::info('SMS sent successfully', ['to' => $to]);
            return true;

        } catch (\Exception $e) {
            Log::error('SMS sending failed', [
                'to' => $to,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send payment confirmation SMS
     */
    public function sendPaymentConfirmation($payment): bool
    {
        $sale = $payment->sale;
        $message = "Payment received: KES " . number_format($payment->amount, 2) . 
                   " for Sale " . $sale->sale_number . 
                   ". Balance: KES " . number_format($sale->balance, 2) . 
                   ". Thank you!";

        if ($sale->customer_phone) {
            return $this->send($sale->customer_phone, $message);
        }

        return false;
    }

    /**
     * Send overdue reminder SMS
     */
    public function sendOverdueReminder($sale): bool
    {
        $message = "Reminder: Payment of KES " . number_format($sale->balance, 2) . 
                   " for Sale " . $sale->sale_number . 
                   " is " . ($sale->is_overdue ? "overdue" : "due soon") . 
                   ". Please make payment soon.";

        if ($sale->customer_phone) {
            return $this->send($sale->customer_phone, $message);
        }

        return false;
    }
}
```

## Option 2: Africa's Talking Integration

### Prerequisites

1. Africa's Talking account (sign up at https://africastalking.com)
2. API Key and Username

### Installation

```bash
cd easybuy
composer require africastalking/africastalking
```

### Configuration

Add to `config/services.php`:

```php
'africas_talking' => [
    'username' => env('AT_USERNAME'),
    'api_key' => env('AT_API_KEY'),
    'from' => env('AT_SENDER_ID', 'EASYBUY'),
],
```

Add to `.env`:

```env
AT_USERNAME=your_username
AT_API_KEY=your_api_key
AT_SENDER_ID=EASYBUY
```

### Implementation

Update `app/Services/SmsService.php`:

```php
<?php

namespace App\Services;

use AfricasTalking\SDK\AfricasTalking;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected $sms;
    protected $from;

    public function __construct()
    {
        $username = config('services.africas_talking.username');
        $apiKey = config('services.africas_talking.api_key');
        $this->from = config('services.africas_talking.from');

        if ($username && $apiKey) {
            $at = new AfricasTalking($username, $apiKey);
            $this->sms = $at->sms();
        }
    }

    /**
     * Send SMS
     */
    public function send(string $to, string $message): bool
    {
        if (!$this->sms) {
            Log::warning('SMS Service not configured');
            return false;
        }

        try {
            $result = $this->sms->send([
                'to' => $to,
                'message' => $message,
                'from' => $this->from,
            ]);

            Log::info('SMS sent successfully', ['to' => $to, 'result' => $result]);
            return true;

        } catch (\Exception $e) {
            Log::error('SMS sending failed', [
                'to' => $to,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    // ... rest of the methods same as Twilio
}
```

## Option 3: Generic REST API Integration

### Configuration

Add to `config/services.php`:

```php
'sms' => [
    'provider' => env('SMS_PROVIDER', 'custom'),
    'api_url' => env('SMS_API_URL'),
    'api_key' => env('SMS_API_KEY'),
    'from' => env('SMS_FROM'),
],
```

### Implementation

Update `app/Services/SmsService.php`:

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected $apiUrl;
    protected $apiKey;
    protected $from;

    public function __construct()
    {
        $this->apiUrl = config('services.sms.api_url');
        $this->apiKey = config('services.sms.api_key');
        $this->from = config('services.sms.from');
    }

    /**
     * Send SMS
     */
    public function send(string $to, string $message): bool
    {
        if (!$this->apiUrl || !$this->apiKey) {
            Log::warning('SMS Service not configured');
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, [
                'to' => $to,
                'message' => $message,
                'from' => $this->from,
            ]);

            if ($response->successful()) {
                Log::info('SMS sent successfully', ['to' => $to]);
                return true;
            }

            Log::error('SMS API error', [
                'to' => $to,
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('SMS sending failed', [
                'to' => $to,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    // ... rest of the methods
}
```

## Integration with Email Listeners

Update your email listeners to also send SMS:

### Update `SendPaymentConfirmationEmail` listener:

```php
<?php

namespace App\Listeners;

use App\Events\PaymentReceived;
use App\Mail\PaymentConfirmation;
use App\Services\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendPaymentConfirmationEmail implements ShouldQueue
{
    use InteractsWithQueue;

    protected $smsService;

    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    public function handle(PaymentReceived $event): void
    {
        $payment = $event->payment;
        $sale = $payment->sale;
        
        // Send email
        if ($sale->customer_email) {
            Mail::to($sale->customer_email)->send(new PaymentConfirmation($payment));
        }

        // Send SMS
        $this->smsService->sendPaymentConfirmation($payment);
    }
}
```

### Update `SendOverdueRemindersJob`:

```php
<?php

namespace App\Jobs;

use App\Models\Sale;
use App\Mail\OverdueReminder;
use App\Services\SmsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendOverdueRemindersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $smsService;

    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    public function handle(): void
    {
        $overdueSales = Sale::where(function ($query) {
            $query->where('payment_status', 'overdue')
                ->orWhere(function ($q) {
                    $q->where('due_date', '<', Carbon::now())
                      ->whereIn('payment_status', ['no-payment', 'partial-payment']);
                });
        })
        ->whereNotNull('due_date')
        ->where('payment_status', '!=', 'fully-paid')
        ->get();

        foreach ($overdueSales as $sale) {
            try {
                // Send email
                if ($sale->customer_email) {
                    Mail::to($sale->customer_email)->send(new OverdueReminder($sale, false));
                }

                // Send SMS
                $this->smsService->sendOverdueReminder($sale);

                // Send alert to admin
                $adminEmail = config('app.admin_email');
                if ($adminEmail) {
                    Mail::to($adminEmail)->send(new OverdueReminder($sale, true));
                }

                Log::info('Overdue reminder sent', ['sale_id' => $sale->id]);
            } catch (\Exception $e) {
                Log::error('Failed to send overdue reminder', [
                    'sale_id' => $sale->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
}
```

## Phone Number Formatting

Create a helper to format phone numbers:

```php
// app/Helpers/PhoneHelper.php

function formatPhoneNumber(string $phone): string
{
    // Remove all non-numeric characters
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    // Handle Kenyan numbers
    if (strlen($phone) == 9 && substr($phone, 0, 1) != '0') {
        return '254' . $phone;
    }
    
    if (strlen($phone) == 10 && substr($phone, 0, 1) == '0') {
        return '254' . substr($phone, 1);
    }
    
    if (strlen($phone) == 13 && substr($phone, 0, 3) == '254') {
        return $phone;
    }
    
    return $phone;
}
```

## Testing

### Test SMS Sending

```php
use App\Services\SmsService;

$smsService = new SmsService();
$smsService->send('+254712345678', 'Test message from EasyBuy');
```

## Cost Considerations

1. **Twilio**: ~$0.0075 per SMS (varies by country)
2. **Africa's Talking**: ~KES 1.00 per SMS in Kenya
3. **Custom Provider**: Varies by provider

## Best Practices

1. **Rate Limiting**: Implement rate limiting to prevent spam
2. **Error Handling**: Always log SMS failures
3. **Queue Jobs**: Send SMS asynchronously via queue
4. **Template Messages**: Use consistent message templates
5. **Opt-out**: Implement opt-out mechanism for customers
6. **Cost Monitoring**: Track SMS costs

## Security

1. Never expose API keys in frontend
2. Validate phone numbers before sending
3. Implement rate limiting
4. Log all SMS activities
5. Use HTTPS for API calls

## Support

- Twilio: https://support.twilio.com
- Africa's Talking: https://developers.africastalking.com
- Your SMS Provider Documentation

