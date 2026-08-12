@extends('emails.layouts.horizon', [
    'intent' => 'info',
    'eyebrow' => 'Refund',
    'heading' => 'It’s on its way back.',
    'preheader' => 'A refund of KES ' . number_format($payment->refund_amount ?? $payment->amount, 2) . ' is processing for ' . $sale->sale_number . '.',
])

@section('content')
    @include('emails.partials.copy', [
        'text' => 'Hi ' . e($customerName) . ' — we’ve processed a refund on your original payment method.',
    ])

    @include('emails.partials.panel', [
        'rows' => [
            ['label' => 'Payment', 'value' => $payment->payment_number],
            ['label' => 'Refund', 'value' => 'KES ' . number_format($payment->refund_amount ?? $payment->amount, 2), 'emphasis' => true],
            ['label' => 'Method', 'value' => ucfirst($payment->payment_method)],
            ['label' => 'When', 'value' => $payment->refunded_at->format('F d, Y · h:i A')],
            ['label' => 'Sale', 'value' => $sale->sale_number],
        ],
    ])

    @include('emails.partials.alert', [
        'tone' => 'info',
        'title' => 'Give it a few days',
        'body' => 'Banks usually take 3–5 business days to show the credit. Same path it left on.',
    ])

    @include('emails.partials.copy', [
        'text' => 'If this looks off, reach us from Help in the app.',
    ])
@endsection
