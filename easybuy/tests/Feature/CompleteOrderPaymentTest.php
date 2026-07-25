<?php

namespace Tests\Feature;

use App\Actions\Payments\CompleteOrderPaymentAction;
use App\Events\PaymentReceived;
use App\Events\SaleCreated;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompleteOrderPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_completing_order_payment_confirms_order_and_creates_sale(): void
    {
        Event::fake([PaymentReceived::class, SaleCreated::class]);

        $customer = User::factory()->create([
            'role' => 'customer',
            'wallet_balance' => 0,
        ]);

        $category = Category::create([
            'name' => 'Test Category',
            'description' => 'Test',
            'is_active' => true,
        ]);

        $product = Product::create([
            'name' => 'Test Product ' . uniqid(),
            'category_id' => $category->id,
            'sale_price' => 100,
            'cost_price' => 40,
            'in_stock' => 10,
            'is_active' => true,
        ]);

        $order = Order::create([
            'user_id' => $customer->id,
            'type' => 'pickup',
            'order_status' => 'pending',
            'payment_status' => 'pending',
            'fulfillment_status' => 'pending',
            'delivery_fee' => 0,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'kilogram' => null,
            'unit_price' => 100,
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'mpesa',
            'amount' => 200,
            'status' => 'pending',
            'paid_at' => now(),
        ]);

        $result = app(CompleteOrderPaymentAction::class)->execute($payment);

        $order->refresh();
        $payment->refresh();

        $this->assertSame('completed', $result->status);
        $this->assertSame('confirmed', $order->order_status);
        $this->assertSame('fully-paid', $order->payment_status);
        $this->assertNotNull($order->sale);
        $this->assertSame($order->sale->id, $payment->sale_id);
        $this->assertEquals(200.0, (float) $order->sale->total_paid);

        Event::assertDispatched(SaleCreated::class);
        Event::assertDispatched(PaymentReceived::class);
    }

    public function test_payment_store_rejects_mpesa_and_card(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);

        $order = Order::create([
            'user_id' => $customer->id,
            'type' => 'pickup',
            'order_status' => 'confirmed',
            'payment_status' => 'pending',
            'fulfillment_status' => 'pending',
        ]);

        $sale = Sale::create([
            'order_id' => $order->id,
            'total_amount' => 500,
            'cost_amount' => 200,
            'profit_amount' => 300,
            'payment_status' => 'no-payment',
            'total_paid' => 0,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/payments/sales/{$sale->id}/payments", [
            'payment_method' => 'mpesa',
            'amount' => 100,
            'phone_number' => '254712345678',
        ])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Use POST /api/mpesa/initiate for M-Pesa payments']);

        $this->postJson("/api/payments/sales/{$sale->id}/payments", [
            'payment_method' => 'card',
            'amount' => 100,
        ])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Use POST /api/stripe/intent for card payments']);
    }
}
