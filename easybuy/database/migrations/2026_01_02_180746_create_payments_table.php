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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->enum('payment_method', ['mpesa', 'cash', 'card'])->default('cash');
            $table->decimal('amount', 10, 2);
            $table->string('mpesa_transaction_id')->nullable();
            $table->string('stripe_payment_intent_id')->nullable();
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('paid_at');
            $table->dateTime('refunded_at')->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('payment_number');
            $table->index('sale_id');
            $table->index('payment_method');
            $table->index('status');
            $table->index('paid_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
