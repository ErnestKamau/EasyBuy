<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $types = [
        'order_placed',
        'order_confirmed',
        'order_cancelled',
        'debt_warning_2days',
        'debt_warning_admin_2days',
        'debt_overdue',
        'debt_overdue_admin',
        'payment_received',
        'payment_received_admin',
        'sale_fully_paid',
        'low_stock_alert',
        'refund_processed',
        'new_product_available',
        'delivery_assigned',
        'delivery_accepted',
        'delivery_assignment_timeout',
        'delivery_needs_reassign',
        'package_on_the_way',
        'driver_arrived',
        'delivery_fulfilled',
        'driver_rated',
    ];

    public function up(): void
    {
        $list = "'" . implode("','", $this->types) . "'";
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM({$list}) NOT NULL");
        DB::statement("ALTER TABLE notification_preferences MODIFY COLUMN type ENUM({$list}) NOT NULL");
    }

    public function down(): void
    {
        $original = [
            'order_placed',
            'order_confirmed',
            'order_cancelled',
            'debt_warning_2days',
            'debt_warning_admin_2days',
            'debt_overdue',
            'debt_overdue_admin',
            'payment_received',
            'payment_received_admin',
            'sale_fully_paid',
            'low_stock_alert',
            'refund_processed',
            'new_product_available',
        ];
        $list = "'" . implode("','", $original) . "'";
        DB::statement("ALTER TABLE notifications MODIFY COLUMN type ENUM({$list}) NOT NULL");
        DB::statement("ALTER TABLE notification_preferences MODIFY COLUMN type ENUM({$list}) NOT NULL");
    }
};
