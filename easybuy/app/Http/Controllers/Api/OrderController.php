<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Exceptions\InsufficientStockException;

class OrderController extends Controller
{
    /**
     * Get all orders with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items.product']);

        // Status filters
        if ($request->has('order_status')) {
            $query->where('order_status', $request->order_status);
        }

        if ($request->has('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // User filter
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Date range
        if ($request->has('date_from')) {
            $query->where('order_date', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('order_date', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 15);
        $orders = $query->latest('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Get single order
     */
    public function show(Order $order): JsonResponse
    {
        $order->load(['user', 'items.product']);

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Create new order
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required_without:items.*.kilogram|integer|min:1',
            'items.*.kilogram' => 'required_without:items.*.quantity|numeric|min:0.001',
            'payment_status' => 'sometimes|in:pending,paid,debt,failed',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $order = Order::create([
                'user_id' => $validated['user_id'] ?? $request->user()->id ?? null,
                'payment_status' => $validated['payment_status'] ?? 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                // Check stock availability
                if (isset($itemData['quantity'])) {
                    if ($product->in_stock < $itemData['quantity']) {
                        throw new InsufficientStockException($product->name);
                    }
                } elseif (isset($itemData['kilogram'])) {
                    // For items sold by weight, check if we have enough stock
                    // Note: in_stock is integer, so we compare as integer
                    if ($product->in_stock < (int) ceil($itemData['kilogram'])) {
                        throw new InsufficientStockException($product->name);
                    }
                }

                $order->items()->create([
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'] ?? 0,
                    'kilogram' => $itemData['kilogram'] ?? null,
                    'unit_price' => $product->sale_price,
                ]);
            }

            DB::commit();

            $order->load(['user', 'items.product']);

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => $order
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Update order
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        // Prevent updates to confirmed orders
        if ($order->order_status === 'confirmed') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot update confirmed orders'
            ], 422);
        }

        $validated = $request->validate([
            'order_status' => 'sometimes|in:pending,confirmed,cancelled',
            'payment_status' => 'sometimes|in:pending,paid,debt,failed',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // If confirming order, update stock and create sale
            if (isset($validated['order_status']) && $validated['order_status'] === 'confirmed') {
                $order->confirm();
                
                // Create sale from confirmed order
                if (!$order->sale) {
                    $saleController = new \App\Http\Controllers\Api\SaleController();
                    $saleController->createFromOrder($order);
                }
            } else {
                $order->update($validated);
            }

            DB::commit();

            $order->load(['user', 'items.product', 'sale']);

            return response()->json([
                'success' => true,
                'message' => 'Order updated successfully',
                'data' => $order
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Cancel order
     */
    public function cancel(Order $order): JsonResponse
    {
        if ($order->order_status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Order is already cancelled'
            ], 422);
        }

        DB::beginTransaction();
        try {
            if ($order->order_status === 'confirmed') {
                // Restore stock if order was confirmed
                foreach ($order->items as $item) {
                    $product = $item->product;
                    if ($item->kilogram) {
                        // For items sold by weight, restore the integer equivalent
                        $product->increment('in_stock', (int) ceil($item->kilogram));
                    } else {
                        $product->increment('in_stock', $item->quantity);
                    }
                }
            }

            $order->update(['order_status' => 'cancelled']);

            DB::commit();

            $order->load(['user', 'items.product']);

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully',
                'data' => $order
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}

