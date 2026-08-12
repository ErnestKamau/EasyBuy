@extends('emails.layouts.horizon', [
    'intent' => 'delivery',
    'eyebrow' => 'On the move',
    'heading' => 'Your package left the shop.',
    'preheader' => 'Order ' . $order->order_number . ' is on the way' . ($driverName ? ' with ' . $driverName : '') . '.',
])

@section('content')
    @include('emails.partials.copy', [
        'text' => 'Hi ' . e($customerName) . ' — order <strong>' . e($order->order_number) . '</strong> is heading to you. Sit tight, or watch it live in the app.',
    ])

    @php
        $rows = [
            ['label' => 'Rider', 'value' => $driverName],
        ];
        if ($vehicleType) {
            $rows[] = ['label' => 'Vehicle', 'value' => $vehicleType . ($vehicleModel ? ' · ' . $vehicleModel : '')];
        }
        if ($plate) {
            $rows[] = ['label' => 'Plate', 'value' => $plate];
        }
        if ($order->delivery_address) {
            $rows[] = ['label' => 'Delivering to', 'value' => $order->delivery_address];
        }
    @endphp

    @include('emails.partials.panel', ['rows' => $rows])

    @include('emails.partials.alert', [
        'tone' => 'info',
        'title' => 'Live tracking',
        'body' => 'Open EasyBuy → Orders → Track to see your rider in real time.',
    ])
@endsection
