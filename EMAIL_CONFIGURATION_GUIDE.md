# Email Configuration Guide for Laravel

This guide explains where to get email configuration values for your Laravel application.

## Option 1: Gmail (Easiest for Development/Testing)

### Setup Steps

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to: <https://myaccount.google.com/apppasswords>
   - Select "Mail" and "Other (Custom name)"
   - Enter "Laravel EasyBuy" as the name
   - Click "Generate"
   - Copy the 16-character password (you'll use this as `MAIL_PASSWORD`)

### Configuration in `.env`

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-character-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

---

## Option 2: Mailtrap (Best for Development/Testing)

Mailtrap is a fake SMTP server that catches all emails - perfect for testing without sending real emails.

### Setup Steps

1. **Sign up** at: <https://mailtrap.io> (Free tier available)
2. **Create an inbox** in your Mailtrap dashboard
3. **Go to SMTP Settings** → Select "Laravel" integration
4. Copy the credentials

### Configuration in `.env`

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@easybuy.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Note**: Emails sent to Mailtrap won't actually be delivered - they'll appear in your Mailtrap inbox for testing.

---

## Option 3: SendGrid (Production Ready)

SendGrid offers a free tier (100 emails/day) and is great for production.

### Setup Steps

1. **Sign up** at: <https://sendgrid.com>
2. **Verify your sender identity** (email or domain)
3. **Create an API Key**:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Give it a name (e.g., "Laravel EasyBuy")
   - Select "Full Access" or "Mail Send" permissions
   - Copy the API key (you'll use this as `MAIL_PASSWORD`)

### Configuration in `.env`

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-verified-email@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"
```

---

## Option 4: Mailgun (Production Ready)

Mailgun offers a free tier (5,000 emails/month for 3 months, then 1,000/month).

### Setup Steps

1. **Sign up** at: <https://www.mailgun.com>
2. **Verify your domain** or use the sandbox domain for testing
3. **Get your credentials**:
   - Go to Sending → Domain Settings
   - Copy the SMTP credentials

### Configuration in `.env`

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=your-mailgun-username
MAIL_PASSWORD=your-mailgun-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-verified-domain.com
MAIL_FROM_NAME="${APP_NAME}"
```

---

## Option 5: AWS SES (Production - High Volume)

Amazon SES is cost-effective for high-volume email sending.

### Setup Steps

1. **Sign up** for AWS account
2. **Verify your email/domain** in SES console
3. **Create SMTP credentials**:
   - Go to SES → SMTP Settings
   - Click "Create SMTP Credentials"
   - Download the credentials file

### Configuration in `.env`

```env
MAIL_MAILER=smtp
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_USERNAME=your-aws-smtp-username
MAIL_PASSWORD=your-aws-smtp-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-verified-email@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Note**: Replace `us-east-1` with your AWS region.

---

## Quick Setup for Testing (Recommended: Mailtrap)

For development and testing, **Mailtrap is the easiest option**:

1. Go to <https://mailtrap.io>
2. Sign up (free)
3. Create an inbox
4. Copy the SMTP credentials
5. Paste them into your `.env` file

This way, you can test email verification without sending real emails!

---

## Testing Your Email Configuration

After configuring, test it:

```bash
cd easybuy
php artisan tinker
```

Then in tinker:

```php
Mail::raw('Test email', function ($message) {
    $message->to('test@example.com')
            ->subject('Test Email');
});
```

Or create a test route:

```php
// routes/web.php
Route::get('/test-email', function () {
    Mail::raw('Test email from Laravel', function ($message) {
        $message->to('your-email@example.com')
                ->subject('Test Email');
    });
    return 'Email sent!';
});
```

---

## Troubleshooting

### Gmail Issues

- Make sure you're using an **App Password**, not your regular Gmail password
- 2-Factor Authentication must be enabled
- "Less secure app access" is deprecated - use App Passwords instead

### Common Errors

- **"Connection timeout"**: Check your firewall/network settings
- **"Authentication failed"**: Double-check username and password
- **"Could not authenticate"**: Verify encryption (tls/ssl) matches the port

### For Production

- Always use a dedicated email service (SendGrid, Mailgun, AWS SES)
- Verify your domain to improve deliverability
- Set up SPF and DKIM records for your domain
- Monitor bounce rates and spam complaints

---

## Recommended Setup by Use Case

| Use Case | Recommended Service | Why |
|----------|-------------------|-----|
| **Development/Testing** | Mailtrap | Catches emails, no real sending |
| **Small Project** | SendGrid | Free tier, easy setup |
| **Production (Medium)** | Mailgun | Good deliverability, reasonable pricing |
| **Production (High Volume)** | AWS SES | Very cost-effective for large volumes |
| **Quick Testing** | Gmail | Easy if you already have Gmail |

---

## Security Notes

⚠️ **Never commit your `.env` file to version control!**

- Keep your email passwords/API keys secure
- Use environment variables in production
- Rotate credentials regularly
- Use different credentials for development and production
