<?php

namespace App\Jobs;

use App\Models\DeviceToken;
use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendExpoPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $notification;
    public $deviceTokens;

    /**
     * Create a new job instance.
     */
    public function __construct(Notification $notification, array $deviceTokens)
    {
        $this->notification = $notification;
        $this->deviceTokens = $deviceTokens;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (empty($this->deviceTokens)) {
            Log::warning('No device tokens provided for push notification', [
                'notification_id' => $this->notification->id
            ]);
            return;
        }

        try {
            // Prepare notification data for Expo
            $messages = array_map(function ($token) {
                return [
                    'to' => $token,
                    'sound' => 'default',
                    'title' => $this->notification->title,
                    'body' => $this->notification->message,
                    'data' => array_merge(
                        $this->notification->data ?? [],
                        [
                            'notification_id' => $this->notification->id,
                            'type' => $this->notification->type,
                        ]
                    ),
                    'priority' => $this->notification->priority === 'high' ? 'high' : 'default',
                    'badge' => 1, // Set badge count
                ];
            }, $this->deviceTokens);

            // Send to Expo Push Notification API
            $response = Http::post('https://exp.host/--/api/v2/push/send', $messages, [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate',
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                
                // Log successful sends
                Log::info('Push notifications sent successfully', [
                    'notification_id' => $this->notification->id,
                    'tokens_count' => count($this->deviceTokens),
                    'response' => $responseData
                ]);

                // Handle ticket responses (for tracking delivery status)
                if (isset($responseData['data']) && is_array($responseData['data'])) {
                    foreach ($responseData['data'] as $index => $ticket) {
                        if (isset($ticket['status']) && $ticket['status'] === 'error') {
                            Log::warning('Push notification error', [
                                'notification_id' => $this->notification->id,
                                'token_index' => $index,
                                'error' => $ticket['message'] ?? 'Unknown error'
                            ]);
                        }
                    }
                }
            } else {
                Log::error('Failed to send push notifications', [
                    'notification_id' => $this->notification->id,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Exception while sending push notifications', [
                'notification_id' => $this->notification->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
