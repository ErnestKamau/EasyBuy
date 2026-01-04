<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class BroadcastingAuthController extends Controller
{
    /**
     * Authenticate broadcasting channel subscription
     * This handles authentication for Laravel Echo Server
     * Supports tokens from Authorization header or query parameter
     */
    public function authenticate(Request $request)
    {
        // Debug: Log what Echo Server is sending (remove in production)
        \Log::info('Broadcasting auth request', [
            'headers' => $request->headers->all(),
            'query' => $request->query->all(),
            'body' => $request->all(),
        ]);
        
        // Laravel Echo Server sends auth requests with socket_id and channel_name
        // But it doesn't automatically include the token from the Socket.IO connection
        // We need to get the token from the request in any way possible
        
        // Method 1: Try Authorization header (if Echo Server forwards it)
        $token = $request->bearerToken();
        
        // Method 2: Try query parameters (if Echo Server includes them)
        if (!$token) {
            $token = $request->query('token') 
                ?? $request->query('bearer_token')
                ?? $request->query('authorization');
        }
        
        // Method 3: Try request body (if Echo Server includes it)
        if (!$token) {
            $token = $request->input('token')
                ?? $request->input('bearer_token')
                ?? $request->input('authorization');
        }
        
        // Method 4: Try Authorization header manually
        if (!$token && $request->hasHeader('Authorization')) {
            $authHeader = $request->header('Authorization');
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }
        
        // Method 5: Try X-Auth-Token header (alternative header name)
        if (!$token && $request->hasHeader('X-Auth-Token')) {
            $token = $request->header('X-Auth-Token');
        }

        if (!$token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Find the token in the database
        $accessToken = PersonalAccessToken::findToken($token);
        
        if (!$accessToken) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Authenticate the user
        $user = $accessToken->tokenable;
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Set the authenticated user for this request
        Auth::setUser($user);

        // Get channel name and socket ID from request
        // Laravel Echo Server sends these in the POST body
        $channelName = $request->input('channel_name');
        $socketId = $request->input('socket_id');

        if (!$channelName || !$socketId) {
            return response()->json(['message' => 'Missing channel_name or socket_id.'], 400);
        }

        // Validate channel access
        if (str_starts_with($channelName, 'private-user.')) {
            // Extract user ID from channel name (format: private-user.{userId}.notifications)
            preg_match('/private-user\.(\d+)\.notifications/', $channelName, $matches);
            $channelUserId = isset($matches[1]) ? (int) $matches[1] : null;
            
            if ($channelUserId && (int) $user->id !== $channelUserId) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }
        } elseif ($channelName === 'private-admin.notifications') {
            // Check if user is admin
            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }
        }

        // Return success response
        // Laravel Echo Server expects a 200 response for successful authentication
        return response()->json([
            'auth' => hash_hmac('sha256', $socketId . ':' . $channelName, config('app.key')),
        ], 200);
    }
}
