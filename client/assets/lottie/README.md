# Lottie Animations for EasyBuy

## 📥 How to Add Lottie Animations

### Step 1: Download Animations

Visit **LottieFiles.com** or **IconScout.com** and search for:

#### Required Animations

1. **success.json** - Success checkmark (green)
   - Search: "success checkmark green celebration"
   - Recommended ID: `66386`
   - Color: Green (#22C55E)

2. **error.json** - Error cross (red)
   - Search: "error cross red failed"
   - Recommended ID: `38736`
   - Color: Red (#EF4444)

3. **warning.json** - Warning triangle (orange)
   - Search: "warning alert yellow caution"
   - Recommended ID: `52851`
   - Color: Orange (#F59E0B)

4. **info.json** - Info circle (blue)
   - Search: "info notification blue information"
   - Recommended ID: `56001`
   - Color: Blue (#3B82F6)

5. **delivery-bike.json** - Delivery scooter/bike (Onboarding Screen 1)
   - Search: "delivery scooter green fast"
   - Look for: Green colors, modern style
   - Represents: Fast delivery service

6. **friends-socializing.json** - Friends hanging out (Onboarding Screen 2)
   - Search: "friends hanging out social gathering"
   - Look for: Warm colors, friendly style
   - Represents: Chill zone, social vibes

7. **email-verification.json** - Email/OTP verification (Auth Screen)
   - Search: "email verification code otp"
   - Recommended ID: `56001`
   - Color: Blue (#3B82F6)

8. **forgot-password.json** - Forgot password (Auth Screen)
   - Search: "forgot password confused person"
   - Recommended ID: `110052`
   - Color: Orange (#F59E0B)

9. **set-password.json** - Set password (Auth Screen)
   - Search: "password security shield lock"
   - Recommended ID: `98559`
   - Color: Blue (#3B82F6)

10. **password-changed.json** - Password changed success (Auth Screen)
    - Search: "password changed success lock"
    - Recommended ID: `98123`
    - Color: Green (#22C55E)

### Step 2: Download Process

1. Go to <https://lottiefiles.com/>
2. Search for the animation
3. Click on the animation
4. Click "Download" → Select "Lottie JSON"
5. Save with the exact filename (e.g., `success.json`)
6. Place in this directory: `client/assets/lottie/`

### Step 3: Verify Files

After downloading, your directory should look like:

```
client/assets/lottie/
├── success.json
├── error.json
├── warning.json
├── info.json
├── delivery-bike.json
├── friends-socializing.json
├── email-verification.json
├── forgot-password.json
├── set-password.json
└── password-changed.json
```

### Step 4: Test

1. Restart your Expo dev server
2. Test each screen that uses Lottie animations
3. If an animation doesn't load, the app will fallback to Lucide icons

## 🎨 Color Guidelines

- **Success**: Green (#22C55E)
- **Error**: Red (#EF4444)
- **Warning**: Orange (#F59E0B)
- **Info**: Blue (#3B82F6)
- **Delivery**: Green or warm colors
- **Social**: Warm yellows/oranges

## 📱 Animation Requirements

- **Size**: 48-60px for toasts, 280px for onboarding
- **Duration**: Under 2 seconds (preferred)
- **Loop**: `false` for toasts, `true` for onboarding
- **File Size**: Under 50KB per animation
- **Style**: Modern, minimal, smooth

## 🔄 Fallback System

The app includes a fallback system:

- If Lottie file doesn't exist → Uses Lucide icons
- If Lottie fails to load → Uses Lucide icons
- No crashes, seamless experience

## 🚀 Quick Start

1. Download the 10 animations listed above
2. Place them in this directory
3. Restart Expo server
4. Enjoy beautiful animations!

For detailed search terms and recommendations, see `LOTTIE_ICONS_GUIDE.md` in the project root.
