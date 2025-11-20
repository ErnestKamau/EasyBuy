# M-Pesa Paybill Integration Setup Guide

## Overview
This guide will help you configure and test M-Pesa Paybill integration for EasyBuy using the M-Pesa Daraja API Sandbox.

## Your M-Pesa Sandbox Credentials

- **App Name**: Shirikisha
- **Consumer Key**: `3KIQBKNfsGGrCZaPKJ0x09bdr4M8aZNuQht8Vqz0Lq3f47Yg`
- **Consumer Secret**: `ltDy7fKFYqe1fb5VYcU8z5rtoX7FGa5BuJ5KdGVXAxR3JAEvFTlCpWNnTIESs1on`
- **Shortcode**: Not assigned yet (you need to get this from M-Pesa)
- **Paybill Number**: `542542`
- **Account Number**: `88881`

## Step 1: Get M-Pesa Sandbox Passkey

1. Go to [M-Pesa Developer Portal](https://developer.safaricom.co.ke/)
2. Log in with your account
3. Navigate to **Sandbox Apps** → **Shirikisha**
4. Click on **Sandbox Test Credentials**
5. Copy your **Passkey** (this is different from Consumer Secret)

## Step 2: Configure Environment Variables

Create or update your `.env` file in the `server` directory:

```bash
# M-Pesa Configuration
MPESA_CONSUMER_KEY=3KIQBKNfsGGrCZaPKJ0x09bdr4M8aZNuQht8Vqz0Lq3f47Yg
MPESA_CONSUMER_SECRET=ltDy7fKFYqe1fb5VYcU8z5rtoX7FGa5BuJ5KdGVXAxR3JAEvFTlCpWNnTIESs1on
MPESA_PASSKEY=YOUR_PASSKEY_FROM_STEP_1
MPESA_SHORTCODE=174379  # Sandbox test shortcode (use your actual when available)
MPESA_CALLBACK_URL=http://192.168.100.101:8000/api/mpesa/callback/
BASE_URL=http://192.168.100.101:8000
```

**Important**: Replace `192.168.100.101` with your actual server IP address.

## Step 3: Test Phone Numbers

For sandbox testing, use these test phone numbers:

- **Test Number 1**: `254708374149`
- **Test Number 2**: `254712345678`
- **Test Number 3**: `254700000000`

**M-Pesa PIN for testing**: `174379` (for sandbox only)

## Step 4: How Paybill Works

### For Users:
1. User selects "M-Pesa Payment" at checkout
2. App displays Paybill instructions:
   - Paybill Number: **542542**
   - Account Number: **88881**
   - Amount: [Order Total]
3. User manually pays via M-Pesa:
   - Go to M-Pesa menu
   - Select "Pay Bill"
   - Enter Paybill: 542542
   - Enter Account: 88881
   - Enter Amount
   - Enter PIN and confirm

### For Admin:
1. Admin sees pending orders with M-Pesa payment method
2. Admin clicks "Paybill" button to check payment status
3. System can verify payment via M-Pesa API

## Step 5: Testing the Integration

### Test 1: Generate Access Token
```bash
curl -X GET "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials" \
  -H "Authorization: Basic $(echo -n 'YOUR_CONSUMER_KEY:YOUR_CONSUMER_SECRET' | base64)"
```

### Test 2: Query Payment Status
You can query payment status using the M-Pesa API to check if payment was received.

## Step 6: Production Setup

When moving to production:

1. **Apply for Production Credentials**:
   - Go to M-Pesa Developer Portal
   - Submit application for production credentials
   - Wait for approval (usually 1-2 business days)

2. **Update Environment Variables**:
   - Replace sandbox URLs with production URLs
   - Update Consumer Key, Secret, and Passkey
   - Update Shortcode to your production shortcode

3. **Configure Callback URL**:
   - Must be HTTPS in production
   - Must be publicly accessible
   - Example: `https://yourdomain.com/api/mpesa/callback/`

## Step 7: Payment Verification

The system can verify payments by:
1. Querying M-Pesa API for transaction status
2. Checking callback notifications (when configured)
3. Manual verification by admin

## Troubleshooting

### Issue: "Failed to generate access token"
- **Solution**: Check Consumer Key and Secret are correct
- Verify they're not expired or revoked

### Issue: "Invalid shortcode"
- **Solution**: Make sure you're using the correct sandbox shortcode (174379) or your assigned shortcode

### Issue: "Callback URL not accessible"
- **Solution**: 
  - Use ngrok or similar tool to expose local server
  - Update CALLBACK_URL in settings
  - Ensure URL is publicly accessible

### Issue: "Payment not reflecting"
- **Solution**:
  - Check callback endpoint is working
  - Verify payment was actually sent
  - Check M-Pesa transaction history

## Next Steps

1. ✅ Get Passkey from M-Pesa Developer Portal
2. ✅ Update `.env` file with credentials
3. ✅ Restart Django server
4. ✅ Test payment flow
5. ✅ Verify callbacks are working
6. ⏳ Apply for production credentials when ready

## Support

For M-Pesa API issues, contact:
- M-Pesa Developer Support: support@developer.safaricom.co.ke
- Documentation: https://developer.safaricom.co.ke/documentation

