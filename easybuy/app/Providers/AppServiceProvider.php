<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register event listeners
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\SaleCreated::class,
            \App\Listeners\GenerateReceipt::class
        );

        \Illuminate\Support\Facades\Event::listen(
            \App\Events\SaleCreated::class,
            \App\Listeners\SendSaleConfirmationEmail::class
        );

        \Illuminate\Support\Facades\Event::listen(
            \App\Events\PaymentReceived::class,
            \App\Listeners\SendPaymentConfirmationEmail::class
        );

        \Illuminate\Support\Facades\Event::listen(
            \App\Events\PaymentRefunded::class,
            \App\Listeners\SendRefundNotificationEmail::class
        );
    }
}
