<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Actions\Delivery\AcceptDeliveryAction;
use App\Actions\Payments\CompleteOrderPaymentAction;
use App\Events\OrderStatusUpdated;
use App\Mail\PackageOnTheWay;
use App\Models\DriverRating;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\Maps\DirectionsService;
use App\Services\NotificationService;
use App\Services\ReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redis;
use Illuminate\Validation\ValidationException;

class DeliveryController extends Controller
{
    public function accept(Request $request, Order $order, AcceptDeliveryAction $action): JsonResponse
    {
        $order = $action->execute($order, $request->user());

        return response()->json([
            'message' => 'Delivery accepted successfully.',
            'order'   => $this->forDriver($order),
        ]);
    }

    public function start(Request $request, Order $order): JsonResponse
    {
        $driver = $request->user();

        if ($order->driver_id !== $driver->id) {
            throw ValidationException::withMessages(['order' => 'You are not the assigned driver.']);
        }

        if ($order->fulfillment_status !== 'driver_accepted') {
            throw ValidationException::withMessages(['order' => 'The delivery must be accepted before starting.']);
        }

        $order->update([
            'fulfillment_status' => 'en_route',
            'trip_started_at'    => now(),
        ]);

        $order = $order->fresh(['driver', 'user', 'items.product']);
        $this->notifyPackageOnTheWay($order);
        broadcast(new OrderStatusUpdated($order))->toOthers();

        return response()->json(['message' => 'Trip started.', 'order' => $this->forDriver($order)]);
    }

    public function arrive(Request $request, Order $order): JsonResponse
    {
        $driver = $request->user();
        if ($order->driver_id !== $driver->id) {
            throw ValidationException::withMessages(['order' => 'You are not the assigned driver.']);
        }
        if ($order->fulfillment_status !== 'en_route') {
            throw ValidationException::withMessages(['order' => 'Order is not currently en route.']);
        }

        $order->update([
            'fulfillment_status' => 'arrived',
            'arrived_at' => now(),
        ]);
        $order->generateDeliveryQrCode();
        $order = $order->fresh(['driver', 'user', 'items.product']);

        if ($order->user_id) {
            NotificationService::create(
                $order->user_id,
                'driver_arrived',
                'Your rider is here.',
                "They’re at the door for {$order->order_number}. Head out when you’re ready.",
                ['type' => 'driver_arrived', 'order_id' => $order->id],
                'high'
            );
        }

        broadcast(new OrderStatusUpdated($order))->toOthers();

        return response()->json(['message' => 'Arrival declared.', 'order' => $this->forDriver($order)]);
    }

    public function index(Request $request): JsonResponse
    {
        $orders = Order::where('driver_id', $request->user()->id)
            ->whereIn('fulfillment_status', ['assigned', 'driver_accepted', 'en_route', 'arrived'])
            ->with(['user', 'items.product'])
            ->latest('driver_assigned_at')
            ->get()
            ->map(fn (Order $o) => $this->forDriver($o));

        return response()->json(['orders' => $orders]);
    }

