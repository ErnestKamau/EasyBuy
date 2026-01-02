<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('total_paid', 10, 2)->default(0)->after('total_amount');
        });
        
        // Backfill existing sales with their current total_paid
        DB::statement('
            UPDATE sales 
            SET total_paid = (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments 
                WHERE payments.sale_id = sales.id 
                AND payments.status = "completed"
            )
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('total_paid');
        });
    }
};
