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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
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
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // For storing order_id, sale_id, etc. for deep linking
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('type');
            $table->index('read_at');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
