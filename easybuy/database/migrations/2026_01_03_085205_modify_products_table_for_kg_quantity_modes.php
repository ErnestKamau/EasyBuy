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
        Schema::table('products', function (Blueprint $table) {
            // Rename kilograms to kilograms_in_stock
            $table->renameColumn('kilograms', 'kilograms_in_stock');
            
            // Change in_stock from unsignedInteger to decimal(10, 3) to support decimal kg values
            $table->decimal('in_stock', 10, 3)->default(0)->change();
            
            // Change minimum_stock from unsignedInteger to decimal(10, 3) and make nullable
            $table->decimal('minimum_stock', 10, 3)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Revert kilograms_in_stock back to kilograms
            $table->renameColumn('kilograms_in_stock', 'kilograms');
            
            // Revert in_stock back to unsignedInteger
            $table->unsignedInteger('in_stock')->default(0)->change();
            
            // Revert minimum_stock back to unsignedInteger with default
            $table->unsignedInteger('minimum_stock')->default(5)->change();
        });
    }
};
