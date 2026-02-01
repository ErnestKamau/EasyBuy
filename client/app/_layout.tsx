// app/_layout.tsx - Fixed with complete navigation theme
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
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
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { ActivityIndicator, View, Alert } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { useColorScheme } from "@/components/useColorScheme";
import { authApi, tokenManager, User } from "@/services/api";
import { toastConfig } from "@/components/ToastConfig";
import { ToastService } from "@/utils/toastService";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { CartProvider } from "@/contexts/CartContext";
import {
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export { ErrorBoundary } from "expo-router";

// Set initial route to onboarding - will be redirected if authenticated
export const unstable_settings = {
  initialRouteName: "onboarding",
};

SplashScreen.preventAutoHideAsync();

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  checkVerificationStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshAuth: async () => {},
  checkVerificationStatus: async () => false,
});

export const useAuth = () => useContext(AuthContext);

const ONBOARDING_KEY = "has_seen_onboarding";

function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null,
  );
  const [initialNavigationComplete, setInitialNavigationComplete] =
    useState(false);
  const router = useRouter();
  const segments = useSegments();

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await tokenManager.getAccessToken();

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      const currentUser = await authApi.getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        ToastService.showSuccess(
          "Welcome back!",
          `Hello, ${currentUser.username}`,
        );
      } else {
        await tokenManager.clearTokens();
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.log("Auth check failed:", error);
      await tokenManager.clearTokens();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: any) => {
    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      ToastService.showSuccess(
        "Login Successful!",
        `Welcome back, ${response.user.username}`,
      );
    } catch (error) {
      console.log("Login failed", error);
      ToastService.showApiError(error, "Login Failed");
      throw new Error("Login failed. Please try again.");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setInitialNavigationComplete(false);
      // Clear onboarding flag so user is redirected to onboarding
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      // Navigate to root and let navigation logic redirect to onboarding
      router.replace("/");
    }
  }, [router]);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    await checkAuthStatus();
  }, [checkAuthStatus]);

  const checkVerificationStatus = useCallback(async () => {
    try {
      const isVerified = await authApi.checkVerificationStatus();
      if (isVerified && user && !user.email_verified_at) {
        // Refresh user data to get updated verification status
        await checkAuthStatus();
      }
      return isVerified;
    } catch (error) {
      console.error("Failed to check verification status:", error);
      return false;
    }
  }, [user, checkAuthStatus]);

  // Check if user has seen onboarding
  const checkOnboardingStatus = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      console.log("Onboarding check - AsyncStorage value:", value);
      const hasSeen = value === "true";
      console.log("Setting hasSeenOnboarding to:", hasSeen);
      setHasSeenOnboarding(hasSeen);
    } catch (error) {
      console.log("Error checking onboarding status:", error);
      setHasSeenOnboarding(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
    checkOnboardingStatus();
  }, [checkAuthStatus, checkOnboardingStatus]);

  // Immediate redirect when loading completes - prevents tabs from rendering
  useEffect(() => {
    if (loading) return;

    const currentSegment = segments[0];

    // If authenticated, redirect to tabs if on auth/onboarding
    if (isAuthenticated) {
      if (currentSegment === "onboarding" || currentSegment === "auth") {
        router.replace("/(tabs)");
        // Wait a bit for navigation, then mark complete
        setTimeout(() => setInitialNavigationComplete(true), 100);
      } else {
        // Already on tabs, mark complete immediately
        setInitialNavigationComplete(true);
      }
      return;
    }

    // If not authenticated, ensure we're on onboarding
    if (!isAuthenticated) {
      if (currentSegment !== "onboarding" && currentSegment !== "auth") {
        router.replace("/onboarding");
        // Wait a bit for navigation to complete, then mark as done
        setTimeout(() => setInitialNavigationComplete(true), 100);
      } else {
        // Already on onboarding or auth, mark complete immediately
        setInitialNavigationComplete(true);
      }
    }
  }, [loading, isAuthenticated, segments, router]);

  // Navigation guard - handles route changes
  useEffect(() => {
    // Wait for auth check to complete
    if (loading) return;

    const currentSegment = segments[0];
    const inAuthGroup =
      currentSegment === "auth" || currentSegment === "onboarding";
    const inOnboarding = currentSegment === "onboarding";
    const inAuth = currentSegment === "auth";

    // If authenticated, go to tabs (and redirect away from auth/onboarding screens)
    if (isAuthenticated) {
      if (inAuthGroup) {
        router.replace("/(tabs)");
      }
      return;
    }

    // If not authenticated, always start from onboarding first
    // Only allow navigation to auth if user is coming from onboarding
    if (!isAuthenticated) {
      if (inOnboarding) {
        // User is on onboarding, allow them to stay
        return;
      }
      if (inAuth) {
        // User is on auth screen, allow them to stay (they came from onboarding)
        return;
      }
      // If not in onboarding or auth, redirect to onboarding
      router.replace("/onboarding");
    }
  }, [isAuthenticated, loading, segments, router]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      refreshAuth,
      checkVerificationStatus,
    }),
    [
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      refreshAuth,
      checkVerificationStatus,
    ],
  );

  // Show loading screen until auth check completes AND initial navigation is set
  if (loading || !initialNavigationComplete) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

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
  const colorScheme = useColorScheme();
  const { currentTheme, themeName } = useTheme();
  const { checkVerificationStatus } = useAuth();
  const router = useRouter();

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
      const { path, queryParams } = Linking.parse(url);

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
          <Stack>
            <Stack.Screen
              name="onboarding"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />

            <Stack.Screen
              name="auth"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />

            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="categories"
              options={{
                title: "Categories",
                presentation: "card",
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="search"
              options={{
                title: "Search",
                presentation: "card",
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="product/[id]"
              options={{
                title: "Product Details",
                presentation: "card",
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="admin"
              options={{
                title: "Admin Panel",
                presentation: "card",
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="awaiting-pickup"
              options={{
                title: "Awaiting Pickup",
                presentation: "card",
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="checkout"
              options={{
                title: "Checkout",
                presentation: "card",
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="order/[id]"
              options={{
                title: "Order Details",
                presentation: "card",
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="settings"
              options={{
                title: "Settings",
                presentation: "card",
              }}
            />

            <Stack.Screen
              name="theme-selector"
              options={{
                title: "Theme Selection",
                presentation: "card",
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="modal"
              options={{
                title: "Notifications",
                presentation: "modal",
              }}
            />

            <Stack.Screen
              name="about"
              options={{
                title: "About EasyBuy",
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="wallet"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </SafeAreaWrapper>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
