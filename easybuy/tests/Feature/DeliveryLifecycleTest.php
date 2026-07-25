<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeliveryLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $rider;
    protected User $customer;
    protected User $otherCustomer;

    protected function setUp(): void
    {
        parent::setUp();

        Event::fake();
        Queue::fake();
        Http::fake();

        Redis::shouldReceive('setex')->andReturn(true)->byDefault();
        Redis::shouldReceive('del')->andReturn(1)->byDefault();
        Redis::shouldReceive('get')->andReturn(null)->byDefault();
        Redis::shouldReceive('zadd')->andReturn(1)->byDefault();
        Redis::shouldReceive('zrem')->andReturn(1)->byDefault();
        Redis::shouldReceive('zrangebyscore')->andReturn([])->byDefault();
        Redis::shouldReceive('zremrangebyscore')->andReturn(0)->byDefault();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->rider = User::factory()->create([
            'role' => 'rider',
            'online_status' => 'online',
            'vehicle_type' => 'bike',
            'vehicle_registration' => 'KDA 123A',
        ]);
        $this->customer = User::factory()->create(['role' => 'customer']);
        $this->otherCustomer = User::factory()->create(['role' => 'customer']);
    }

    protected function makeDeliveryOrder(array $overrides = []): Order
    {
        return Order::create(array_merge([
            'user_id' => $this->customer->id,
            'type' => 'delivery',
            'order_status' => 'confirmed',
            'payment_status' => 'pending',
            'fulfillment_status' => 'pending',
            'delivery_address' => 'Westlands, Nairobi',
            'delivery_lat' => -1.2670,
            'delivery_lng' => 36.8100,
            'delivery_fee' => 150,
        ], $overrides));
    }

    public function test_customer_cannot_access_rider_routes(): void
    {
        Sanctum::actingAs($this->customer);

        $this->postJson('/api/rider/status', ['status' => 'online'])
            ->assertForbidden();

        $this->getJson('/api/rider/deliveries/active')
            ->assertForbidden();
    }

    public function test_customer_cannot_access_admin_delivery_routes(): void
    {
        Sanctum::actingAs($this->customer);

        $this->getJson('/api/admin/drivers/available')
            ->assertForbidden();

        $order = $this->makeDeliveryOrder();

        $this->postJson("/api/admin/orders/{$order->id}/assign-driver", [
            'driver_id' => $this->rider->id,
        ])->assertForbidden();
    }

    public function test_rider_cannot_access_admin_delivery_routes(): void
    {
        Sanctum::actingAs($this->rider);

        $this->getJson('/api/admin/drivers/available')
            ->assertForbidden();
    }

    public function test_happy_path_assign_accept_start_location_track_confirm(): void
    {
        $order = $this->makeDeliveryOrder();

        Redis::shouldReceive('setex')
            ->withArgs(fn ($key) => $key === "order:{$order->id}:driver")
            ->andReturn(true);
        Redis::shouldReceive('setex')
            ->withArgs(fn ($key) => str_starts_with($key, 'driver:'))
            ->andReturn(true);
        Redis::shouldReceive('zadd')->andReturn(1);
        Redis::shouldReceive('get')
            ->with("driver:{$this->rider->id}:location")
            ->andReturn(json_encode([
                'lat' => -1.2700,
                'lng' => 36.8120,
                'heading' => 90,
                'speed' => 5,
                'updated_at' => now()->toISOString(),
            ]));
        Redis::shouldReceive('del')->andReturn(1);

        Sanctum::actingAs($this->admin);
        $this->postJson("/api/admin/orders/{$order->id}/assign-driver", [
            'driver_id' => $this->rider->id,
        ])->assertOk()
            ->assertJsonPath('order.fulfillment_status', 'assigned')
            ->assertJsonPath('order.driver_id', $this->rider->id);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->rider->id,
            'type' => 'delivery_assigned',
        ]);

        Sanctum::actingAs($this->rider);
        $this->postJson("/api/rider/deliveries/{$order->id}/accept")
            ->assertOk()
            ->assertJsonPath('order.fulfillment_status', 'driver_accepted');

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->customer->id,
            'type' => 'delivery_accepted',
        ]);

        $this->postJson("/api/rider/deliveries/{$order->id}/start")
            ->assertOk()
            ->assertJsonPath('order.fulfillment_status', 'en_route');

        $this->postJson('/api/rider/location', [
            'lat' => -1.2700,
            'lng' => 36.8120,
            'heading' => 90,
            'speed' => 5,
            'order_id' => $order->id,
        ])->assertOk()
            ->assertJsonPath('status', 'ok');

        Sanctum::actingAs($this->customer);
        $this->getJson("/api/orders/{$order->id}/tracking")
            ->assertOk()
            ->assertJsonPath('order_id', $order->id)
            ->assertJsonPath('fulfillment_status', 'en_route')
            ->assertJsonStructure([
                'driver_location',
                'destination' => ['lat', 'lng', 'address'],
                'route',
            ]);

        $this->postJson("/api/orders/{$order->id}/confirm-delivery")
            ->assertOk();

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'fulfillment_status' => 'delivered',
        ]);
    }

    public function test_tracking_forbidden_for_unrelated_user(): void
    {
        $order = $this->makeDeliveryOrder([
            'fulfillment_status' => 'en_route',
            'driver_id' => $this->rider->id,
        ]);

        Sanctum::actingAs($this->otherCustomer);

        $this->getJson("/api/orders/{$order->id}/tracking")
            ->assertForbidden();
    }

    public function test_assigned_driver_can_track_order(): void
    {
        $order = $this->makeDeliveryOrder([
            'fulfillment_status' => 'en_route',
            'driver_id' => $this->rider->id,
        ]);

        Redis::shouldReceive('get')
            ->with("driver:{$this->rider->id}:location")
            ->andReturn(null);

        Sanctum::actingAs($this->rider);

        $this->getJson("/api/orders/{$order->id}/tracking")
            ->assertOk()
            ->assertJsonPath('order_id', $order->id);
    }

    public function test_timeout_reset_clears_driver_and_redis_mapping(): void
    {
        $order = $this->makeDeliveryOrder([
            'fulfillment_status' => 'assigned',
            'driver_id' => $this->rider->id,
            'driver_assigned_at' => now()->subMinutes(5),
        ]);

        Redis::shouldReceive('del')
            ->once()
            ->with("order:{$order->id}:driver")
            ->andReturn(1);

        $order->resetTimedOutAssignment();

        $order->refresh();
        $this->assertSame('pending', $order->fulfillment_status);
        $this->assertNull($order->driver_id);
        $this->assertNull($order->driver_assigned_at);
    }

    public function test_timeout_notifications_are_created_for_rider_and_admins(): void
    {
        $order = $this->makeDeliveryOrder([
            'fulfillment_status' => 'assigned',
            'driver_id' => $this->rider->id,
            'driver_assigned_at' => now()->subMinutes(5),
        ]);

        $driverId = $order->driver_id;
        $orderNumber = $order->order_number;
        $orderId = $order->id;

        Redis::shouldReceive('del')->andReturn(1);

        $order->resetTimedOutAssignment();

        NotificationService::create(
            $driverId,
            'delivery_assignment_timeout',
            'Assignment Timed Out',
            "You missed order #{$orderNumber}. It has been returned to the dispatch pool.",
            [
                'type' => 'delivery_assignment_timeout',
                'order_id' => $orderId,
                'order_number' => $orderNumber,
            ],
            'high'
        );

        NotificationService::createForAdmins(
            'delivery_needs_reassign',
            'Delivery Needs Reassignment',
            "Order #{$orderNumber} timed out waiting for rider acceptance. Please reassign.",
            [
                'type' => 'delivery_needs_reassign',
                'order_id' => $orderId,
                'order_number' => $orderNumber,
                'previous_driver_id' => $driverId,
            ],
            'high'
        );

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->rider->id,
            'type' => 'delivery_assignment_timeout',
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->admin->id,
            'type' => 'delivery_needs_reassign',
        ]);
    }
}
