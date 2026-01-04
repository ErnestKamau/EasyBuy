<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Use custom broadcasting auth that handles tokens from query parameters
        // This is needed for Laravel Echo Server which may send tokens in query
        Route::post('/broadcasting/auth', [\App\Http\Controllers\Api\BroadcastingAuthController::class, 'authenticate'])
            ->middleware(['api']); // Don't use auth:sanctum here, handle it in controller

        // Also register standard broadcast routes as fallback
        Broadcast::routes(['middleware' => ['auth:sanctum']]);

        require base_path('routes/channels.php');
    }
}
