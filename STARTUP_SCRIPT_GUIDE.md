# EasyBuy Development Server Startup Script Guide

## 📖 Table of Contents
1. [What is this script?](#what-is-this-script)
2. [What does it do?](#what-does-it-do)
3. [How to use it](#how-to-use-it)
4. [Understanding the script (for beginners)](#understanding-the-script-for-beginners)
5. [Troubleshooting](#troubleshooting)
6. [What each service does](#what-each-service-does)

---

## What is this script?

The `start-dev.sh` script is a **bash script** (a file containing commands that your computer can run automatically). Think of it as a recipe that tells your computer to start multiple programs in the right order.

**Why do we need it?**
- Instead of opening 4 different terminal windows and typing commands in each one, this script does it all automatically!
- It ensures everything starts in the correct order
- It handles errors and cleanup if something goes wrong

---

## What does it do?

The script starts **4 important services** needed for your EasyBuy app to work:

1. **Laravel Server** (Port 8000) - Your backend API server
2. **Queue Worker** - Processes background jobs (like sending emails)
3. **Laravel Echo Server** (Port 6001) - Handles real-time WebSocket connections
4. **Expo Dev Server** (Port 8081) - Serves your React Native app

---

## How to use it

### Step 1: Make sure the script is executable
```bash
chmod +x start-dev.sh
```
*(This only needs to be done once - it gives permission to run the script)*

### Step 2: Run the script
```bash
./start-dev.sh
```

### Step 3: Wait for all services to start
You'll see colored messages showing the progress:
- 🟢 Green = Success
- 🟡 Yellow = Warning or in progress
- 🔴 Red = Error
- 🔵 Blue = Information

### Step 4: Stop all services
Press `Ctrl+C` in the terminal. The script will automatically stop all services.

---

## Understanding the script (for beginners)

Let's break down the script into simple parts:

### Part 1: Setup and Colors
```bash
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'
```
**What this does:** Defines colors for text output. This makes the terminal messages easier to read.

### Part 2: Finding Directories
```bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
EASYBUI_DIR="$SCRIPT_DIR/easybuy"
CLIENT_DIR="$SCRIPT_DIR/client"
```
**What this does:** 
- Finds where the script is located
- Sets paths to your Laravel backend (`easybuy`) and React Native client (`client`) folders
- This ensures the script works no matter where you run it from

### Part 3: Helper Functions

#### `print_message()`
```bash
print_message() {
    echo -e "${2}${1}${NC}"
}
```
**What this does:** A function to print colored messages. Instead of writing `echo -e "${GREEN}Success${NC}"` every time, we can just write `print_message "Success" "$GREEN"`.

#### `command_exists()`
```bash
command_exists() {
    command -v "$1" >/dev/null 2>&1
}
```
**What this does:** Checks if a program (like `php` or `node`) is installed on your computer.

#### `port_in_use()`
```bash
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}
```
**What this does:** Checks if a port (like 8000 or 6001) is already being used by another program. This prevents conflicts.

#### `wait_for_service()`
```bash
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if port_in_use $port; then
            print_message "$service_name is ready!" "$GREEN"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
}
```
**What this does:** 
- Waits for a service to start by checking if its port is in use
- Tries up to 30 times (30 seconds)
- If the port becomes active, the service is ready!

#### `kill_port()`
```bash
kill_port() {
    local port=$1
    if port_in_use $port; then
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
}
```
**What this does:** 
- Finds any program using a specific port
- Kills that program (frees up the port)
- This ensures we can start our services without conflicts

#### `cleanup()`
```bash
cleanup() {
    # Kill background processes
    if [ ! -z "$LARAVEL_PID" ]; then
        kill $LARAVEL_PID 2>/dev/null || true
    fi
    # ... more cleanup code
}
```
**What this does:** 
- Runs when you press Ctrl+C or the script exits
- Stops all services that were started
- Cleans up ports
- This prevents "zombie" processes running in the background

### Part 4: Main Execution

#### 1. Check Required Tools
```bash
if ! command_exists php; then
    print_message "ERROR: PHP is not installed!" "$RED"
    exit 1
fi
```
**What this does:** Before starting anything, checks if PHP, Node.js, and npm are installed. If not, stops the script with an error message.

#### 2. Check Directories
```bash
if [ ! -d "$EASYBUI_DIR" ]; then
    print_message "ERROR: Laravel directory not found" "$RED"
    exit 1
fi
```
**What this does:** Makes sure the `easybuy` and `client` folders exist before trying to use them.

#### 3. Kill Existing Processes
```bash
kill_port 8000  # Laravel
kill_port 6001  # Echo Server
kill_port 8081  # Expo Metro
```
**What this does:** If you ran the script before and didn't stop it properly, this kills any old processes still running on those ports.

#### 4. Start Laravel Server
```bash
cd "$EASYBUI_DIR"
php artisan serve > /tmp/laravel.log 2>&1 &
LARAVEL_PID=$!
```
**What this does:**
- `cd "$EASYBUI_DIR"` - Goes to the Laravel folder
- `php artisan serve` - Starts the Laravel server
- `> /tmp/laravel.log 2>&1` - Saves all output to a log file
- `&` - Runs in the background (doesn't block the script)
- `LARAVEL_PID=$!` - Saves the process ID so we can kill it later

#### 5. Start Queue Worker
```bash
cd "$EASYBUI_DIR"
php artisan queue:work > /tmp/queue.log 2>&1 &
QUEUE_PID=$!
```
**What this does:** Same pattern - starts the queue worker in the background and saves its process ID.

#### 6. Start Echo Server
```bash
cd "$EASYBUI_DIR"
$ECHO_CMD start > /tmp/echo-server.log 2>&1 &
ECHO_PID=$!
```
**What this does:** Starts the Laravel Echo Server for WebSocket connections.

#### 7. Start Expo Dev Server
```bash
cd "$CLIENT_DIR"
npm start > /tmp/expo.log 2>&1 &
EXPO_PID=$!
```
**What this does:** Starts the Expo development server for your React Native app.

#### 8. Wait for User
```bash
wait
```
**What this does:** Keeps the script running until you press Ctrl+C. This prevents the script from exiting immediately after starting the services.

---

## What each service does

### 1. Laravel Server (Port 8000)
- **What it is:** Your backend API server
- **What it does:** Handles all API requests from your mobile app (login, products, orders, etc.)
- **Why you need it:** Without this, your app can't communicate with the database or perform any backend operations

### 2. Queue Worker
- **What it is:** A background job processor
- **What it does:** Processes tasks that take time (sending emails, generating PDFs, etc.)
- **Why you need it:** Prevents your API from being slow while sending emails or doing heavy tasks

### 3. Laravel Echo Server (Port 6001)
- **What it is:** A WebSocket server
- **What it does:** Enables real-time communication between your app and server
- **Why you need it:** Allows instant notifications without polling (checking repeatedly)

### 4. Expo Dev Server (Port 8081)
- **What it is:** Metro bundler for React Native
- **What it does:** Serves your React Native app code to your phone/emulator
- **Why you need it:** Without this, you can't run your mobile app

---

## Troubleshooting

### Problem: "Port 8000 is already in use"
**Solution:** The script should automatically kill processes on ports, but if it doesn't:
```bash
lsof -ti:8000 | xargs kill -9
```

### Problem: "Laravel Echo Server not found"
**Solution:** Install it globally:
```bash
npm install -g laravel-echo-server
```

### Problem: Services start but then stop immediately
**Solution:** Check the log files:
```bash
cat /tmp/laravel.log
cat /tmp/queue.log
cat /tmp/echo-server.log
cat /tmp/expo.log
```

### Problem: "Permission denied" when running script
**Solution:** Make sure the script is executable:
```bash
chmod +x start-dev.sh
```

### Problem: Queue worker not processing jobs
**Solution:** Make sure Redis is running:
```bash
sudo systemctl start redis-server
# or
redis-server
```

### Problem: Can't connect to services from mobile device
**Solution:** 
- Make sure your phone and computer are on the same WiFi network
- Use your computer's IP address instead of `localhost` in the app
- Check firewall settings (ports 8000, 6001, 8081 should be open)

---

## Advanced: Customizing the Script

### Change log file locations
Find lines like:
```bash
php artisan serve > /tmp/laravel.log 2>&1 &
```
Change `/tmp/laravel.log` to wherever you want logs saved.

### Add more services
To add another service, follow this pattern:
```bash
print_message "Starting New Service..." "$BLUE"
cd "$SOME_DIR"
some-command > /tmp/new-service.log 2>&1 &
NEW_SERVICE_PID=$!
wait_for_service 9000 "New Service"
```

### Run services in foreground (see logs)
Remove the `&` at the end of commands and remove the `wait` at the end. This will show logs directly in the terminal.

---

## Related: Development Builds

If you're using Expo Dev Client (development builds), you'll also need to build your app:

**Quick way (recommended):**
```bash
cd client
eas build:dev --platform android
```

This command:
- Checks if you have a compatible build
- Reuses existing builds when possible (faster!)
- Only creates new builds when native dependencies change

**See `DEVELOPMENT_BUILD_GUIDE.md` for complete details on development builds.**

---

## Summary

This script is like a **conductor** for an orchestra:
- It makes sure all services start in the right order
- It checks that everything is ready before moving on
- It handles cleanup when you're done
- It gives you clear feedback about what's happening

**Key concepts:**
- **Background processes (`&`)**: Services run in the background so the script can continue
- **Process IDs (PIDs)**: We save these so we can stop services later
- **Ports**: Each service uses a different port (8000, 6001, 8081)
- **Log files**: All output is saved so you can debug issues

**Remember:** Always press `Ctrl+C` to stop the script properly. This ensures all services are cleaned up correctly!