    public function history(Request $request): JsonResponse
    {
        $orders = Order::where('driver_id', $request->user()->id)
            ->whereIn('fulfillment_status', ['delivered', 'picked_up'])
            ->with(['user', 'items.product'])
            ->latest('delivered_at')
            ->get();

        return response()->json(['orders' => $orders]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        if ((int) $order->driver_id !== (int) $request->user()->id) {
            abort(403, 'You are not the assigned driver.');
        }
        $order->load(['user', 'items.product']);
        return response()->json(['order' => $this->forDriver($order)]);
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $avg = round((float) DriverRating::where('driver_id', $user->id)->avg('rating'), 1);
        $count = DriverRating::where('driver_id', $user->id)->count();

        return response()->json([
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone_number' => $user->phone_number,
            'vehicle_type' => $user->vehicle_type,
            'vehicle_model' => $user->vehicle_model,
            'vehicle_registration' => $user->vehicle_registration,
            'average_rating' => $avg,
            'rating_count' => $count,
            'online_status' => $user->online_status,
        ]);
    }

    public function active(Request $request): JsonResponse
    {
        $order = Order::where('driver_id', $request->user()->id)
            ->whereIn('fulfillment_status', ['assigned', 'driver_accepted', 'en_route', 'arrived'])
            ->with(['user', 'items.product'])
            ->first();

        return response()->json(['order' => $order ? $this->forDriver($order) : null]);
    }

    public function tracking(Request $request, Order $order, DirectionsService $maps): JsonResponse
    {
        $user = $request->user();
        $isOwner = $user && (int) $user->id === (int) $order->user_id;
        $isAdmin = $user && $user->role === 'admin';
        $isAssignedDriver = $user && $order->driver_id && (int) $user->id === (int) $order->driver_id;

        if (!$isOwner && !$isAdmin && !$isAssignedDriver) {
            abort(403, 'You are not authorized to track this order.');
        }

        $order->loadMissing('driver');

        $locationJson = Redis::get("driver:{$order->driver_id}:location");
        $driverLocation = $locationJson ? json_decode($locationJson, true) : null;

        $route = null;
        if ($driverLocation && $order->delivery_lat && $order->delivery_lng) {
            $route = $maps->getRoute(
                $driverLocation['lat'],
                $driverLocation['lng'],
                (float) $order->delivery_lat,
                (float) $order->delivery_lng,
            );
        }

        return response()->json([
            'order_id'           => $order->id,
            'fulfillment_status' => $order->fulfillment_status,
            'payment_status'     => $order->payment_status,
            'payment_method'     => $order->payment_method,
            'payment_timing'     => $order->payment_timing,
            'driver'             => $order->driver ? [
                'id'                   => $order->driver->id,
                'name'                 => $order->driver->first_name . ' ' . $order->driver->last_name,
                'vehicle_type'         => $order->driver->vehicle_type,
                'vehicle_model'        => $order->driver->vehicle_model,
                'vehicle_registration' => $order->driver->vehicle_registration,
                'average_rating'       => $order->driver->average_rating,
            ] : null,
            'driver_location' => $driverLocation,
            'destination'     => [
                'lat'     => $order->delivery_lat,
                'lng'     => $order->delivery_lng,
                'address' => $order->delivery_address,
            ],
            'route' => $route,
        ]);
    }

    public function confirmDelivery(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            abort(403, 'You do not own this order.');
        }

        if (!in_array($order->fulfillment_status, ['en_route', 'arrived'])) {
            throw ValidationException::withMessages(['order' => 'Order is not currently out for delivery.']);
        }

        $this->markDelivered($order);

        return response()->json(['message' => 'Delivery confirmed. Thank you!']);
    }

    public function riderConfirm(Request $request, Order $order): JsonResponse
    {
        $driver = $request->user();

        if ($order->driver_id !== $driver->id) {
            throw ValidationException::withMessages(['order' => 'You are not the assigned driver.']);
        }

        if (!in_array($order->fulfillment_status, ['en_route', 'arrived'])) {
            throw ValidationException::withMessages(['order' => 'Order is not currently out for delivery.']);
        }

        $this->markDelivered($order);

        return response()->json(['message' => 'Delivery marked as completed.', 'order' => $order]);
    }

    public function verifyDeliveryQr(Request $request, Order $order, ReceiptService $receipts): JsonResponse
    {
        $validated = $request->validate([
            'qr_code' => 'required|string',
        ]);

        if ($order->user_id !== $request->user()->id) {
            abort(403, 'You do not own this order.');
        }

        $matched = Order::verifyDeliveryQrCode($validated['qr_code']);
        if (!$matched || $matched->id !== $order->id) {
            throw ValidationException::withMessages(['qr_code' => 'Invalid or expired delivery QR code.']);
        }

        if ($order->payment_timing === 'on_delivery' && $order->payment_status !== 'fully-paid') {
            throw ValidationException::withMessages([
                'payment' => 'Payment on delivery must be completed before scanning.',
            ]);
        }

        $this->markDelivered($order);

        $order->loadMissing('sale');
        if ($order->sale) {
            $order->sale->markAsFulfilled();
            try {
                $receipts->generateReceipt($order->sale);
            } catch (\Throwable $e) {
                // Receipt generation should not block handover
            }
        }

        if ($order->user_id) {
            NotificationService::create(
                $order->user_id,
                'delivery_fulfilled',
                'Delivered. You’re all set.',
                "{$order->order_number} is fulfilled. Your receipt is waiting in Orders.",
                ['type' => 'delivery_fulfilled', 'order_id' => $order->id],
                'high'
            );
        }

        return response()->json([
            'message' => 'Delivery verified.',
            'order' => $order->fresh(['driver', 'items.product', 'sale']),
        ]);
    }

