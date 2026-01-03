<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL/MariaDB, we need to modify the enum column
        // First, update existing 'paid' values to 'fully-paid'
        DB::statement("UPDATE orders SET payment_status = 'fully-paid' WHERE payment_status = 'paid'");
        
        // Modify the enum column to include new values
        DB::statement("ALTER TABLE orders MODIFY COLUMN payment_status ENUM('pending', 'fully-paid', 'partially-paid', 'debt', 'failed') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert 'fully-paid' back to 'paid'
        DB::statement("UPDATE orders SET payment_status = 'paid' WHERE payment_status = 'fully-paid'");
        
        // Revert 'partially-paid' to 'pending' (closest match)
        DB::statement("UPDATE orders SET payment_status = 'pending' WHERE payment_status = 'partially-paid'");
        
        // Revert enum column to original values
        DB::statement("ALTER TABLE orders MODIFY COLUMN payment_status ENUM('pending', 'paid', 'debt', 'failed') DEFAULT 'pending'");
    }
};
