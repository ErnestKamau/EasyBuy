<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('sale_number')->unique();
            $table->foreignId('order_id')->unique()->constrained('orders')->onDelete('cascade');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('cost_amount', 10, 2)->default(0);
            $table->decimal('profit_amount', 10, 2)->default(0);
            $table->enum('payment_status', ['fully-paid', 'partial-payment', 'no-payment', 'overdue'])->default('no-payment');
            $table->dateTime('due_date')->nullable();
            $table->boolean('receipt_generated')->default(false);
            $table->dateTime('made_on');
            $table->timestamps();
            $table->softDeletes();

            $table->index('sale_number');
            $table->index('order_id');
            $table->index('payment_status');
            $table->index('due_date');
            $table->index('made_on');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
