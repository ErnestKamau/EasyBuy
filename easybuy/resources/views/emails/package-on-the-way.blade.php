<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Package on the way</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1A5140; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Your package is on the way</h1>
    </div>
    <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello {{ $customerName }},</p>
        <p>Great news — order <strong>{{ $order->order_number }}</strong> has left the shop and is heading to you.</p>
        <div style="background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #288760;">
            <p><strong>Rider:</strong> {{ $driverName }}</p>
            @if($vehicleType)
                <p><strong>Vehicle:</strong> {{ $vehicleType }}{{ $vehicleModel ? ' · ' . $vehicleModel : '' }}</p>
            @endif
            @if($plate)
                <p><strong>Plate:</strong> {{ $plate }}</p>
            @endif
            @if($order->delivery_address)
                <p><strong>Delivering to:</strong> {{ $order->delivery_address }}</p>
            @endif
        </div>
        <p>Open the EasyBuy app to track your package in real time.</p>
        <p>Best regards,<br>{{ config('app.name') }}</p>
    </div>
</body>
</html>
