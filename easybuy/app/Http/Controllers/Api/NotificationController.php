<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\DeviceToken;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Get user's notifications
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 20);
        $unreadOnly = $request->boolean('unread_only', false);

        $query = Notification::where(function ($q) use ($user) {
            // User-specific notifications
            $q->where('user_id', $user->id);
            // Admin notifications (null user_id means admin notification)
            if ($user->role === 'admin') {
                $q->orWhereNull('user_id');
            }
        })
        ->notArchived()
        ->latest();

        if ($unreadOnly) {
            $query->unread();
        }

        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }

    /**
     * Get unread notification count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = Notification::where(function ($q) use ($user) {
            $q->where('user_id', $user->id);
            // For admin notifications, we create separate notifications per admin
            // So we don't need to check for null user_id here
        })
        ->unread()
        ->notArchived()
        ->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count]
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        $user = $request->user();

        // Verify ownership
        if ($notification->user_id !== $user->id && ($notification->user_id !== null || $user->role !== 'admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => $notification
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        $updated = Notification::where(function ($q) use ($user) {
            $q->where('user_id', $user->id);
            if ($user->role === 'admin') {
                $q->orWhereNull('user_id');
            }
        })
        ->unread()
        ->notArchived()
        ->update(['read_at' => Carbon::now()]);

        return response()->json([
            'success' => true,
            'message' => "{$updated} notifications marked as read"
        ]);
    }

    /**
     * Delete notification
     */
    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        $user = $request->user();

        // Verify ownership
        if ($notification->user_id !== $user->id && ($notification->user_id !== null || $user->role !== 'admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted'
        ]);
    }

    /**
     * Get notification preferences
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        $preferences = NotificationPreference::where('user_id', $user->id)->get();

        return response()->json([
            'success' => true,
            'data' => $preferences
        ]);
    }

    /**
     * Update notification preference
     */
    public function updatePreference(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'type' => 'required|string',
            'enabled' => 'sometimes|boolean',
            'push_enabled' => 'sometimes|boolean',
        ]);

        $preference = NotificationPreference::updateOrCreate(
            [
                'user_id' => $user->id,
                'type' => $validated['type'],
            ],
            [
                'enabled' => $validated['enabled'] ?? true,
                'push_enabled' => $validated['push_enabled'] ?? true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Preference updated',
            'data' => $preference
        ]);
    }

    /**
     * Register device token for push notifications
     */
    public function registerDeviceToken(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'device_token' => 'required|string',
            'platform' => 'required|in:ios,android',
        ]);

        $deviceToken = DeviceToken::updateOrCreate(
            [
                'device_token' => $validated['device_token'],
            ],
            [
                'user_id' => $user->id,
                'platform' => $validated['platform'],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Device token registered',
            'data' => $deviceToken
        ]);
    }

    /**
     * Unregister device token
     */
    public function unregisterDeviceToken(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'device_token' => 'required|string',
        ]);

        DeviceToken::where('user_id', $user->id)
            ->where('device_token', $validated['device_token'])
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Device token unregistered'
        ]);
    }
}
