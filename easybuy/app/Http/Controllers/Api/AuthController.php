<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255|unique:users',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone_number' => 'nullable|string|max:20',
            'gender' => 'nullable|string|in:male,female,other',
            'date_of_birth' => 'nullable|date',
        ]);

        $user = User::create([
            'username' => $validated['username'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone_number' => $validated['phone_number'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
        ]);

        event(new Registered($user));

        // Generate 4-digit verification code
        $code = str_pad((string) rand(0, 9999), 4, '0', STR_PAD_LEFT);

        // Store code in database with expiration (10 minutes)
        DB::table('email_verification_codes')->insert([
            'email' => $user->email,
            'code' => Hash::make($code),
            'created_at' => Carbon::now(),
        ]);

        // Send email with code
        // TODO: Implement email sending with the code
        // In production, send email: $user->sendEmailVerificationCode($code);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully. Please check your email for verification code.',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'code' => $code, // Remove this in production - only for testing
        ], 201);
    }

    public function verify(Request $request)
    {
        $user = User::find($request->route('id'));

        if (! $user) {
            return response()->json(['message' => 'Invalid user.'], 400);
        }

        if (! hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link.'], 400);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return response()->json(['message' => 'Email verified successfully.']);
    }

    public function resend(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }

    public function login(Request $request)
    {
        // Support both email and username login
        $loginField = $request->input('username') ? 'username' : 'email';
        $loginValue = $request->input('username') ?: $request->input('email');
        
        $validated = $request->validate([
            'username' => 'nullable|string',
            'email' => 'nullable|string|email',
            'password' => 'required|string',
        ]);

        // Attempt authentication with username or email
        $credentials = [
            $loginField => $loginValue,
            'password' => $validated['password'],
        ];

        if (! Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();

        // Check if email is verified
        if (! $user->hasVerifiedEmail()) {
            Auth::logout();
            return response()->json([
                'message' => 'Please verify your email address before logging in. Check your email for the verification link.',
                'email_verified' => false,
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User logged in successfully',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Web-based email verification (returns HTML view)
     */
    public function verifyEmail(Request $request)
    {
        $user = User::find($request->route('id'));

        if (! $user) {
            return view('verification.error', [
                'message' => 'Invalid user.',
                'deepLink' => 'easybuy://home'
            ]);
        }

        if (! hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return view('verification.error', [
                'message' => 'Invalid verification link.',
                'deepLink' => 'easybuy://home'
            ]);
        }

        if ($user->hasVerifiedEmail()) {
            return view('verification.already-verified', [
                'user' => $user,
                'deepLink' => 'easybuy://email-verified?user_id=' . $user->id
            ]);
        }

        // Mark as verified
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        // Show success page with deep link
        return view('verification.success', [
            'user' => $user,
            'deepLink' => 'easybuy://email-verified?user_id=' . $user->id
        ]);
    }

    /**
     * Send password reset code via email
     */
    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email|exists:users,email',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'We could not find a user with that email address.'
            ], 404);
        }

        // Generate 4-digit verification code
        $code = str_pad((string) rand(0, 9999), 4, '0', STR_PAD_LEFT);

        // Store code in database with expiration (10 minutes)
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($code),
                'created_at' => Carbon::now(),
            ]
        );

        // Send email with code
        // TODO: Implement email sending with the code
        // For now, we'll just return success
        // In production, send email: $user->sendPasswordResetCode($code);

        return response()->json([
            'message' => 'Password reset code has been sent to your email address.',
            'code' => $code, // Remove this in production - only for testing
        ], 200);
    }

    /**
     * Verify email verification code (for registration)
     */
    public function verifyEmailCode(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'code' => 'required|string|size:4',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid email address.'
            ], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified.'
            ], 400);
        }

        // Check if code matches (stored in email_verification_codes table)
        $storedCode = DB::table('email_verification_codes')
            ->where('email', $validated['email'])
            ->where('created_at', '>', Carbon::now()->subMinutes(10))
            ->latest()
            ->first();

        if (!$storedCode || !Hash::check($validated['code'], $storedCode->code)) {
            return response()->json([
                'message' => 'Invalid or expired verification code.'
            ], 400);
        }

        // Mark email as verified
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
            
            // Delete used code
            DB::table('email_verification_codes')
                ->where('email', $validated['email'])
                ->delete();

            return response()->json([
                'message' => 'Email verified successfully.',
                'user' => $user,
            ], 200);
        }

        return response()->json([
            'message' => 'Failed to verify email.'
        ], 500);
    }

    /**
     * Verify password reset code
     */
    public function verifyResetCode(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'code' => 'required|string|size:4',
        ]);

        $resetToken = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->where('created_at', '>', Carbon::now()->subMinutes(10))
            ->latest()
            ->first();

        if (!$resetToken || !Hash::check($validated['code'], $resetToken->token)) {
            return response()->json([
                'message' => 'Invalid or expired reset code.'
            ], 400);
        }

        return response()->json([
            'message' => 'Reset code verified successfully.',
            'verified' => true,
        ], 200);
    }

    /**
     * Reset password with verification code
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email|exists:users,email',
            'code' => 'required|string|size:4',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid email address.'
            ], 404);
        }

        // Verify reset code
        $resetToken = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->where('created_at', '>', Carbon::now()->subMinutes(10))
            ->latest()
            ->first();

        if (!$resetToken || !Hash::check($validated['code'], $resetToken->token)) {
            return response()->json([
                'message' => 'Invalid or expired reset code.'
            ], 400);
        }

        // Update password
        $user->password = Hash::make($validated['password']);
        $user->save();

        // Delete used reset token
        DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->delete();

        // Revoke all tokens for security
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password has been reset successfully.'
        ], 200);
    }
}
