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
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('name', 'username');

            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone_number')->unique();
            $table->enum('gender', ['male', 'female']);
            $table->enum('role', ['admin', 'customer', 'transporter'])->default('customer');
            $table->string('profile_photo')->nullable();
            $table->integer('national_id_number')->unique()->nullable();
            $table->date('date_of_birth');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('username', 'name');
            $table->dropColumn(['first_name', 'last_name', 'phone_number', 'gender', 'role', 'profile_photo', 'national_id_number', 'date_of_birth']);
        });
    }
};
