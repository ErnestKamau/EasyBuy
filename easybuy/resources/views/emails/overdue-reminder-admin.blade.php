@extends('emails.layouts.horizon', [
    'intent' => 'danger',
    'eyebrow' => 'Admin alert',
    'heading' => 'A payment is overdue.',
    'preheader' => $customerName . ' — ' . $sale->sale_number . ' is overdue by KES ' . number_format($sale->balance, 2) . '.',
])

@section('content')
    @include('emails.partials.copy', [
        'text' => 'A customer balance has crossed its due date. Follow up when you have a moment.',
    ])

    @php
        $rows = [
            ['label' => 'Sale', 'value' => $sale->sale_number],
            ['label' => 'Customer', 'value' => $customerName],
            ['label' => 'Email', 'value' => $sale->customer_email ?? 'N/A'],
            ['label' => 'Phone', 'value' => $sale->customer_phone ?? 'N/A'],
            ['label' => 'Total', 'value' => 'KES ' . number_format($sale->total_amount, 2)],
            ['label' => 'Paid', 'value' => 'KES ' . number_format($sale->total_paid, 2)],
            ['label' => 'Balance due', 'value' => 'KES ' . number_format($sale->balance, 2), 'emphasis' => true],
            ['label' => 'Due date', 'value' => $sale->due_date ? $sale->due_date->format('F d, Y') : 'N/A'],
        ];
        if ($daysRemaining !== null) {
            $rows[] = ['label' => 'Days overdue', 'value' => abs($daysRemaining) . ' day(s)'];
        }
    @endphp

    @include('emails.partials.panel', ['rows' => $rows])

    @include('emails.partials.alert', [
        'tone' => 'danger',
        'title' => 'Collect',
        'body' => 'Outstanding amount: KES ' . number_format($sale->balance, 2) . '.',
    ])
@endsection
