<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Code - EasyBuy</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1e3a5f;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .code-container {
            background-color: #f8f9fa;
            border: 2px dashed #1e3a5f;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #1e3a5f;
            font-family: 'Courier New', monospace;
        }
        .message {
            color: #666;
            font-size: 16px;
            margin-bottom: 20px;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-text {
            color: #856404;
            font-size: 14px;
            margin: 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 12px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1e3a5f;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">EasyBuy</div>
        </div>
        
        <h1 class="title">Password Reset Code</h1>
        
        <div class="content">
            <p class="message">Hello {{ $userName }},</p>
            <p class="message">We received a request to reset your password. Please use the verification code below to reset your password:</p>
            
            <div class="code-container">
                <div class="code">{{ $code }}</div>
            </div>
            
            <p class="message">Enter this code in the app to reset your password. This code will expire in 10 minutes.</p>
            
            <div class="warning">
                <p class="warning-text">
                    <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email and your password will remain unchanged. Never share this code with anyone.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated message from EasyBuy. Please do not reply to this email.</p>
            <p>&copy; {{ date('Y') }} EasyBuy. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

