<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Extends the orders table to support the full delivery lifecycle.
     *
     * IMPORTANT — fulfillment_status lifecycle:
     *   Pickup orders:   pending → preparing → ready → picked_up
     *   Delivery orders: pending → preparing → assigned → driver_accepted → en_route → delivered
     *
     * Existing 'pending', 'ready', 'picked_up' values are preserved for backward compatibility.
     */
    public function up(): void
    {
        // Step 1: Modify the fulfillment_status enum to include all delivery statuses.
        // MySQL requires a full column redefinition to change an enum.
        DB::statement("ALTER TABLE orders MODIFY COLUMN fulfillment_status ENUM(
            'pending',
            'preparing',
            'ready',
            'assigned',
            'driver_accepted',
            'en_route',
            'delivered',
            'picked_up'
        ) NOT NULL DEFAULT 'pending'");

        Schema::table('orders', function (Blueprint $table) {
            // Whether the customer wants home delivery or will collect from shop
            $table->enum('type', ['delivery', 'pickup'])
                  ->default('pickup') // default pickup for backward compat with existing orders
                  ->after('order_number');

            // The rider assigned to this delivery
            $table->foreignId('driver_id')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('users')
                  ->nullOnDelete();

            // Customer's drop-off location
            $table->text('delivery_address')->nullable()->after('notes');
            $table->decimal('delivery_lat', 10, 8)->nullable()->after('delivery_address');
            $table->decimal('delivery_lng', 11, 8)->nullable()->after('delivery_lat');

            // Cost of the delivery — separate from product total
            $table->decimal('delivery_fee', 10, 2)->default(0)->after('delivery_lng');

            // Timestamps for each lifecycle stage — useful for SLA tracking & analytics
            $table->timestamp('driver_assigned_at')->nullable()->after('delivery_fee');
            $table->timestamp('driver_accepted_at')->nullable()->after('driver_assigned_at');
            $table->timestamp('trip_started_at')->nullable()->after('driver_accepted_at');
            $table->timestamp('delivered_at')->nullable()->after('trip_started_at');

            $table->index('driver_id');
            $table->index('type');
        });
    }

    public function down(): void
    {
        // Revert fulfillment_status enum to original values
        DB::statement("ALTER TABLE orders MODIFY COLUMN fulfillment_status ENUM(
            'pending',
            'ready',
            'picked_up'
        ) NOT NULL DEFAULT 'pending'");

        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['driver_id']);
            $table->dropIndex(['driver_id']);
            $table->dropIndex(['type']);
            $table->dropColumn([
                'type',
                'driver_id',
                'delivery_address',
                'delivery_lat',
                'delivery_lng',
                'delivery_fee',
                'driver_assigned_at',
                'driver_accepted_at',
                'trip_started_at',
                'delivered_at',
            ]);
        });
    }
};
