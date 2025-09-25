// app/_layout.tsx - Fixed with complete navigation theme
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { useColorScheme } from "@/components/useColorScheme";
import { authApi, tokenManager, User } from "@/services/api";
import { toastConfig } from "@/components/ToastConfig";
import { ToastService } from "@/utils/toastService";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider as CustomThemeProvider, useTheme } from "@/contexts/ThemeContext";

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await tokenManager.getAccessToken();

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const currentUser = await authApi.getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        ToastService.showSuccess(
          "Welcome back!",
          `Hello, ${currentUser.username}`
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
        `Welcome back, ${response.user.username}`
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
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    await checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, loading, segments]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      refreshAuth,
    }),
    [user, isAuthenticated, loading, login, logout, refreshAuth]
  );

  if (loading) {
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
          <RootLayoutNav />
          <Toast config={toastConfig} />
        </CartProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { currentTheme, themeName } = useTheme();

  // Create complete navigation theme with fonts
  const navigationTheme = {
    dark: themeName === 'dark' || themeName === 'luxe',
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
        fontFamily: 'System',
        fontWeight: 'normal' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: 'bold' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800' as const,
      },
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <SafeAreaProvider>
        <Stack>
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
            name="checkout"
            options={{
              title: "Checkout",
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
              presentation: "modal",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}