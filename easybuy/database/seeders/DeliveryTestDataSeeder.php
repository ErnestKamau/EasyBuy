<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\DriverLocation;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DeliveryTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Roles and Permissions first
        $this->call(RolesAndPermissionsSeeder::class);

        // 2. Create Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@easybuy.com'],
            [
                'username' => 'admin',
                'first_name' => 'Admin',
                'last_name' => 'User',
                'phone_number' => '0711000000',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );
        $admin->assignRole('admin');

        $riders = [];
        for ($i = 1; $i <= 3; $i++) {
            $rider = User::firstOrCreate(
                ['email' => "rider{$i}@easybuy.com"],
                [
                    'username' => "rider{$i}",
                    'first_name' => "Rider",
                    'last_name' => (string)$i,
                    'phone_number' => "072200000{$i}",
                    'password' => Hash::make('password'),
                    'role' => 'rider',
                    'online_status' => 'online',
                ]
            );
            $rider->assignRole('rider');
            $riders[] = $rider;

            // Create initial location for riders near a "shop" point
            DriverLocation::create([
                'id' => (string) Str::uuid(),
                'driver_id' => $rider->id,
                'latitude' => -1.2833 + (rand(-10, 10) / 1000),
                'longitude' => 36.8167 + (rand(-10, 10) / 1000),
                'recorded_at' => Carbon::now(),
            ]);
        }

        $customers = [];
        for ($i = 1; $i <= 3; $i++) {
            $customer = User::firstOrCreate(
                ['email' => "customer{$i}@easybuy.com"],
                [
                    'username' => "customer{$i}",
                    'first_name' => "Customer",
                    'last_name' => (string)$i,
                    'phone_number' => "073300000{$i}",
                    'password' => Hash::make('password'),
                    'role' => 'customer',
                ]
            );
            $customer->assignRole('customer');
            $customers[] = $customer;
        }

        // 3. Create Categories and Products
        $categories = [
            ['name' => 'Electronics'],
            ['name' => 'Groceries'],
            ['name' => 'Fashion'],
        ];

        foreach ($categories as $catData) {
            $category = Category::firstOrCreate(['name' => $catData['name']], ['is_active' => true]);
            
            // Create 3 products per category
            for ($j = 1; $j <= 3; $j++) {
                Product::create([
                    'category_id' => $category->id,
                    'name' => "{$catData['name']} Product {$j}",
                    'description' => "Description for {$catData['name']} product {$j}",
                    'sale_price' => rand(100, 5000),
                    'cost_price' => rand(50, 4000),
                    'in_stock' => rand(10, 100),
                    'kilograms_in_stock' => 0,
                    'minimum_stock' => 5,
                    'is_active' => true,
                ]);
            }
        }

        $allProducts = Product::all();

        // 4. Create Orders
        // Order 1: Pending Delivery (Needs Assignment)
        $order1 = Order::create([
            'user_id' => $customers[0]->id,
            'order_status' => 'pending',
            'fulfillment_status' => 'pending',
            'payment_status' => 'pending',
            'type' => 'delivery',
            'delivery_address' => 'Nairobi CBD, Kenya',
            'delivery_lat' => -1.2858,
            'delivery_lng' => 36.8219,
            'delivery_fee' => 150.00,
        ]);
        $this->addItemsToOrder($order1, $allProducts->random(2));

        // Order 2: Assigned Delivery (Waiting for Rider Acceptance)
        $order2 = Order::create([
            'user_id' => $customers[1]->id,
            'order_status' => 'confirmed',
            'fulfillment_status' => 'assigned',
            'payment_status' => 'fully-paid',
            'type' => 'delivery',
            'driver_id' => $riders[0]->id,
            'driver_assigned_at' => Carbon::now()->subMinutes(1),
            'delivery_address' => 'Westlands, Nairobi',
            'delivery_lat' => -1.2633,
            'delivery_lng' => 36.8041,
            'delivery_fee' => 200.00,
        ]);
        $this->addItemsToOrder($order2, $allProducts->random(2));

        // Order 3: In Transit Delivery
        $order3 = Order::create([
            'user_id' => $customers[2]->id,
            'order_status' => 'confirmed',
            'fulfillment_status' => 'picked_up', // Note: using picked_up which is valid and indicates transition
            'payment_status' => 'fully-paid',
            'type' => 'delivery',
            'driver_id' => $riders[1]->id,
            'driver_assigned_at' => Carbon::now()->subHours(1),
            'driver_accepted_at' => Carbon::now()->subMinutes(50),
            'trip_started_at' => Carbon::now()->subMinutes(15),
            'delivery_address' => 'Upperhill, Nairobi',
            'delivery_lat' => -1.2988,
            'delivery_lng' => 36.8153,
            'delivery_fee' => 100.00,
        ]);
        $this->addItemsToOrder($order3, $allProducts->random(1));

        // 5. Create a Sale for a completed order
        $order4 = Order::create([
            'user_id' => $customers[0]->id,
            'order_status' => 'confirmed', // 'delivered' is not valid for order_status
            'fulfillment_status' => 'delivered', // 'delivered' is valid for fulfillment_status
            'payment_status' => 'fully-paid',
            'type' => 'pickup',
            'delivered_at' => Carbon::yesterday()->addHours(2),
        ]);
        $this->addItemsToOrder($order4, $allProducts->random(3));
        
        $totalAmount = $order4->total_amount;
        $sale = Sale::create([
            'sale_number' => 'SAL-' . strtoupper(Str::random(8)),
            'order_id' => $order4->id,
            'total_amount' => $totalAmount,
            'total_paid' => $totalAmount,
            'payment_status' => 'fully-paid',
            'fulfillment_status' => 'fulfilled',
            'fulfilled_at' => Carbon::yesterday()->addHours(2),
            'made_on' => Carbon::now(),
        ]);

        Payment::create([
            'sale_id' => $sale->id,
            'amount' => $totalAmount,
            'method' => 'cash',
            'status' => 'completed',
            'payment_date' => Carbon::yesterday(),
        ]);
    }

    private function addItemsToOrder($order, $products)
    {
        foreach ($products as $product) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => rand(1, 5),
                'unit_price' => $product->sale_price,
            ]);
        }
    }
}
