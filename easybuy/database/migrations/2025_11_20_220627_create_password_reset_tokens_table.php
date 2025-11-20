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
        // Laravel already has password_reset_tokens table, so we'll modify it if needed
        if (!Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        } else {
            // Table exists, ensure it has the columns we need
            Schema::table('password_reset_tokens', function (Blueprint $table) {
                if (!Schema::hasColumn('password_reset_tokens', 'email')) {
                    $table->string('email')->primary()->first();
                }
                if (!Schema::hasColumn('password_reset_tokens', 'token')) {
                    $table->string('token')->after('email');
                }
                if (!Schema::hasColumn('password_reset_tokens', 'created_at')) {
                    $table->timestamp('created_at')->nullable()->after('token');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
    }
};
