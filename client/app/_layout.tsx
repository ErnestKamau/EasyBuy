// app/_layout.tsx - Fixed with complete navigation theme
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import {
  useEffect,
} from "react";
import { View, Alert } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { useColorScheme } from "@/components/useColorScheme";
import { toastConfig } from "@/components/ToastConfig";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { CartProvider } from "@/contexts/CartContext";
import {
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export { ErrorBoundary } from "expo-router";

// Set initial route to onboarding - will be redirected if authenticated
export const unstable_settings = {
  initialRouteName: "onboarding",
};

SplashScreen.preventAutoHideAsync();

import { AuthProvider, useAuth } from "@/contexts/AuthContext";


export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
    // Inter fonts
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Space Grotesk fonts
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    // Manrope fonts
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <CustomThemeProvider>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <RootLayoutNav />
            <Toast config={toastConfig} />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

// Safe Area Wrapper Component
function SafeAreaWrapper({ children }: { readonly children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top - 50,
        paddingBottom: insets.bottom - 40,
      }}
    >
      {children}
    </View>
  );
}

function RootLayoutNav() {
  const { 
    isAuthenticated, 
    loading: authLoading, 
    checkVerificationStatus,
  } = useAuth();
  
  // Hide splash screen once fonts and auth are loaded
  useEffect(() => {
    if (!authLoading) {
      SplashScreen.hideAsync();
    }
  }, [authLoading]);

  useColorScheme();
  const { currentTheme, themeName } = useTheme();
  
  const router = useRouter();
  
  // Cleanly handle session transitions (login/logout) by redirecting to the hub
  useEffect(() => {
    if (!authLoading) {
      router.replace("/");
    }
  }, [isAuthenticated, authLoading]);

  // Handle deep links for email verification
  useEffect(() => {
    // Handle initial URL (cold start - app was closed)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle URL when app is running (warm start)
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    try {
      const { path } = Linking.parse(url);

      if (path === "email-verified") {
        // Check verification status with backend
        const isVerified = await checkVerificationStatus();

        if (isVerified) {
          Alert.alert(
            "Email Verified!",
            "Your email has been successfully verified.",
            [
              {
                text: "Continue",
                onPress: () => {
                  router.replace("/(tabs)");
                },
              },
            ],
          );
        } else {
          Alert.alert(
            "Verification Pending",
            "Please wait a moment and try again, or check your email for the verification link.",
          );
        }
      }
    } catch (error) {
      console.error("Deep link handling error:", error);
    }
  };

  // If auth is still loading, keep splash screen visible by returning null
  if (authLoading) {
    return null;
  }

  // Create complete navigation theme with fonts
  const navigationTheme = {
    dark: themeName === "dark" || themeName === "luxe",
    colors: {
      primary: currentTheme.primary,
      background: currentTheme.background,
      card: currentTheme.surface,
      text: currentTheme.text,
      border: currentTheme.border,
      notification: currentTheme.accent,
    },
    fonts: {
      regular: {
        fontFamily: "System",
        fontWeight: "normal" as const,
      },
      medium: {
        fontFamily: "System",
        fontWeight: "500" as const,
      },
      bold: {
        fontFamily: "System",
        fontWeight: "bold" as const,
      },
      heavy: {
        fontFamily: "System",
        fontWeight: "800" as const,
      },
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <SafeAreaProvider>
        <SafeAreaWrapper>
          <Stack screenOptions={{ headerShown: false }}>
            {[
              <Stack.Screen key="index" name="index" />,
              
              !isAuthenticated && (
                <Stack.Screen key="onboarding" name="onboarding" options={{ gestureEnabled: false }} />
              ),
              !isAuthenticated && (
                <Stack.Screen key="auth" name="auth" options={{ gestureEnabled: false }} />
              ),

              isAuthenticated && (
                <Stack.Screen key="rider" name="rider" options={{ gestureEnabled: false }} />
              ),
              isAuthenticated && <Stack.Screen key="(tabs)" name="(tabs)" />,
              isAuthenticated && (
                <Stack.Screen
                  key="categories"
                  name="categories"
                  options={{
                    title: "Categories",
                    presentation: "card",
                    headerShown: true,
                  }}
                />
              ),
              isAuthenticated && (
                <Stack.Screen
                  key="search"
                  name="search"
                  options={{
                    title: "Search",
                    presentation: "card",
                    headerShown: true,
                  }}
                />
              ),
              isAuthenticated && (
                <Stack.Screen
                  key="product"
                  name="product/[id]"
                  options={{
                    title: "Product Details",
                    presentation: "card",
                  }}
                />
              ),
              isAuthenticated && (
                <Stack.Screen
                  key="admin"
                  name="admin"
                  options={{
                    title: "Admin Panel",
                    presentation: "card",
                  }}
                />
              ),
              isAuthenticated && (
                <Stack.Screen
                  key="awaiting-pickup"
                  name="awaiting-pickup"
                  options={{
                    title: "Awaiting Pickup",
                    presentation: "card",
                  }}
                />
              ),
              isAuthenticated && (
                <Stack.Screen
                 key="checkout"
                 name="checkout"
                 options={{
                   title: "Checkout",
                   presentation: "card",
                   headerShown: true,
                 }}
                />
              ),
              isAuthenticated && (
                <Stack.Screen
                  key="order-details"
                  name="order/[id]"
                  options={{
                    title: "Order Details",
                    presentation: "card",
                  }}
                />
              ),
              isAuthenticated && (
                <Stack.Screen
                  key="order-track"
                  name="order/track"
                  options={{
                    title: "Track Order",
                    presentation: "card",
                  }}
                />
              ),
              
              <Stack.Screen
                key="settings"
                name="settings"
                options={{
                  title: "Settings",
                  presentation: "card",
                  headerShown: true,
                }}
              />,
              <Stack.Screen
                key="theme-selector"
                name="theme-selector"
                options={{
                  title: "Select Theme",
                  presentation: "modal",
                }}
              />,
              <Stack.Screen
                key="help-support"
                name="help-support"
                options={{
                  title: "Help & Support",
                  presentation: "card",
                  headerShown: true,
                }}
              />,
              <Stack.Screen
                key="modal"
                name="modal"
                options={{
                  title: "Notifications",
                  presentation: "modal",
                }}
              />,
              <Stack.Screen
                key="about"
                name="about"
                options={{
                  title: "About EasyBuy",
                  presentation: "modal",
                }}
              />,
              <Stack.Screen
                key="wallet"
                name="wallet"
                options={{
                  headerShown: false,
                }}
              />,
              <Stack.Screen key="not-found" name="+not-found" />
            ].filter(Boolean) as React.ReactElement[]}
          </Stack>
        </SafeAreaWrapper>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
