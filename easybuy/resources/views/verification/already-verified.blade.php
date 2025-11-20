<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Already Verified - EasyBuy</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .verification-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            text-align: center;
            max-width: 450px;
            width: 100%;
        }
        .info-circle {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
        }
        .info-icon {
            font-size: 60px;
            color: white;
            font-weight: bold;
        }
        h1 {
            color: #1f2937;
            font-weight: 700;
            margin-bottom: 15px;
            font-size: 28px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 35px;
            line-height: 1.6;
        }
        .btn-primary-custom {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            padding: 14px 40px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            color: white;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .btn-primary-custom:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
            color: white;
        }
        .user-info {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
        }
        .user-info p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
        @media (max-width: 576px) {
            .verification-container {
                padding: 30px 20px;
            }
            h1 {
                font-size: 24px;
            }
            .info-circle {
                width: 80px;
                height: 80px;
            }
            .info-icon {
                font-size: 48px;
            }
        }
    </style>
</head>
<body>
    <div class="verification-container">
        <div class="info-circle">
            <span class="info-icon">ℹ</span>
        </div>
        
        <h1>Already Verified</h1>
        <p class="subtitle">Your email address has already been verified. You can continue using the app.</p>
        
        @if(isset($user))
        <div class="user-info">
            <p><strong>{{ $user->username }}</strong> - Your account is active and ready to use!</p>
        </div>
        @endif
        
        <a href="{{ $deepLink }}" class="btn-primary-custom">
            Open EasyBuy App
        </a>
    </div>
    <!-- Bootstrap JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</body>
</html>

