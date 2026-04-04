# EasyBuy – Smart Logistics & Unified Shopping

**Smart shopping, simplified.**

EasyBuy is an ultra-modern e-commerce and logistics platform designed for speed, reliability, and real-time visibility. Originally a robust shop management system, it now features a state-of-the-art **Delivery Tracking Engine** built on Laravel Reverb and Redis, providing sub-3-second location updates for a seamless "Uber Eats" style experience.

---

## Tech Stack

### Backend (Logistics & API)

| Layer                | Technology          | Version | Purpose                                                     |
| -------------------- | ------------------- | ------- | ----------------------------------------------------------- |
| **Framework**        | Laravel             | 12.x    | Main API, Business Logic, and Admin Panel                   |
| **Real-time Server** | Laravel Echo Server | 1.x     | Node.js based WebSocket server for live location broadcasts |
| **Cache / Queue**    | Redis               | 7.x     | High-speed location caching & async job processing          |
| **Database**         | MySQL               | 8+      | Relational data and geospatial storage for route history    |
| **Monitoring**       | Laravel Horizon     | 5.x     | Real-time queue dashboard for background operations         |
| **Auth & ACL**       | Spatie Permission   | 6.x     | RBAC (Customer, Rider, Merchant, Admin)                     |

---

## 📦 Key Laravel Packages

To power the delivery engine, we leverage several industry-standard Laravel packages. Here is why they are essential:

### 1. **laravel-echo-server** (WebSocket Server)

**Purpose**: A Node.js server that broadcasts events over WebSockets.

- It runs alongside Laravel, connecting to Redis to listen for events published by your API.
- **Why it matters**: It enables real-time bidirectional communication between the server and the app, allowing us to "push" location updates to customers seamlessly.

### 2. **predis/predis** (Redis Client)

**Purpose**: A flexible and feature-complete Redis client for PHP.

- **Why it matters**: It is the "glue" that connects Laravel to the Redis server. We use it for ultra-fast caching of current rider locations and as the primary transport for our WebSocket events and background queues.

### 3. **laravel/horizon** (Queue Monitoring)

**Purpose**: A beautiful dashboard and code-driven configuration for your Redis-powered queues.

- **Why it matters**: Horizon allows us to monitor our background jobs (like saving location history to PostGIS or sending push notifications) in real-time. If a job fails, Horizon makes it easy to see exactly why and retry it.

### 4. **spatie/laravel-permission** (Roles & Permissions)

**Purpose**: Managing user roles and permissions in a database.

- **Why it matters**: It handles the logic for our different user types: `customer`, `rider`, and `admin`. It ensures that only authorized riders can update locations and only admins can assign orders.

### 5. **laravel-notification-channels/fcm** (Firebase Push Notifications)

**Purpose**: Integrating Firebase Cloud Messaging (FCM) into Laravel's notification system.

- **Why it matters**: This is how we notify the React Native app when a new order is assigned or a delivery status changes. It works even when the app is closed or in the background.

---

### Frontend (User Experience)

- **Mobile**: React Native (Expo) — Shared app for Customers and Drivers (Dynamic Mode).
- **Styling**: Tailwind CSS & React Native Paper.
- **Maps**: React Native Maps + Google Directions/Distance Matrix API.

---

## Core Features

### 🚀 Real-time Delivery Tracking

powered by **Laravel Echo Server**, the platform provides real-time movement updates of riders.

- **Driver Mode**: Background GPS tracking every 3 seconds while on active delivery.
- **Customer Map**: Smooth, real-time pin movement and live ETA updates.

### 📦 Unified Order Management

- **Manual Dispatch**: Admins assign orders to available riders via a central dashboard.
- **Dual Fulfillment**: Support for both **Shop Pickup** (QR verified) and **Home Delivery**.
- **Hybrid Payments**: Integrated M-Pesa (Daraja API) and Card payments.

### 🌐 Multi-Mode App Interface

The React Native app dynamically switches interfaces based on user roles:

