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
        Schema::table('payments', function (Blueprint $table) {
            // Make sale_id nullable (payments can exist before sale)
            $table->foreignId('sale_id')->nullable()->change();
            
            // Add order_id for pre-sale payments
            $table->foreignId('order_id')->nullable()->after('id')->constrained('orders')->onDelete('cascade');
            
            $table->index('order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->dropIndex(['order_id']);
            $table->dropColumn('order_id');
            
            // Note: Cannot easily revert sale_id to not nullable if data exists
            // This would need manual data cleanup
        });
    }
};
