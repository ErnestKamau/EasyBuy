#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting EasyBuy Development Environment...${NC}"

# Kill existing servers
echo -e "${BLUE}Stopping existing servers...${NC}"
pkill -f "manage.py runserver" || true
pkill -f "expo start" || true

# Wait a moment for processes to stop
sleep 2

# Start Django backend
echo -e "${GREEN}Starting Django backend server...${NC}"
cd ../server
source ../.venv/bin/activate
python manage.py runserver 0.0.0.0:8000 > /dev/null 2>&1 &
DJANGO_PID=$!

# Wait for Django to start
echo -e "${BLUE}Waiting for Django server to start...${NC}"
sleep 3

# Test Django server
if curl -f http://127.0.0.1:8000/admin/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Django server is running on http://192.168.100.72:8000${NC}"
else
    echo -e "${RED}✗ Django server failed to start${NC}"
    kill $DJANGO_PID 2>/dev/null || true
    exit 1
fi

# Return to client directory
cd ../client

# Start Expo development server (Android only)
echo -e "${GREEN}Starting Expo development server...${NC}"
npx expo start --android --clear

echo -e "${BLUE}Development environment stopped${NC}"
