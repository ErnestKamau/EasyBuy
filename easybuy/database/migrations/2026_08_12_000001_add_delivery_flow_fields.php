<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'vehicle_model')) {
                $table->string('vehicle_model', 80)->nullable()->after('vehicle_type');
            }
        });

        DB::statement("ALTER TABLE orders MODIFY COLUMN fulfillment_status ENUM(
            'pending',
            'preparing',
            'ready',
            'assigned',
            'driver_accepted',
            'en_route',
            'arrived',
            'delivered',
            'picked_up',
            'cancelled'
        ) NOT NULL DEFAULT 'pending'");

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'payment_timing')) {
                $table->enum('payment_timing', ['now', 'on_delivery'])
                    ->default('now')
                    ->after('payment_status');
            }
            if (!Schema::hasColumn('orders', 'payment_method')) {
                $table->enum('payment_method', ['cash', 'mpesa', 'card'])
                    ->nullable()
                    ->after('payment_timing');
            }
            if (!Schema::hasColumn('orders', 'arrived_at')) {
                $table->timestamp('arrived_at')->nullable()->after('trip_started_at');
            }
            if (!Schema::hasColumn('orders', 'delivery_qr_code')) {
                $table->string('delivery_qr_code', 64)->nullable()->after('pickup_qr_code');
            }
            if (!Schema::hasColumn('orders', 'delivery_verification_code')) {
                $table->string('delivery_verification_code', 20)->nullable()->after('delivery_qr_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'vehicle_model')) {
                $table->dropColumn('vehicle_model');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            $cols = ['payment_timing', 'payment_method', 'arrived_at', 'delivery_qr_code', 'delivery_verification_code'];
            $drop = array_filter($cols, fn ($c) => Schema::hasColumn('orders', $c));
            if ($drop) {
                $table->dropColumn($drop);
            }
        });

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
    }
};