    public function rateDriver(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        if ($order->user_id !== $request->user()->id) {
            abort(403, 'You do not own this order.');
        }
        if ($order->fulfillment_status !== 'delivered') {
            throw ValidationException::withMessages(['order' => 'You can rate after the delivery is fulfilled.']);
        }
        if (!$order->driver_id) {
            throw ValidationException::withMessages(['driver' => 'No driver on this order.']);
        }

        $rating = DriverRating::updateOrCreate(
            ['order_id' => $order->id],
            [
                'customer_id' => $request->user()->id,
                'driver_id' => $order->driver_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]
        );

        NotificationService::create(
            $order->driver_id,
            'driver_rated',
            'New rating',
            "A customer rated you {$validated['rating']} stars.",
            ['type' => 'driver_rated', 'order_id' => $order->id, 'rating' => $validated['rating']],
            'medium'
        );

        return response()->json(['message' => 'Thanks for your rating.', 'rating' => $rating]);
    }

    public function collectCash(Request $request, Order $order, CompleteOrderPaymentAction $complete): JsonResponse
    {
        $user = $request->user();
        $isDriver = $order->driver_id && (int) $user->id === (int) $order->driver_id;
        $isAdmin = $user->role === 'admin';
        if (!$isDriver && !$isAdmin) {
            abort(403, 'Only the assigned driver or an admin can confirm cash.');
        }
        if ($order->payment_timing !== 'on_delivery') {
            throw ValidationException::withMessages(['payment' => 'This order is not pay-on-delivery.']);
        }
        if ($order->payment_method !== 'cash') {
            throw ValidationException::withMessages(['payment' => 'Selected method is not cash.']);
        }
        if ($order->fulfillment_status !== 'arrived') {
            throw ValidationException::withMessages(['order' => 'Confirm arrival before collecting cash.']);
        }
        if ($order->payment_status === 'fully-paid') {
            return response()->json(['message' => 'Already paid.', 'order' => $order]);
        }

        $order->loadMissing('sale');

        $amount = (float) $order->total_amount + (float) ($order->delivery_fee ?? 0);
        $payment = Payment::create([
            'order_id' => $order->id,
            'sale_id' => $order->sale?->id,
            'payment_method' => 'cash',
            'amount' => $amount,
            'status' => 'pending',
            'notes' => 'Cash collected on delivery',
        ]);
        $complete->execute($payment);

        return response()->json([
            'message' => 'Cash payment recorded.',
            'order' => $order->fresh(['sale.payments']),
        ]);
    }

    private function markDelivered(Order $order): void
    {
        $order->update([
            'fulfillment_status' => 'delivered',
            'delivered_at'       => now(),
        ]);
        Redis::del("order:{$order->id}:driver");
        broadcast(new OrderStatusUpdated($order->fresh(['driver', 'user'])))->toOthers();
    }

    private function notifyPackageOnTheWay(Order $order): void
    {
        if (!$order->user_id) {
            return;
        }
        $driverName = $order->driver
            ? trim("{$order->driver->first_name} {$order->driver->last_name}")
            : 'Your rider';

        NotificationService::create(
            $order->user_id,
            'package_on_the_way',
            'Your package left the shop.',
            "{$driverName} is heading to you with {$order->order_number}. Track it live in Orders.",
            ['type' => 'package_on_the_way', 'order_id' => $order->id],
            'high'
        );

        if ($order->user?->email) {
            try {
                Mail::to($order->user->email)->queue(new PackageOnTheWay($order));
            } catch (\Throwable $e) {
                // Don't block trip start if mail fails
            }
        }
    }

    private function forDriver(Order $order): Order
    {
        $order->loadMissing(['user', 'items.product']);
        if ($order->fulfillment_status !== 'arrived' && $order->user) {
            $order->user->makeHidden(['phone_number']);
        }
        return $order;
    }
}
