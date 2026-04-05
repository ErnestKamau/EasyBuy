<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Creates the driver_locations table — a high-volume append-only log.
     *
     * Why this table exists:
     *   Redis stores the CURRENT driver position (fast, short-lived).
     *   This table stores the FULL HISTORY of every GPS point (for analytics,
     *   dispute resolution, route replay, and delivery performance reports).
     *
     * Design decisions:
     *   - Uses UUID primary key to avoid exposing sequential IDs.
     *   - `recorded_at` is the GPS chip timestamp (not created_at).
     *     This ensures accuracy even if there's network lag on the device.
     *   - Never update rows. Only insert. Treat this as an event log.
     *   - Composite index on (driver_id, recorded_at) speeds up queries like
     *     "show all points for driver X during order Y".
     */
    public function up(): void
    {
        Schema::create('driver_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Which driver this point belongs to
            $table->foreignId('driver_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Which order this movement was part of (null if driver was just moving around)
            $table->foreignId('order_id')
                  ->nullable()
                  ->constrained('orders')
                  ->nullOnDelete();

            // GPS coordinates
            // decimal(10, 8) supports -90.00000000 to 90.00000000 — full lat precision
            // decimal(11, 8) supports -180.00000000 to 180.00000000 — full lng precision
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);

            // Direction the driver is facing (0° = North, 90° = East, etc.)
            // Used by the React Native map to rotate the driver pin icon
            $table->decimal('heading', 5, 2)->nullable();

            // Speed in km/h — useful for detecting if driver is stuck in traffic
            $table->decimal('speed', 5, 2)->nullable();

            // The actual GPS timestamp from the device — NOT server time
            // This is the most accurate time for when the driver was at this location
            $table->timestamp('recorded_at');

            // No updated_at — this is append-only
            $table->timestamp('created_at')->useCurrent();

            // Composite index: queries for "all points for a driver during a time range" are instant
            $table->index(['driver_id', 'recorded_at']);
            $table->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_locations');
    }
};
