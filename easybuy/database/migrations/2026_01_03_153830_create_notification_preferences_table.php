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
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', [
                'order_placed',
                'order_confirmed',
                'order_cancelled',
                'debt_warning_2days',
                'debt_warning_admin_2days',
                'debt_overdue',
                'debt_overdue_admin',
                'payment_received',
                'payment_received_admin',
                'sale_fully_paid',
                'low_stock_alert',
                'refund_processed',
                'new_product_available'
            ]);
            $table->boolean('enabled')->default(true);
            $table->boolean('push_enabled')->default(true);
            $table->timestamps();
            
            $table->unique(['user_id', 'type']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
