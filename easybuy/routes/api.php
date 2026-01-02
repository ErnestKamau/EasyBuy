<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\MpesaController;
use App\Http\Controllers\Api\ImageController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/verify-email-code', [AuthController::class, 'verifyEmailCode']);
Route::post('/resend-email-verification-code', [AuthController::class, 'resendEmailVerificationCode']);
Route::post('/verify-reset-code', [AuthController::class, 'verifyResetCode']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Email verification resend (requires auth)
Route::post('/email/resend', [AuthController::class, 'resend'])
    ->middleware(['auth:sanctum', 'throttle:6,1'])
    ->name('verification.send');

// Public product and category routes
Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/{category}', [CategoryController::class, 'show']);
});

Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    // Define low-stock before parameterized route to avoid route conflicts
    Route::get('/low-stock', [ProductController::class, 'lowStock'])->middleware('auth:sanctum');
    Route::get('/{product}', [ProductController::class, 'show']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    // Categories (admin operations)
    Route::prefix('categories')->group(function () {
        Route::post('/', [CategoryController::class, 'store']);
        Route::put('/{category}', [CategoryController::class, 'update']);
        Route::delete('/{category}', [CategoryController::class, 'destroy']);
    });

    // Image upload
    Route::post('/images/upload', [ImageController::class, 'upload']);

    // Products (admin operations)
    Route::prefix('products')->group(function () {
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{product}', [ProductController::class, 'update']);
        Route::delete('/{product}', [ProductController::class, 'destroy']);
    });

    // Orders
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::get('/{order}', [OrderController::class, 'show']);
        Route::post('/', [OrderController::class, 'store']);
        Route::put('/{order}', [OrderController::class, 'update']);
        Route::post('/{order}/cancel', [OrderController::class, 'cancel']);
    });

    // Sales
    Route::prefix('sales')->group(function () {
        Route::get('/', [SaleController::class, 'index']);
        Route::get('/analytics', [SaleController::class, 'analytics']);
        Route::get('/overdue', [SaleController::class, 'overdue']);
        Route::get('/unpaid', [SaleController::class, 'unpaid']);
        Route::get('/debts', [SaleController::class, 'debts']);
        Route::get('/{sale}', [SaleController::class, 'show']);
        Route::get('/{sale}/receipt', [SaleController::class, 'downloadReceipt']);
    });

    // Payments
    Route::prefix('payments')->group(function () {
        Route::get('/', [PaymentController::class, 'index']);
        Route::get('/summary', [PaymentController::class, 'summary']);
        Route::get('/{payment}', [PaymentController::class, 'show']);
        Route::post('/sales/{sale}/payments', [PaymentController::class, 'store']);
        Route::post('/{payment}/verify', [PaymentController::class, 'verify']);
        Route::post('/{payment}/refund', [PaymentController::class, 'refund']);
    });

    // M-Pesa
    Route::prefix('mpesa')->group(function () {
        Route::post('/initiate', [MpesaController::class, 'initiateStkPush']);
        Route::get('/transactions', [MpesaController::class, 'transactions']);
        Route::get('/transactions/{mpesaTransaction}/verify', [MpesaController::class, 'verify']);
    });
});

// M-Pesa callback (public route, no auth required)
Route::post('/mpesa/callback', [MpesaController::class, 'callback']);
