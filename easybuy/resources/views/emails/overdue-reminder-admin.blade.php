<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Overdue Payment Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Overdue Payment Alert</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello Admin,</p>
        
        <p><strong>This is an alert about an overdue payment.</strong></p>
        
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin-top: 0; color: #2c3e50;">Sale Details</h3>
            <p><strong>Sale Number:</strong> {{ $sale->sale_number }}</p>
            <p><strong>Customer:</strong> {{ $customerName }}</p>
            <p><strong>Customer Email:</strong> {{ $sale->customer_email ?? 'N/A' }}</p>
            <p><strong>Customer Phone:</strong> {{ $sale->customer_phone ?? 'N/A' }}</p>
            <p><strong>Total Amount:</strong> KES {{ number_format($sale->total_amount, 2) }}</p>
            <p><strong>Amount Paid:</strong> KES {{ number_format($sale->total_paid, 2) }}</p>
            <p><strong>Balance Due:</strong> KES {{ number_format($sale->balance, 2) }}</p>
            <p><strong>Due Date:</strong> {{ $sale->due_date ? $sale->due_date->format('F d, Y') : 'N/A' }}</p>
            @if($daysRemaining !== null)
                <p style="color: #dc3545;"><strong>Days Overdue:</strong> {{ abs($daysRemaining) }} day(s)</p>
            @endif
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>Action Required:</strong> Please follow up with the customer regarding the overdue payment of KES {{ number_format($sale->balance, 2) }}.</p>
        </div>
        
        <p>Please take appropriate action to collect this payment.</p>
        
        <p>Best regards,<br>{{ config('app.name') }} System</p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #7f8c8d; font-size: 12px; border-top: 1px solid #ddd;">
        <p>This is an automated alert. Please do not reply.</p>
    </div>
</body>
</html>

