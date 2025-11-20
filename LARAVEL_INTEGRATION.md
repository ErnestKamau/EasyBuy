# Laravel Backend Integration Guide

This document outlines the integration of the Laravel/PHP backend with the React Native/TypeScript frontend, including email verification with deep linking.

## ✅ Completed Changes

### Backend (Laravel)

1. **API Routes** (`routes/api.php`):
   - Added `/api/login` route for authentication
   - Added `/api/logout` route (protected)
   - Added `/api/email/resend` route for resending verification emails
   - Updated `/api/user` route to return authenticated user

2. **Web Routes** (`routes/web.php`):
   - Added `/verify-email/{id}/{hash}` route for email verification (returns HTML views)

3. **AuthController** (`app/Http/Controllers/Api/AuthController.php`):
   - Updated `login()` to support both username and email login
   - Added `logout()` method
   - Added `verifyEmail()` method that returns Blade views for web-based verification
   - Registration already supports email verification

4. **Blade Templates** (`resources/views/verification/`):
   - `success.blade.php` - Success page with deep link button
   - `error.blade.php` - Error page for invalid verification links
   - `already-verified.blade.php` - Page for already verified emails
   - All templates use Bootstrap 5.3.2 CSS (via CDN) and are mobile-friendly

### Frontend (React Native)

1. **API Service** (`client/services/api.ts`):
   - Updated to work with Laravel's API structure:
     - `access_token` instead of `tokens.access`
     - No refresh tokens (Laravel Sanctum manages tokens differently)
     - Updated User interface to match Laravel's user model
   - Added `checkVerificationStatus()` method
   - Added `resendVerificationEmail()` method
   - Updated error handling for Laravel responses

2. **Auth Screen** (`client/app/auth.tsx`):
   - Added `first_name` and `last_name` fields to registration
   - Changed `password_confirm` to `password_confirmation`
   - Updated gender values to lowercase (`male`/`female`)
   - Removed role field (not in Laravel validation)
   - Updated registration handler to match Laravel requirements

3. **Deep Linking** (`client/app.json`):
   - Configured `easybuy://` scheme
   - Added Android intent filters
   - Added iOS associated domains (needs your domain)

4. **Deep Link Handling** (`client/app/_layout.tsx`):
   - Added deep link listener for `email-verified` path
   - Automatically checks verification status when deep link is opened
   - Shows success alert when email is verified

## 🔧 Configuration Required

### 1. Environment Variables

**Laravel Backend** (`.env`):
```env
APP_URL=http://your-domain.com
# or for local development:
APP_URL=http://localhost:8000

# Email configuration (for sending verification emails)
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"
```

**React Native Frontend** (`client/.env`):
```env
EXPO_PUBLIC_API_URL=http://your-laravel-backend-url/api
# For local development:
# EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api
# or
# EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### 2. CORS Configuration

Update `config/cors.php` or middleware to allow your React Native app's origin:

```php
'allowed_origins' => [
    'http://localhost:8081', // Expo dev server
    'exp://192.168.x.x:8081', // Expo dev server (network)
    // Add your production app URLs
],
```

### 3. iOS Associated Domains

In `client/app.json`, update the iOS associated domain:
```json
"ios": {
  "associatedDomains": ["applinks:yourdomain.com"]
}
```

Then configure your domain's `apple-app-site-association` file:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.easybuy.app",
        "paths": ["/verify-email/*"]
      }
    ]
  }
}
```

### 4. Email Verification URL

Laravel's default email verification notification uses the `verification.verify` named route, which we've configured in `web.php`. The verification email will automatically use this route.

If you need to customize the verification email, create a custom notification:

```bash
php artisan make:notification VerifyEmail
```

Then update `app/Models/User.php`:
```php
public function sendEmailVerificationNotification()
{
    $this->notify(new VerifyEmail);
}
```

## 📱 How Email Verification Works

1. **User registers** → Laravel sends verification email
2. **User clicks email link** → Opens browser to `/verify-email/{id}/{hash}`
3. **Laravel verifies email** → Marks `email_verified_at` in database
4. **Shows success page** → HTML page with "Open App" button
5. **User clicks button** → Deep link `easybuy://email-verified?user_id={id}` opens app
6. **App handles deep link** → Checks verification status with backend
7. **Shows success alert** → User can continue using the app

## 🧪 Testing

### Test Registration:
```bash
# Start Laravel server
cd easybuy
php artisan serve

# Start Expo dev server
cd client
npm start
```

1. Register a new user in the app
2. Check email for verification link
3. Click link in email (opens in browser)
4. Click "Open App" button
5. App should open and show verification success

### Test Login:
- Use username OR email to login
- Both should work

## 🔍 Troubleshooting

### Issue: Deep link not opening app
- **Android**: Check that intent filters are correctly configured in `app.json`
- **iOS**: Ensure associated domains are configured and `apple-app-site-association` file is accessible
- **Development**: Use `adb` (Android) or Xcode console (iOS) to test deep links

### Issue: Email verification link not working
- Check that `APP_URL` in Laravel `.env` matches your actual domain
- Verify the route is accessible: `http://your-domain.com/verify-email/{id}/{hash}`
- Check Laravel logs: `storage/logs/laravel.log`

### Issue: API requests failing
- Verify `EXPO_PUBLIC_API_URL` in `client/.env` is correct
- Check CORS configuration allows your app's origin
- Ensure Laravel server is running and accessible
- Check network connectivity between device and server

### Issue: Token not persisting
- Laravel Sanctum tokens are stored in the database
- Check that `personal_access_tokens` table exists (migrated)
- Verify token is being saved in AsyncStorage (check logs)

## 📝 API Endpoints

### Public Endpoints:
- `POST /api/register` - Register new user
- `POST /api/login` - Login (username or email)

### Protected Endpoints (require Bearer token):
- `GET /api/user` - Get current user
- `POST /api/logout` - Logout
- `POST /api/email/resend` - Resend verification email

### Web Endpoints:
- `GET /verify-email/{id}/{hash}` - Email verification (returns HTML)

## 🚀 Next Steps

1. Configure email service (SMTP or service like Mailgun/SendGrid)
2. Set up production domain and SSL certificate
3. Configure iOS associated domains for production
4. Test deep linking on physical devices
5. Set up error tracking (Sentry, etc.)
6. Configure rate limiting for API endpoints
7. Add email verification reminder notifications

## 📚 Additional Resources

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [Laravel Email Verification](https://laravel.com/docs/verification)
- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [Deep Linking Guide](https://reactnative.dev/docs/linking)

