@extends('emails.layouts.horizon', [
    'intent' => 'brand',
    'eyebrow' => 'Sale confirmed',
    'heading' => 'You’re on the list.',
    'preheader' => 'Sale ' . $sale->sale_number . ' is confirmed — KES ' . number_format($sale->total_amount, 2) . '.',
])

@section('content')
    @include('emails.partials.copy', [
        'text' => 'Hi ' . e($customerName) . ' — your purchase is locked in. We’re already moving on it.',
    ])

    @php
        $rows = [
            ['label' => 'Sale', 'value' => $sale->sale_number],
            ['label' => 'Date', 'value' => $sale->made_on->format('F d, Y · h:i A')],
            ['label' => 'Total', 'value' => 'KES ' . number_format($sale->total_amount, 2), 'emphasis' => true],
            ['label' => 'Status', 'value' => ucfirst(str_replace('-', ' ', $sale->payment_status))],
        ];
        if ($sale->balance > 0) {
            $rows[] = ['label' => 'Balance', 'value' => 'KES ' . number_format($sale->balance, 2), 'emphasis' => true];
            if ($sale->due_date) {
                $rows[] = ['label' => 'Due', 'value' => $sale->due_date->format('F d, Y')];
            }
        }
    @endphp

    @include('emails.partials.panel', ['rows' => $rows])

    @if($sale->balance > 0)
        @include('emails.partials.alert', [
            'tone' => 'warning',
            'title' => 'A little still due',
            'body' => 'Please complete KES ' . number_format($sale->balance, 2) . ' to close this sale.',
        ])
    @else
        @include('emails.partials.alert', [
            'tone' => 'success',
            'title' => 'Paid in full',
            'body' => 'Nothing left on this sale. Thank you.',
        ])
    @endif

    @include('emails.partials.copy', [
        'text' => 'Track progress anytime in the EasyBuy app.',
    ])
@endsection
