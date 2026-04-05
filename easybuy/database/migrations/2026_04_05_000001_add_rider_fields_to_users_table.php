<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add rider-specific fields to the users table.
     * These fields are only relevant to users with role = 'rider'.
     * The role enum was already expanded separately to include 'rider'.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Rider shift status — tracked in Redis for real-time, persisted here for accuracy
            $table->enum('online_status', ['online', 'offline'])
                  ->default('offline')
                  ->after('role');

            // Vehicle details for dispatch info shown on Admin tracking screen
            $table->string('vehicle_type', 50)->nullable()->after('online_status');
            $table->string('vehicle_registration', 20)->nullable()->after('vehicle_type');

            // Firebase Cloud Messaging token — used to send push notifications to this user's device
            // Stored here so we can target specific users (driver assigned, customer tracking, etc.)
            $table->string('fcm_token')->nullable()->after('vehicle_registration');

            $table->index('online_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['online_status']);
            $table->dropColumn([
                'online_status',
                'vehicle_type',
                'vehicle_registration',
                'fcm_token',
            ]);
        });
    }
};
