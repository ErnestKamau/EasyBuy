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
        Schema::table('sales', function (Blueprint $table) {
            // Track fulfillment separately from payment
            $table->enum('fulfillment_status', [
                'unfulfilled',  // Order awaiting pickup
                'fulfilled'     // Customer picked up
            ])->default('unfulfilled')->after('payment_status');
            
            // When was order actually fulfilled (picked up)
            $table->dateTime('fulfilled_at')->nullable()->after('made_on');
            
            $table->index('fulfillment_status');
            $table->index('fulfilled_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['fulfillment_status']);
            $table->dropIndex(['fulfilled_at']);
            $table->dropColumn(['fulfillment_status', 'fulfilled_at']);
        });
    }
};
