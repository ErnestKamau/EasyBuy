# Development Build Guide

## What is a Development Build?

A **development build** is a special version of your app that includes:
- **Expo Dev Client** - Allows you to load your app code without rebuilding
- **Native modules** - All your native dependencies (like `expo-notifications`, `expo-dev-client`, etc.)
- **Development tools** - Enables hot reloading and debugging

**Why do you need it?**
- Some features (like push notifications) require native code and won't work in Expo Go
- You can test your app with all native modules included
- Faster iteration - you only rebuild when native dependencies change

---

## Two Ways to Create a Development Build

### Option 1: `eas build:dev` (Recommended - Faster) ⚡

This is the **newer, smarter way** to create development builds:

```bash
cd client
eas build:dev --platform android
```

**What it does:**
- ✅ Checks if you already have a compatible development build
- ✅ Reuses existing build if your native dependencies haven't changed
- ✅ Only creates a new build when necessary
- ✅ Automatically installs and runs the build on your device/emulator

**Benefits:**
- **Faster** - Reuses builds when possible (saves 10-20 minutes!)
- **Smarter** - Only rebuilds when needed
- **Convenient** - Automatically installs and runs

### Option 2: `eas build --profile development` (Traditional)

This is the **traditional way**:

```bash
cd client
eas build --profile development --platform android
```

**What it does:**
- Always creates a new build (even if you have a compatible one)
- Uploads to EAS servers
- Gives you a download link

**When to use:**
- When you want to force a fresh build
- When `eas build:dev` isn't working as expected

---

## Step-by-Step: Using `eas build:dev`

### Prerequisites

1. **Make sure you're logged in:**
   ```bash
   eas login
   ```

2. **Have an Android emulator running or device connected:**
   ```bash
   # Check connected devices
   adb devices
   ```

### Building for Android

```bash
cd client
eas build:dev --platform android
```

**What happens:**
1. EAS checks your project's "fingerprint" (native dependencies)
2. If a compatible build exists → Downloads and installs it
3. If no compatible build → Creates a new one (takes 10-20 minutes)
4. Automatically installs on your device/emulator
5. Starts the Expo dev server

### Building for iOS

```bash
cd client
eas build:dev --platform ios
```

**Note:** iOS requires:
- macOS computer
- Xcode installed
- iOS Simulator or physical device

---

## Understanding Build Fingerprints

**What is a fingerprint?**
- A hash of your native dependencies (like `expo-dev-client`, `expo-notifications`, etc.)
- EAS uses this to determine if an existing build is compatible

**When does the fingerprint change?**
- When you add/remove native modules
- When you update Expo SDK version
- When you change native configuration

**When does it stay the same?**
- When you only change JavaScript/TypeScript code
- When you update non-native dependencies

**Example:**
```
Fingerprint changes:
  ❌ Added expo-camera
  ❌ Updated expo SDK from 54 to 55
  ❌ Changed app.json native config

Fingerprint stays same:
  ✅ Changed React components
  ✅ Updated API endpoints
  ✅ Modified TypeScript code
```

---

## Workflow: Development with Builds

### First Time Setup

1. **Create your first development build:**
   ```bash
   cd client
   eas build:dev --platform android
   ```
   ⏱️ Takes 10-20 minutes (first time only)

2. **Wait for build to complete**
   - Build will be installed automatically
   - Expo dev server will start

3. **Start your backend services:**
   ```bash
   cd ..
   ./start-dev.sh
   ```

### Daily Development

1. **Start backend services:**
   ```bash
   ./start-dev.sh
   ```

2. **Run development build:**
   ```bash
   cd client
   eas build:dev --platform android
   ```
   ⚡ Usually instant (reuses existing build)

3. **Make code changes:**
   - Edit your React/TypeScript files
   - Changes hot-reload automatically
   - No rebuild needed!

### When Native Dependencies Change

If you add a new native module (like `expo-camera`):

1. **Install the package:**
   ```bash
   cd client
   npm install expo-camera
   ```

2. **Rebuild (fingerprint changed):**
   ```bash
   eas build:dev --platform android
   ```
   ⏱️ Takes 10-20 minutes (new build needed)

3. **Continue development:**
   - Future runs will reuse this build
   - Until you change native dependencies again

---

## Troubleshooting

### Problem: "No compatible build found"

**Solution:** This is normal for the first build. Just wait for it to complete (10-20 minutes).

### Problem: Build takes too long

**Solution:** 
- First build always takes 10-20 minutes
- Subsequent builds (with same fingerprint) are instant
- Check EAS build status: https://expo.dev/accounts/[your-account]/projects/easybuy-client/builds

### Problem: Build installed but app won't start

**Solution:**
1. Make sure backend services are running: `./start-dev.sh`
2. Check Expo dev server is running
3. Try clearing cache: `eas build:dev --platform android --clear`

### Problem: "Command not found: eas"

**Solution:**
```bash
npm install -g eas-cli
```

### Problem: Changes not reflecting

**Solution:**
- JavaScript/TypeScript changes: Should hot-reload automatically
- Native dependency changes: Need to rebuild
- Check if Metro bundler is running

### Problem: Can't connect to backend

**Solution:**
1. Make sure Laravel server is running (port 8000)
2. Check your `EXPO_PUBLIC_API_URL` in `.env` or `app.json`
3. For physical device: Use your computer's IP address, not `localhost`

---

## Comparison: Development Build vs Expo Go

| Feature | Development Build | Expo Go |
|---------|------------------|---------|
| Push Notifications | ✅ Works | ❌ Limited |
| Custom Native Modules | ✅ Full Support | ❌ Not Supported |
| WebSocket | ✅ Works | ✅ Works |
| Hot Reloading | ✅ Yes | ✅ Yes |
| Build Time | 10-20 min (first) | Instant |
| Native Code Changes | Requires Rebuild | N/A |

---

## Best Practices

### 1. Use `eas build:dev` for Daily Development
- Faster and smarter than `eas build --profile development`
- Automatically reuses compatible builds

### 2. Only Rebuild When Necessary
- Don't rebuild for JavaScript changes
- Only rebuild when native dependencies change

### 3. Keep Backend Services Running
- Use `./start-dev.sh` to start all services
- Keep it running while developing

### 4. Monitor Build Status
- Check EAS dashboard for build progress
- First build takes longest, be patient

### 5. Use Preview Builds for Testing
- Create preview builds for testers: `eas build --profile preview`
- Production builds for app stores: `eas build --profile production`

---

## Quick Reference

```bash
# Create/run development build (smart, recommended)
eas build:dev --platform android

# Create development build (traditional, always new)
eas build --profile development --platform android

# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Clear cache and rebuild
eas build:dev --platform android --clear
```

---

## Summary

**For daily development:**
1. Run `./start-dev.sh` (starts backend)
2. Run `eas build:dev --platform android` (starts app)
3. Make code changes (hot-reloads automatically)
4. Only rebuild when adding native modules

**Key takeaway:**
- `eas build:dev` is smarter and faster
- It reuses builds when possible
- Only rebuilds when native dependencies change
- Perfect for daily development workflow!
