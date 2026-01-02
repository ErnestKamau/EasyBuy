<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Refund Processed</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello {{ $customerName }},</p>
        
        <p>We have processed a refund for your payment.</p>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <h3 style="margin-top: 0; color: #2c3e50;">Refund Details</h3>
            <p><strong>Payment Number:</strong> {{ $payment->payment_number }}</p>
            <p><strong>Refund Amount:</strong> KES {{ number_format($payment->refund_amount ?? $payment->amount, 2) }}</p>
            <p><strong>Original Payment Method:</strong> {{ ucfirst($payment->payment_method) }}</p>
            <p><strong>Refund Date:</strong> {{ $payment->refunded_at->format('F d, Y h:i A') }}</p>
            <p><strong>Sale Number:</strong> {{ $sale->sale_number }}</p>
        </div>
        
        <div style="background-color: #d1ecf1; padding: 15px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <p style="margin: 0;"><strong>Note:</strong> The refund will be processed according to your original payment method. Please allow 3-5 business days for the refund to appear in your account.</p>
        </div>
        
        <p>If you have any questions about this refund, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>{{ config('app.name') }}</p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #7f8c8d; font-size: 12px; border-top: 1px solid #ddd;">
        <p>This is an automated email. Please do not reply.</p>
    </div>
</body>
</html>

