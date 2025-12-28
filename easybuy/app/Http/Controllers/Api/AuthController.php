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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Mail\EmailVerificationCode;
use App\Mail\PasswordResetCode;

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
            'phone_number' => 'nullable|string|max:20|unique:users',
            'gender' => 'nullable|string|in:male,female,other',
            'date_of_birth' => 'nullable|date',
        ]);

        try {
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
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle database constraint violations
            $errorCode = $e->getCode();
            
            // MySQL error code 23000 is integrity constraint violation
            if ($errorCode == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
                $message = $e->getMessage();
                
                // Extract which field has the duplicate
                if (str_contains($message, 'users_username_unique') || str_contains($message, 'username')) {
                    return response()->json([
                        'message' => 'Registration failed',
                        'errors' => [
                            'username' => ['This username is already taken. Please choose another one.']
                        ]
                    ], 422);
                }
                
                if (str_contains($message, 'users_email_unique') || str_contains($message, 'email')) {
                    return response()->json([
                        'message' => 'Registration failed',
                        'errors' => [
                            'email' => ['This email address is already registered. Please use a different email or try logging in.']
                        ]
                    ], 422);
                }
                
                if (str_contains($message, 'users_phone_number_unique') || str_contains($message, 'phone_number')) {
                    return response()->json([
                        'message' => 'Registration failed',
                        'errors' => [
                            'phone_number' => ['This phone number is already registered. Please use a different phone number or try logging in.']
                        ]
                    ], 422);
                }
                
                // Generic duplicate entry message
                return response()->json([
                    'message' => 'Registration failed',
                    'errors' => [
                        'general' => ['This information is already registered. Please check your details and try again.']
                    ]
                ], 422);
            }
            
            // Re-throw if it's not a constraint violation
            throw $e;
        }

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
        try {
            Mail::to($user->email)->send(new EmailVerificationCode(
                $code,
                $user->first_name ?: $user->username
            ));
        } catch (\Exception $e) {
            // Log error but don't fail registration
            \Log::error('Failed to send verification email: ' . $e->getMessage());
        }

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
        try {
            Mail::to($user->email)->send(new PasswordResetCode(
                $code,
                $user->first_name ?: $user->username
            ));
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Log::error('Failed to send password reset email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Password reset code has been sent to your email address.',
            // Remove 'code' in production - only for testing
            'code' => $code,
        ], 200);
    }

    /**
     * Verify email verification OTP code (for registration)
     */
    public function verifyEmailCode(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'code' => 'required|string|size:4|regex:/^\d{4}$/',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid email address.'
            ], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified.',
                'user' => $user->fresh(),
            ], 400);
        }

        // Check if code exists and hasn't expired (10 minutes)
        $storedCode = DB::table('email_verification_codes')
            ->where('email', $validated['email'])
            ->where('created_at', '>', Carbon::now()->subMinutes(10))
            ->latest('created_at')
            ->first();

        // Check if code exists
        if (!$storedCode) {
            return response()->json([
                'message' => 'Verification code not found or has expired. Please request a new code.'
            ], 400);
        }

        // Verify the OTP code matches
        if (!Hash::check($validated['code'], $storedCode->code)) {
            return response()->json([
                'message' => 'Invalid verification code. Please check and try again.'
            ], 400);
        }

        // Mark email as verified
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
            
            // Delete used code
            DB::table('email_verification_codes')
                ->where('email', $validated['email'])
                ->delete();

            // Refresh user to get updated email_verified_at
            $user->refresh();

            return response()->json([
                'message' => 'Email verified successfully.',
                'user' => $user,
                'email_verified' => true,
            ], 200);
        }

        return response()->json([
            'message' => 'Failed to verify email. Please try again.'
        ], 500);
    }

    /**
     * Resend email verification OTP code
     */
    public function resendEmailVerificationCode(Request $request)
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

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified.'
            ], 400);
        }

        // Generate new 4-digit verification code
        $code = str_pad((string) rand(0, 9999), 4, '0', STR_PAD_LEFT);

        // Delete old codes for this email
        DB::table('email_verification_codes')
            ->where('email', $validated['email'])
            ->delete();

        // Store new code in database with expiration (10 minutes)
        DB::table('email_verification_codes')->insert([
            'email' => $user->email,
            'code' => Hash::make($code),
            'created_at' => Carbon::now(),
        ]);

        // Send email with code
        try {
            Mail::to($user->email)->send(new EmailVerificationCode(
                $code,
                $user->first_name ?: $user->username
            ));
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Log::error('Failed to send verification email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Verification code has been resent to your email address.',
            // Remove 'code' in production - only for testing
            'code' => $code,
        ], 200);
    }

    /**
     * Verify password reset OTP code
     */
    public function verifyResetCode(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email|exists:users,email',
            'code' => 'required|string|size:4|regex:/^\d{4}$/',
        ]);

        // Check if code exists and hasn't expired (10 minutes)
        $resetToken = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->where('created_at', '>', Carbon::now()->subMinutes(10))
            ->latest('created_at')
            ->first();

        // Check if code exists
        if (!$resetToken) {
            return response()->json([
                'message' => 'Reset code not found or has expired. Please request a new code.'
            ], 400);
        }

        // Verify the OTP code matches
        if (!Hash::check($validated['code'], $resetToken->token)) {
            return response()->json([
                'message' => 'Invalid reset code. Please check and try again.'
            ], 400);
        }

        return response()->json([
            'message' => 'Reset code verified successfully.',
            'verified' => true,
        ], 200);
    }

    /**
     * Reset password with OTP verification code
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email|exists:users,email',
            'code' => 'required|string|size:4|regex:/^\d{4}$/',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid email address.'
            ], 404);
        }

        // Verify reset OTP code exists and hasn't expired (10 minutes)
        $resetToken = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->where('created_at', '>', Carbon::now()->subMinutes(10))
            ->latest('created_at')
            ->first();

        // Check if code exists
        if (!$resetToken) {
            return response()->json([
                'message' => 'Reset code not found or has expired. Please request a new code.'
            ], 400);
        }

        // Verify the OTP code matches
        if (!Hash::check($validated['code'], $resetToken->token)) {
            return response()->json([
                'message' => 'Invalid reset code. Please check and try again.'
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
            'message' => 'Password has been reset successfully. Please login with your new password.'
        ], 200);
    }
}
