@extends('emails.layouts.horizon', [
    'intent' => $isOverdue ? 'danger' : 'warning',
    'eyebrow' => $isOverdue ? 'Overdue' : 'Friendly nudge',
    'heading' => $isOverdue ? 'This one slipped past due.' : 'A quiet reminder.',
    'preheader' => ($isOverdue ? 'Overdue balance ' : 'Balance due ') . 'KES ' . number_format($sale->balance, 2) . ' on ' . $sale->sale_number . '.',
])

@section('content')
    @include('emails.partials.copy', [
        'text' => $isOverdue
            ? 'Hi ' . e($customerName) . ' — the balance on this sale is now overdue. A quick payment closes it.'
            : 'Hi ' . e($customerName) . ' — just a heads-up that a balance is still open on this sale.',
    ])

    @php
        $rows = [
            ['label' => 'Sale', 'value' => $sale->sale_number],
            ['label' => 'Total', 'value' => 'KES ' . number_format($sale->total_amount, 2)],
            ['label' => 'Paid', 'value' => 'KES ' . number_format($sale->total_paid, 2)],
            ['label' => 'Balance due', 'value' => 'KES ' . number_format($sale->balance, 2), 'emphasis' => true],
        ];
        if ($sale->due_date) {
            $rows[] = ['label' => 'Due date', 'value' => $sale->due_date->format('F d, Y')];
            if ($daysRemaining !== null) {
                $rows[] = $daysRemaining < 0
                    ? ['label' => 'Overdue by', 'value' => abs($daysRemaining) . ' day(s)']
                    : ['label' => 'Days left', 'value' => $daysRemaining . ' day(s)'];
            }
        }
    @endphp

    @include('emails.partials.panel', ['rows' => $rows])

    @include('emails.partials.alert', [
        'tone' => $isOverdue ? 'danger' : 'warning',
        'title' => 'Action needed',
        'body' => 'Please complete KES ' . number_format($sale->balance, 2) . ' when you can. If you’ve already paid, you can ignore this.',
    ])
@endsection
