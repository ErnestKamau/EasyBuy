<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sale Confirmation</title>
</head>

<body
    style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div
        style="background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Sale Confirmation</h1>
    </div>

    <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello {{ $customerName }},</p>

        <p>Thank you for your purchase! Your sale has been confirmed.</p>

        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #3498db;">
            <h3 style="margin-top: 0; color: #2c3e50;">Sale Details</h3>
            <p><strong>Sale Number:</strong> {{ $sale->sale_number }}</p>
            <p><strong>Date:</strong> {{ $sale->made_on->format('F d, Y h:i A') }}</p>
            <p><strong>Total Amount:</strong> KES {{ number_format($sale->total_amount, 2) }}</p>
            <p><strong>Payment Status:</strong> {{ ucfirst(str_replace('-', ' ', $sale->payment_status)) }}</p>
            @if($sale->balance > 0)
                <p><strong>Balance:</strong> KES {{ number_format($sale->balance, 2) }}</p>
                @if($sale->due_date)
                    <p><strong>Due Date:</strong> {{ $sale->due_date->format('F d, Y') }}</p>
                @endif
            @endif
        </div>

        @if($sale->balance > 0)
            <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0;"><strong>Payment Required:</strong> Please complete your payment of KES
                    {{ number_format($sale->balance, 2) }} to finalize your purchase.
                </p>
            </div>
        @else
            <div style="background-color: #d4edda; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745;">
                <p style="margin: 0;"><strong>Payment Complete:</strong> Your sale has been fully paid. Thank you!</p>
            </div>
        @endif

        <p>If you have any questions, please don't hesitate to contact us.</p>

        <p>Best regards,<br>{{ config('app.name') }}</p>
    </div>

    <div style="text-align: center; padding: 20px; color: #7f8c8d; font-size: 12px; border-top: 1px solid #ddd;">
        <p>This is an automated email. Please do not reply.</p>
    </div>
</body>

</html>