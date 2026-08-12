@extends('emails.layouts.horizon', [
    'intent' => 'security',
    'eyebrow' => 'Password reset',
    'heading' => 'Let’s get you back in.',
    'preheader' => 'Your EasyBuy reset code is ' . $code . '. It expires in 10 minutes.',
])

@section('content')
    @include('emails.partials.copy', [
        'text' => 'Hi ' . e($userName) . ' — we received a request to reset your EasyBuy password. Use the code below in the app.',
    ])

    @include('emails.partials.otp', ['code' => $code])

    @include('emails.partials.copy', [
        'text' => 'This code expires in <strong>10 minutes</strong>. If you didn’t ask for a reset, your password stays the same.',
    ])

    @include('emails.partials.alert', [
        'tone' => 'warning',
        'title' => 'Wasn’t you?',
        'body' => 'Ignore this email and your account stays locked to the current password. Never share this code.',
    ])
@endsection
