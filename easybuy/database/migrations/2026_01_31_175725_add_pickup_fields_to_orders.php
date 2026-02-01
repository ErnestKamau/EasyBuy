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
        Schema::table('orders', function (Blueprint $table) {
            // Pickup scheduling
            $table->dateTime('pickup_time')->nullable()->after('order_time');
            
            // Fulfillment tracking
            $table->enum('fulfillment_status', [
                'pending',      // Order created, not yet ready
                'ready',        // Awaiting customer pickup
                'picked_up'     // Customer picked up, order complete
            ])->default('pending')->after('payment_status');
            
            // QR code for pickup verification
            $table->string('pickup_verification_code', 20)->nullable()->after('fulfillment_status');
            $table->string('pickup_qr_code')->nullable()->after('pickup_verification_code');
            
            // Cancellation tracking
            $table->dateTime('cancelled_at')->nullable()->after('pickup_qr_code');
            $table->text('cancellation_reason')->nullable()->after('cancelled_at');
            
            $table->index('fulfillment_status');
            $table->index('pickup_time');
            $table->index('pickup_verification_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['fulfillment_status']);
            $table->dropIndex(['pickup_time']);
            $table->dropIndex(['pickup_verification_code']);
            
            $table->dropColumn([
                'pickup_time',
                'fulfillment_status',
                'pickup_verification_code',
                'pickup_qr_code',
                'cancelled_at',
                'cancellation_reason'
            ]);
        });
    }
};
