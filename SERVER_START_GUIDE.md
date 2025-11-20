# Laravel Server Start Guide

This guide explains how to start the Laravel server for different development scenarios.

## Your Current Network IP
**Your machine's IP address:** `192.168.100.101`

---

## Scenario 1: Development with Android Emulator

### Starting the Server

The Android emulator uses a special IP address to access your host machine's localhost.

```bash
cd /home/ernest/development/builds/EasyBuy/easybuy
php artisan serve --host=0.0.0.0 --port=8000
```

### Frontend Configuration (`client/.env`)

For Android emulator, use `10.0.2.2` (this is the emulator's special IP for host machine):

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
```

**Note:** `10.0.2.2` is a special IP that the Android emulator uses to access your host machine's `localhost`.

---

## Scenario 2: Development with Actual Android Phone (Expo Go)

### Starting the Server

Use your machine's network IP address so your phone can access it over the local network:

```bash
cd /home/ernest/development/builds/EasyBuy/easybuy
php artisan serve --host=0.0.0.0 --port=8000
```

### Frontend Configuration (`client/.env`)

For real Android device, use your machine's actual network IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.100.101:8000/api
```

**Important:** 
- Your phone and computer must be on the **same Wi-Fi network**
- Make sure your firewall allows connections on port 8000
- If your IP changes, update the `.env` file

---

## Quick Reference

### Find Your Network IP (if it changes)

```bash
hostname -I | awk '{print $1}'
```

### Start Server (works for both scenarios)

```bash
cd easybuy
php artisan serve --host=0.0.0.0 --port=8000
```

### Stop Server

```bash
pkill -f "php artisan serve"
```

---

## Troubleshooting

### Android Emulator Can't Connect

1. **Check if server is running:**
   ```bash
   curl http://10.0.2.2:8000/api/user
   ```

2. **Verify CORS is configured** in `easybuy/bootstrap/app.php` to allow the Expo dev server origin

3. **Check Expo dev server** is running and accessible

### Real Phone Can't Connect

1. **Verify same Wi-Fi network:**
   - Phone and computer must be on the same network
   - Check phone's Wi-Fi settings

2. **Check firewall:**
   ```bash
   # Allow port 8000 (Ubuntu/Debian)
   sudo ufw allow 8000
   ```

3. **Test from phone's browser:**
   - Open `http://192.168.100.101:8000` in phone's browser
   - Should see Laravel welcome page

4. **Verify IP address:**
   ```bash
   hostname -I | awk '{print $1}'
   ```
   Update `.env` if IP changed

5. **Check server is accessible:**
   ```bash
   # From another device on same network
   curl http://192.168.100.101:8000/api/user
   ```

### Port Already in Use

```bash
# Kill existing server
pkill -f "php artisan serve"

# Or use a different port
php artisan serve --host=0.0.0.0 --port=8001
```

Then update `.env` to use port 8001.

---

## Switching Between Scenarios

When switching between emulator and real device:

1. **Stop Expo dev server** (Ctrl+C)
2. **Update `client/.env`** with the correct API URL:
   - Emulator: `http://10.0.2.2:8000/api`
   - Real device: `http://192.168.100.101:8000/api`
3. **Restart Expo dev server:**
   ```bash
   cd client
   npx expo start
   ```

**Note:** Laravel server (`php artisan serve`) doesn't need to be restarted - it works for both scenarios as long as it's bound to `0.0.0.0`.

---

## Recommended Workflow

### For Android Emulator:
```bash
# Terminal 1: Start Laravel server
cd easybuy
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2: Start Expo (with emulator API URL in .env)
cd client
npx expo start
```

### For Real Android Device:
```bash
# Terminal 1: Start Laravel server
cd easybuy
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2: Start Expo (with network IP in .env)
cd client
npx expo start
# Scan QR code with Expo Go app
```

---

## Summary

| Scenario | Server Command | Frontend `.env` |
|----------|---------------|----------------|
| **Android Emulator** | `php artisan serve --host=0.0.0.0 --port=8000` | `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api` |
| **Real Android Phone** | `php artisan serve --host=0.0.0.0 --port=8000` | `EXPO_PUBLIC_API_URL=http://192.168.100.101:8000/api` |

**The server command is the same for both!** Only the frontend `.env` changes.

