<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    /**
     * Get all products with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category');

        // Active only filter
        if ($request->boolean('active_only')) {
            $query->active();
        }

        // Category filter
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Low stock filter
        if ($request->boolean('low_stock_only')) {
            $query->lowStock();
        }

        // Search
        if ($request->has('search')) {
            $query->search($request->search);
        }

        // Price range
        if ($request->has('min_price')) {
            $query->where('sale_price', '>=', $request->min_price);
        }
        if ($request->has('max_price')) {
            $query->where('sale_price', '<=', $request->max_price);
        }

        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Get single product
     */
    public function show(Product $product): JsonResponse
    {
        $product->load('category');

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    /**
     * Create new product
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120|unique:products',
            'image_url' => 'nullable|string|max:500|url',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'kilograms_in_stock' => 'nullable|numeric|min:0.001',
            'cost_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'in_stock' => 'required|numeric|min:0',
            'minimum_stock' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // For kilogram mode: both kilograms_in_stock and minimum_stock are allowed
        // - kilograms_in_stock: current stock amount in kg
        // - minimum_stock: minimum kg threshold for low stock alerts
        // For quantity mode: only minimum_stock is used (minimum quantity threshold)
        // No mutual exclusivity validation needed - both fields can coexist

        $product = Product::create($validated);
        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product
        ], 201);
    }

    /**
     * Update product
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:120|unique:products,name,' . $product->id,
            'image_url' => 'nullable|string|max:500|url',
            'category_id' => 'sometimes|exists:categories,id',
            'description' => 'nullable|string',
            'kilograms_in_stock' => 'nullable|numeric|min:0.001',
            'cost_price' => 'sometimes|numeric|min:0',
            'sale_price' => 'sometimes|numeric|min:0',
            'in_stock' => 'sometimes|numeric|min:0',
            'minimum_stock' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // For kilogram mode: both kilograms_in_stock and minimum_stock are allowed
        // - kilograms_in_stock: current stock amount in kg
        // - minimum_stock: minimum kg threshold for low stock alerts
        // For quantity mode: only minimum_stock is used (minimum quantity threshold)
        // No mutual exclusivity validation needed - both fields can coexist

        $product->update($validated);
        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product
        ]);
    }

    /**
     * Delete product
     */
    public function destroy(Product $product): JsonResponse
    {
        // Check if product has order items
        if ($product->orderItems()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete product with existing order history'
            ], 422);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    }

    /**
     * Get low stock products
     */
    public function lowStock(): JsonResponse
    {
        $products = Product::lowStock()->with('category')->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
}
