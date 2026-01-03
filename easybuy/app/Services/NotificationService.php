<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\DeviceToken;
use App\Models\User;
use App\Jobs\SendExpoPushNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * Create a notification for a user or admin
     */
    public static function create(
        ?int $userId,
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = 'medium'
    ): ?Notification {
        try {
            // Check if user has preference enabled
            if ($userId) {
                $preference = NotificationPreference::where('user_id', $userId)
                    ->where('type', $type)
                    ->first();

                if ($preference && !$preference->enabled) {
                    // User has disabled this notification type
                    return null;
                }
            }

            // Create notification
            $notification = Notification::create([
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
                'priority' => $priority,
            ]);

            // Broadcast notification (for real-time updates)
            // This will be handled by Laravel Broadcasting

            // Send push notification if enabled
            if ($userId) {
                $preference = NotificationPreference::where('user_id', $userId)
                    ->where('type', $type)
                    ->first();

                if (!$preference || $preference->push_enabled) {
                    self::sendPushNotification($userId, $notification);
                }
            }

            return $notification;
        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'user_id' => $userId,
                'type' => $type,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Create notification for all admins
     */
    public static function createForAdmins(
        string $type,
        string $title,
        string $message,
        array $data = [],
        string $priority = 'medium'
    ): void {
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            self::create($admin->id, $type, $title, $message, $data, $priority);
        }
    }

    /**
     * Send push notification via Expo
     */
    protected static function sendPushNotification(int $userId, Notification $notification): void
    {
        try {
            $deviceTokens = DeviceToken::where('user_id', $userId)->get();

            if ($deviceTokens->isEmpty()) {
                return; // No device tokens registered
            }

            // Get device tokens
            $expoPushTokens = $deviceTokens->pluck('device_token')->toArray();

            // Dispatch job to send push notifications asynchronously
            SendExpoPushNotification::dispatch($notification, $expoPushTokens);
        } catch (\Exception $e) {
            Log::error('Failed to queue push notification', [
                'user_id' => $userId,
                'notification_id' => $notification->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Initialize default preferences for a user
     */
    public static function initializePreferences(User $user): void
    {
        $defaults = NotificationPreference::getDefaultsForUser($user->id, $user->role);

        foreach ($defaults as $type => $settings) {
            NotificationPreference::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'type' => $type,
                ],
                [
                    'enabled' => $settings['enabled'],
                    'push_enabled' => $settings['push_enabled'],
                ]
            );
        }
    }

    /**
     * Clean up old notifications (older than 30 days)
     */
    public static function cleanupOldNotifications(int $days = 30): int
    {
        return Notification::olderThan($days)
            ->whereNotNull('read_at') // Only delete read notifications
            ->delete();
    }
}
