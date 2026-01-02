<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('mpesa_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->unique()->constrained('payments')->onDelete('cascade');
            $table->string('transaction_id')->unique();
            $table->string('checkout_request_id')->unique();
            $table->string('merchant_request_id')->nullable();
            $table->string('account_reference')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('phone_number', 15);
            $table->string('transaction_desc')->nullable();
            $table->enum('status', ['pending', 'success', 'failed', 'cancelled'])->default('pending');
            $table->string('mpesa_receipt_number')->nullable();
            $table->dateTime('transaction_date')->nullable();
            $table->integer('result_code')->nullable();
            $table->string('result_desc')->nullable();
            $table->json('callback_data')->nullable();
            $table->timestamps();
            
            $table->index('transaction_id');
            $table->index('checkout_request_id');
            $table->index('payment_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mpesa_transactions');
    }
};
