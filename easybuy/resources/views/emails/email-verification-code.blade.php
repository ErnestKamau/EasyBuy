@extends('emails.layouts.horizon', [
    'intent' => 'security',
    'eyebrow' => 'Verify your email',
    'heading' => 'One code. You’re in.',
    'preheader' => 'Your EasyBuy verification code is ' . $code . '. It expires in 10 minutes.',
])

@section('content')
    @include('emails.partials.copy', [
        'text' => 'Hi ' . e($userName) . ' — welcome to EasyBuy. Enter this code in the app to confirm your email.',
    ])

    @include('emails.partials.otp', ['code' => $code])

    @include('emails.partials.copy', [
        'text' => 'This code expires in <strong>10 minutes</strong>. If you didn’t create an account, you can ignore this email.',
    ])

    @include('emails.partials.alert', [
        'tone' => 'warning',
        'title' => 'Keep this private',
        'body' => 'EasyBuy will never ask you to share this code. Don’t forward it to anyone.',
    ])
@endsection
