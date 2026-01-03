#!/bin/bash

# EasyBuy Development Server Startup Script
# This script starts all required services for development

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
EASYBUI_DIR="$SCRIPT_DIR/easybuy"
CLIENT_DIR="$SCRIPT_DIR/client"

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    print_message "Waiting for $service_name to start on port $port..." "$YELLOW"
    
    while [ $attempt -lt $max_attempts ]; do
        if port_in_use $port; then
            print_message "$service_name is ready!" "$GREEN"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_message "$service_name failed to start on port $port" "$RED"
    return 1
}

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    if port_in_use $port; then
        print_message "Killing process on port $port..." "$YELLOW"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Function to cleanup on exit
cleanup() {
    print_message "\n\nShutting down services..." "$YELLOW"
    
    # Kill background processes
    if [ ! -z "$LARAVEL_PID" ]; then
        kill $LARAVEL_PID 2>/dev/null || true
    fi
    if [ ! -z "$QUEUE_PID" ]; then
        kill $QUEUE_PID 2>/dev/null || true
    fi
    if [ ! -z "$ECHO_PID" ]; then
        kill $ECHO_PID 2>/dev/null || true
    fi
    if [ ! -z "$EXPO_PID" ]; then
        kill $EXPO_PID 2>/dev/null || true
    fi
    
    # Kill by port
    kill_port 8000  # Laravel
    kill_port 6001  # Echo Server
    kill_port 8081  # Expo Metro
    
    print_message "All services stopped." "$GREEN"
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Print header
print_message "=========================================" "$BLUE"
print_message "  EasyBuy Development Server Startup" "$BLUE"
print_message "=========================================" "$BLUE"
echo ""

# Check required commands
print_message "Checking required tools..." "$YELLOW"

if ! command_exists php; then
    print_message "ERROR: PHP is not installed!" "$RED"
    exit 1
fi

if ! command_exists node; then
    print_message "ERROR: Node.js is not installed!" "$RED"
    exit 1
fi

if ! command_exists npm; then
    print_message "ERROR: npm is not installed!" "$RED"
    exit 1
fi

if ! command_exists laravel-echo-server; then
    print_message "WARNING: laravel-echo-server not found globally. Trying npx..." "$YELLOW"
    ECHO_CMD="npx laravel-echo-server"
else
    ECHO_CMD="laravel-echo-server"
fi

print_message "All required tools are available!" "$GREEN"
echo ""

# Check if directories exist
if [ ! -d "$EASYBUI_DIR" ]; then
    print_message "ERROR: Laravel directory not found at $EASYBUI_DIR" "$RED"
    exit 1
fi

if [ ! -d "$CLIENT_DIR" ]; then
    print_message "ERROR: Client directory not found at $CLIENT_DIR" "$RED"
    exit 1
fi

# Check and kill existing processes on required ports
print_message "Checking for existing processes..." "$YELLOW"
kill_port 8000  # Laravel
kill_port 6001  # Echo Server
kill_port 8081  # Expo Metro
echo ""

# Start Laravel Server
print_message "Starting Laravel server on port 8000..." "$BLUE"
cd "$EASYBUI_DIR"
php artisan serve > /tmp/laravel.log 2>&1 &
LARAVEL_PID=$!
sleep 2

if wait_for_service 8000 "Laravel server"; then
    print_message "✓ Laravel server started (PID: $LARAVEL_PID)" "$GREEN"
else
    print_message "✗ Failed to start Laravel server" "$RED"
    exit 1
fi
echo ""

# Start Queue Worker
print_message "Starting Laravel queue worker..." "$BLUE"
cd "$EASYBUI_DIR"
php artisan queue:work > /tmp/queue.log 2>&1 &
QUEUE_PID=$!
sleep 1
print_message "✓ Queue worker started (PID: $QUEUE_PID)" "$GREEN"
echo ""

# Start Laravel Echo Server
print_message "Starting Laravel Echo Server on port 6001..." "$BLUE"
cd "$EASYBUI_DIR"
$ECHO_CMD start > /tmp/echo-server.log 2>&1 &
ECHO_PID=$!
sleep 2

if wait_for_service 6001 "Echo Server"; then
    print_message "✓ Laravel Echo Server started (PID: $ECHO_PID)" "$GREEN"
else
    print_message "✗ Failed to start Echo Server" "$RED"
    print_message "  Check /tmp/echo-server.log for details" "$YELLOW"
fi
echo ""

# Start Expo Dev Server
print_message "Starting Expo dev server..." "$BLUE"
cd "$CLIENT_DIR"
npm start > /tmp/expo.log 2>&1 &
EXPO_PID=$!
sleep 3

if wait_for_service 8081 "Expo Metro bundler"; then
    print_message "✓ Expo dev server started (PID: $EXPO_PID)" "$GREEN"
else
    print_message "  Expo may still be starting. Check the output below." "$YELLOW"
fi
echo ""

# Print summary
print_message "=========================================" "$GREEN"
print_message "  All services are running!" "$GREEN"
print_message "=========================================" "$GREEN"
echo ""
print_message "Services:" "$BLUE"
print_message "  • Laravel API:      http://localhost:8000" "$GREEN"
print_message "  • Echo Server:      http://localhost:6001" "$GREEN"
print_message "  • Expo Metro:       http://localhost:8081" "$GREEN"
print_message "  • Queue Worker:     Running (PID: $QUEUE_PID)" "$GREEN"
echo ""
print_message "Log files:" "$BLUE"
print_message "  • Laravel:          /tmp/laravel.log" "$YELLOW"
print_message "  • Queue Worker:    /tmp/queue.log" "$YELLOW"
print_message "  • Echo Server:     /tmp/echo-server.log" "$YELLOW"
print_message "  • Expo:             /tmp/expo.log" "$YELLOW"
echo ""
print_message "Press Ctrl+C to stop all services" "$YELLOW"
echo ""

# Tail the logs (optional - comment out if you don't want to see logs)
# Uncomment the lines below if you want to see live logs
# tail -f /tmp/laravel.log /tmp/queue.log /tmp/echo-server.log /tmp/expo.log

# Wait for user interrupt
wait