- **Customer**: Browse products, track orders, manage profile.
- **Rider**: "Go Online" toggle, delivery dashboard, turn-by-turn navigation data.

---

## Technical Deep Dive: The Real-time Engine

### Architecture Diagram

```mermaid
graph TD
    A[Driver App] -->|POST GPS 3s| B[Laravel API]
    B -->|Update| C[Redis Cache]
    B -->|Broadcast| D[Laravel Reverb]
    B -->|Queue Job| E[PostGIS Log]
    D -->|Websocket| F[Customer App]
    D -->|Websocket| G[Admin Dashboard]
    C -->|Fetch Current| F
    E -->|History| G
```

### Laravel Echo Server & Redis Sub-system

Real-time tracking uses a two-channel approach for maximum efficiency:

1. **The Pulse**: The Driver app POSTs GPS coordinates to a Laravel endpoint.
2. **The Cache**: Laravel immediately updates a Redis key `driver:{id}:location` for super-fast O(1) lookups.
3. **The Broadcast**: Simultaneously, a `DriverLocationUpdated` event is broadcast to Redis, which **Laravel Echo Server** picks up and pushes to the React Native app.
4. **The Log (Async)**: Heavy writing to the database is **offloaded to Redis**. This means the API doesn't wait for the slow database write; instead, it pushes a "job" into a Redis queue. A background worker (Horizon) picks this up a few milliseconds later to save it to MySQL. This keeps the driver's app super snappy.

---

## 🌍 Google Maps & Location Setup

To enable tracking and routing, the React Native app needs a Google Cloud Project with Billing Enabled.

### 1. Enable Required APIs (Google Cloud Console)

1. **Directions API**: Calculates turn-by-turn routes for the rider.
2. **Distance Matrix API**: Calculates dynamic ETAs based on traffic.
3. **Maps SDK for Android**: Renders the map natively on Android devices.
4. **Maps SDK for iOS**: Renders the map natively on iOS devices.

### 2. Generate and Secure API Keys

1. Navigate to **APIs & Services > Credentials** in Google Cloud.
2. Create an **API Key**.
3. **Important**: Restrict the key's usage purely to iOS/Android Apps using your `app.json` package name (`com.easybuy.app`) and SHA-1 certificate fingerprints to prevent quota theft.

### 3. Configure React Native

In `client/app.json`, confirm the Location permissions are present:

```json
"android": {
  "permissions": [
    "ACCESS_COARSE_LOCATION",
    "ACCESS_FINE_LOCATION"
  ],
  "config": {
    "googleMaps": {
      "apiKey": "AIzaSyYourRestrictedMapKeyHere..."
    }
  }
}
```

---

## 🔐 Google Social Authentication Setup

EasyBuy allows users to log in securely with Google.

### 1. Create OAuth Credentials

1. In Google Cloud Console, navigate to **APIs & Services > Credentials**.
2. Create **OAuth Client IDs**. You will need two types:
   - A **Web Application Client ID**. (Used by Laravel for backend token verification).
   - An **Android Client ID**. (Used by Expo to trigger the native login modal).

### 2. Connect the React Native App

