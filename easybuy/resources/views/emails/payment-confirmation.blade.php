@extends('emails.layouts.horizon', [
    'intent' => 'success',
    'eyebrow' => 'Payment received',
    'heading' => 'That landed. Thank you.',
    'preheader' => 'Payment of KES ' . number_format($payment->amount, 2) . ' received for ' . $sale->sale_number . '.',
])

@section('content')
    @include('emails.partials.copy', [
        'text' => 'Hi ' . e($customerName) . ' — we’ve confirmed your payment. Here’s the quiet receipt.',
    ])

    @include('emails.partials.panel', [
        'rows' => [
            ['label' => 'Payment', 'value' => $payment->payment_number],
            ['label' => 'Amount', 'value' => 'KES ' . number_format($payment->amount, 2), 'emphasis' => true],
            ['label' => 'Method', 'value' => ucfirst($payment->payment_method)],
            ['label' => 'When', 'value' => $payment->paid_at->format('F d, Y · h:i A')],
            ['label' => 'Sale', 'value' => $sale->sale_number],
        ],
    ])

    @include('emails.partials.panel', [
        'rows' => [
            ['label' => 'Sale total', 'value' => 'KES ' . number_format($sale->total_amount, 2)],
            ['label' => 'Paid so far', 'value' => 'KES ' . number_format($sale->total_paid, 2)],
            ['label' => 'Balance', 'value' => 'KES ' . number_format($sale->balance, 2), 'emphasis' => $sale->balance > 0],
        ],
    ])

    @if($sale->is_fully_paid)
        @include('emails.partials.alert', [
            'tone' => 'success',
            'title' => 'Fully settled',
            'body' => 'This sale is paid in full. Nothing else is due.',
        ])
    @endif

    @include('emails.partials.copy', [
        'text' => 'Questions? Open the EasyBuy app or reach support from Help.',
    ])
@endsection
