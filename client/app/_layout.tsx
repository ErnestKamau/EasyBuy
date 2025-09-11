// app/_layout.tsx
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { isAuthenticated } from '@/services/api';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Authentication Provider Component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check authentication status on app load
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Handle navigation based on auth status
    if (!authChecked) return; // Still loading

    const inAuthGroup = segments[0] === 'auth';

    if (!loggedIn && !inAuthGroup) {
      // User is not logged in and trying to access protected routes
      router.replace('/auth');
    } else if (loggedIn && inAuthGroup) {
      // User is logged in but still on auth screen
      router.replace('/(tabs)');
    }
  }, [loggedIn, authChecked, segments]);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await isAuthenticated();
      setLoggedIn(authenticated);
    } catch (error) {
      console.log('Auth check failed:', error);
      setLoggedIn(false);
    } finally {
      setAuthChecked(true);
    }
  };

  // Show loading screen while checking auth
  if (!authChecked) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Auth screens - no header */}
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            // Prevent going back to auth screen after login
            gestureEnabled: false
          }}
        />

        {/* Main app tabs - no header (tabs have their own) */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false
          }}
        />

        {/* Other screens */}
        <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
            presentation: 'card'
          }}
        />

        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal'
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
