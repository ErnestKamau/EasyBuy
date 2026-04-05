<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Expand the users.role enum to include 'rider'.
     *
     * The original enum was: ('admin', 'customer', 'transporter')
     * We add 'rider' for delivery drivers.
     *
     * Note: We keep 'transporter' for backward compatibility.
     * 'rider' is the role used by the delivery system going forward.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'admin',
            'customer',
            'transporter',
            'rider'
        ) NOT NULL DEFAULT 'customer'");
    }

    public function down(): void
    {
        // Note: If any users have role='rider', this will fail.
        // Update them first before rolling back.
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'admin',
            'customer',
            'transporter'
        ) NOT NULL DEFAULT 'customer'");
    }
};
