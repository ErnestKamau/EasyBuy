<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\MpesaTransaction;
use App\Events\PaymentReceived;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class MpesaController extends Controller
{
    /**
     * Generate M-Pesa access token
     */
    private function generateAccessToken(): ?string
    {
        $consumerKey = config('services.mpesa.consumer_key');
        $consumerSecret = config('services.mpesa.consumer_secret');
        $apiUrl = config('services.mpesa.auth_url', 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials');

        try {
            $response = Http::withBasicAuth($consumerKey, $consumerSecret)
                ->get($apiUrl);

            if ($response->successful()) {
                return $response->json()['access_token'] ?? null;
            }

            Log::error('M-Pesa Access Token Error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('M-Pesa Access Token Exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Initiate STK Push
     */
    public function initiateStkPush(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sale_id' => 'nullable|exists:sales,id',
            'order_id' => 'nullable|exists:orders,id',
            'phone_number' => 'required|string|regex:/^(\+?254|0)[17]\d{8}$/',
            'amount' => 'required|numeric|min:1',
        ]);

        if (empty($validated['sale_id']) && empty($validated['order_id'])) {
            return response()->json(['success' => false, 'message' => 'Either sale_id or order_id is required'], 422);
        }

        DB::beginTransaction();
        try {
            $accountReference = '';
            $transactionDesc = '';
            $sale = null;
            $order = null;

            if (!empty($validated['sale_id'])) {
                $sale = Sale::findOrFail($validated['sale_id']);
                Payment::validateAmount($sale, (float) $validated['amount']);
                $accountReference = $sale->sale_number;
                $transactionDesc = "Payment for Sale {$sale->sale_number}";
            } elseif (!empty($validated['order_id'])) {
                $order = \App\Models\Order::findOrFail($validated['order_id']);
                // Check if order already has a sale
                if ($order->sale) {
                    $sale = $order->sale;
                    Payment::validateAmount($sale, (float) $validated['amount']);
                    $accountReference = $sale->sale_number;
                    $transactionDesc = "Payment for Sale {$sale->sale_number}";
                } else {
                    // Pre-sale payment for Order
                    $accountReference = $order->order_number;
                    $transactionDesc = "Payment for Order {$order->order_number}";
                    // TODO: Validate order payment amount if needed (e.g. against order total)
                }
            }

            // Format phone number (remove + and leading 0)
            $phoneNumber = preg_replace('/^\+/', '', $validated['phone_number']);
            if (preg_match('/^0/', $phoneNumber)) {
                $phoneNumber = '254' . substr($phoneNumber, 1);
            } elseif (!preg_match('/^254/', $phoneNumber)) {
                $phoneNumber = '254' . $phoneNumber;
            }

            // Get access token
            $accessToken = $this->generateAccessToken();
            if (!$accessToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate access token'
                ], 500);
            }

            // Prepare STK Push
            $timestamp = Carbon::now()->format('YmdHis');
            $shortcode = config('services.mpesa.shortcode');
            $passkey = config('services.mpesa.passkey');
            $password = base64_encode($shortcode . $passkey . $timestamp);

            $stkPushUrl = config('services.mpesa.stk_push_url', 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest');
            $callbackUrl = config('services.mpesa.callback_url', url('/api/mpesa/callback'));

            $payload = [
                'BusinessShortCode' => $shortcode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'TransactionType' => 'CustomerPayBillOnline',
                'Amount' => (int) $validated['amount'],
                'PartyA' => $phoneNumber,
                'PartyB' => $shortcode,
                'PhoneNumber' => $phoneNumber,
                'CallBackURL' => $callbackUrl,
                'AccountReference' => $accountReference,
                'TransactionDesc' => $transactionDesc,
            ];

            Log::info('Initiating STK Push', ['payload' => $payload]);

            $response = Http::withToken($accessToken)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($stkPushUrl, $payload);

            if ($response->successful()) {
                $data = $response->json();

                // Create payment record
                $payment = Payment::create([
                    'sale_id' => $sale ? $sale->id : null,
                    'order_id' => $order && !$sale ? $order->id : null, // Link to order if no sale yet
                    'payment_method' => 'mpesa',
                    'amount' => $validated['amount'],
                    'status' => 'pending',
                    'paid_at' => Carbon::now(),
                ]);

                // Create M-Pesa transaction record
                MpesaTransaction::create([
                    'payment_id' => $payment->id,
                    'transaction_id' => $data['CheckoutRequestID'] ?? uniqid('MPESA_'),
                    'checkout_request_id' => $data['CheckoutRequestID'] ?? '',
                    'merchant_request_id' => $data['MerchantRequestID'] ?? '',
                    'account_reference' => $accountReference,
                    'amount' => $validated['amount'],
                    'phone_number' => $phoneNumber,
                    'transaction_desc' => $transactionDesc,
                    'status' => 'pending',
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'STK Push initiated successfully',
                    'data' => [
                        'merchant_request_id' => $data['MerchantRequestID'] ?? null,
                        'checkout_request_id' => $data['CheckoutRequestID'] ?? null,
                        'response_description' => $data['ResponseDescription'] ?? null,
                        'payment_id' => $payment->id,
                    ]
                ]);
            }

            Log::error('STK Push Failed', ['response' => $response->json()]);
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to initiate STK Push',
                'error' => $response->json()
            ], $response->status());

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('STK Push Error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Handle M-Pesa callback
     */
    public function callback(Request $request): JsonResponse
    {
        try {
            $data = $request->all();

            Log::info('M-Pesa Callback Received', ['data' => $data]);

            // Extract callback data
            $stkCallback = $data['Body']['stkCallback'] ?? null;
            if (!$stkCallback) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid callback format'
                ], 400);
            }

            $resultCode = $stkCallback['ResultCode'] ?? null;
            $resultDesc = $stkCallback['ResultDesc'] ?? '';
            $merchantRequestId = $stkCallback['MerchantRequestID'] ?? '';
            $checkoutRequestId = $stkCallback['CheckoutRequestID'] ?? '';

            // Find transaction by checkout_request_id
            $mpesaTransaction = MpesaTransaction::where('checkout_request_id', $checkoutRequestId)->first();

            if (!$mpesaTransaction) {
                Log::warning('M-Pesa Transaction not found', ['checkout_request_id' => $checkoutRequestId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            DB::beginTransaction();

            // Extract payment details from callback metadata
            $callbackMetadata = $stkCallback['CallbackMetadata']['Item'] ?? [];
            $metadata = [];
            foreach ($callbackMetadata as $item) {
                $metadata[$item['Name']] = $item['Value'] ?? null;
            }

            // Update transaction
            $mpesaTransaction->result_code = $resultCode;
            $mpesaTransaction->result_desc = $resultDesc;
            $mpesaTransaction->callback_data = $data;

            if ($resultCode == 0) {
                // Payment successful
                $mpesaTransaction->status = 'success';
                $mpesaTransaction->mpesa_receipt_number = $metadata['MpesaReceiptNumber'] ?? null;
                $mpesaTransaction->transaction_date = isset($metadata['TransactionDate']) 
                    ? Carbon::createFromFormat('YmdHis', $metadata['TransactionDate']) 
                    : null;
                $mpesaTransaction->transaction_id = $metadata['MpesaReceiptNumber'] ?? $mpesaTransaction->transaction_id;

                // Update payment
                $payment = $mpesaTransaction->payment;
                $payment->mpesa_transaction_id = $mpesaTransaction->mpesa_receipt_number;
                $payment->status = 'completed';
                $payment->markAsCompleted();

                // Update sale payment status
                $payment->sale->updatePaymentStatus();

                DB::commit();

                // Dispatch event for email notification
                event(new PaymentReceived($payment));

                return response()->json([
                    'success' => true,
                    'message' => 'Payment processed successfully'
                ]);
            } else {
                // Payment failed
                $mpesaTransaction->status = 'failed';
                $mpesaTransaction->save();

                $payment = $mpesaTransaction->payment;
                $payment->markAsFailed();

                DB::commit();

                return response()->json([
                    'success' => false,
                    'message' => 'Payment failed: ' . $resultDesc,
                    'result_code' => $resultCode
                ]);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('M-Pesa Callback Error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Error processing callback: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get M-Pesa transactions
     */
    public function transactions(Request $request): JsonResponse
    {
        $query = MpesaTransaction::with(['payment.sale.order.user']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('payment_id')) {
            $query->where('payment_id', $request->payment_id);
        }

        $perPage = $request->get('per_page', 15);
        $transactions = $query->latest('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Verify M-Pesa transaction
     */
    public function verify(MpesaTransaction $mpesaTransaction): JsonResponse
    {
        $mpesaTransaction->load(['payment.sale']);

        return response()->json([
            'success' => true,
            'data' => [
                'transaction' => $mpesaTransaction,
                'is_successful' => $mpesaTransaction->isSuccessful(),
                'is_failed' => $mpesaTransaction->isFailed(),
            ]
        ]);
    }
}