Update the Expo environment variables in `client/.env` using the generated IDs:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="1084441530775-9o3gpciehs0afp7ruj5emukedt6plgb0.apps.googleusercontent.com"
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID="1084441530775-nh7rsr5j2ouv0utp56kge90962rotnnc.apps.googleusercontent.com"
```

### 3. Connect the Laravel Backend

Ensure the Web Client ID matches the backend so Laravel can verify incoming tokens. In `easybuy/.env`:

```env
GOOGLE_CLIENT_ID=1084441530775-9o3gpciehs0afp7ruj5emukedt6plgb0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_backend_secret_here
```

### 4. Server-Side Configuration (For Production)

When you deploy your backend to Ubuntu, you **must populate the `.env` file** on your server with the API keys and Client IDs so it matches your local environment.

Add the following to your production `/var/www/easybuy/.env`:

#### A. Google Auth Configuration

Laravel needs the Client ID and Secret to verify tokens sent by the mobile app:

```env
GOOGLE_CLIENT_ID=1084441530775-9o3gpciehs0afp7ruj5emukedt6plgb0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_production_backend_secret
```

#### B. Echo Server Configuration

Ensure your `laravel-echo-server.json` file on the server has the correct `authHost` pointing to your domain:

```json
{
  "authHost": "https://api.easybuy.com",
  "database": "redis",
  "databaseConfig": {
    "redis": {
      "port": "6379",
      "host": "127.0.0.1",
      "password": "your_redis_password"
    }
  }
}
```

---

### `online_status` Lifecycle

Rider availability is handled via a persistent heartbeat:

- When a rider toggles "Online", the app sends a ping every 30s.
- The server stores the `last_seen_at` in Redis.
- A scheduled task or a Redis TTL scan automatically moves inactive riders to "Offline" status after 2 minutes of silence.

---

## 🛠️ Developer & Production Setup

### 1. Local Development (Standard)

```bash
# Terminal 1: Laravel Server
php artisan serve

# Terminal 2: Real-time & Queues
php artisan reverb:start
php artisan horizon

# Terminal 3: Frontend Assets
npm run dev
```

### 2. Connect React Native to Laravel API

By default, Expo uses `localhost`, but your phone or emulator cannot reach `localhost` because it has its own isolated network.

- **Local Network**: Connect both your phone and PC to the same Wi-Fi. Find your PC's IPv4 address (e.g., `192.168.1.50`).
- **Start Laravel**: Bind the server to your IP using `php artisan serve --host=0.0.0.0 --port=8000`.
- **Configure Expo**: In `client/.env`, set `EXPO_PUBLIC_API_URL=http://<YOUR_PC_IP>:8000/api`.

> [!WARNING]
> Android and iOS strictly enforce HTTPS for external traffic in Production. If you deploy your API, you **MUST** configure an SSL Certificate (e.g., Let's Encrypt), otherwise the mobile app will throw "Network Request Failed" errors.

---

### 3. Production Deployment (Ubuntu 24.04 VPS)

For a real-world launch, deploy your Laravel backend to a VPS (e.g., DigitalOcean Droplet, AWS EC2, or Linode).

#### A. Install the LEMP Stack

Secure your server and install the core dependencies:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx redis-server mysql-server php8.3-fpm php8.3-cli php8.3-mysql php8.3-redis supervisor unzip git curl npm -y
sudo npm install -g laravel-echo-server
```

#### B. Nginx Reverse Proxy (Critical for APIs)

Configure Nginx to handle both the API and the Echo Server WebSocket.

Create `/etc/nginx/sites-available/api.easybuy.com`:

```nginx
server {
    listen 80;
    server_name api.easybuy.com;
    root /var/www/easybuy/public;
    index index.php;

    # 1. Route standard API traffic to PHP-FPM
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }

    # 2. Route WebSocket traffic directly to Laravel Echo Server
    location /socket.io {
        proxy_pass http://127.0.0.1:6001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

_Run `sudo ln -s /etc/nginx/sites-available/api.easybuy.com /etc/nginx/sites-enabled/` and `sudo systemctl restart nginx`._

#### C. Secure with SSL (Let's Encrypt)

React Native requires HTTPS in production.

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.easybuy.com
```

#### D. Keep Background Services Alive (Supervisor)

If your server reboots, your queue workers and WebSocket server must start automatically. Supervisor handles this.

Create `/etc/supervisor/conf.d/easybuy.conf`:

```ini
[program:easybuy-horizon]
process_name=%(program_name)s
command=php /var/www/easybuy/artisan horizon
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/easybuy/storage/logs/horizon.log

[program:easybuy-echo]
process_name=%(program_name)s
command=laravel-echo-server start
directory=/var/www/easybuy
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/easybuy/storage/logs/echo.log
```

_Run `sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl start all`._

---

© 2026 EasyBuy Engineering Team. Built for scale and performance.
