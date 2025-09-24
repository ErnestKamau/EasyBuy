// app/_layout.tsx
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/components/useColorScheme';
import { authApi, tokenManager, User } from '@/services/api';
import { toastConfig } from '@/components/ToastConfig';
import { ToastService } from '@/utils/toastService';

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

      // Verify token by calling /me endpoint
      const currentUser = await authApi.getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        ToastService.showSuccess('Welcome back!', `Hello, ${currentUser.username}`)
      } else {
        // Token is invalid, clear it
        await tokenManager.clearTokens();
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
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
      ToastService.showSuccess('Login Successful!', `Welcome back, ${response.user.username}`);
    } catch (error) {
      console.log("Login failed", error)
      ToastService.showApiError(error, 'Login Failed');
      throw new Error("Login failed. Please try again.");
    }
  }, []);

  
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.log('Logout error:', error);
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
    if (loading) return; // Still checking auth status

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not logged in and trying to access protected routes
      router.replace('/auth');
    } else if (isAuthenticated && inAuthGroup) {
      // User is logged in but still on auth screen
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading, segments]);


  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshAuth,
  }), [user, isAuthenticated, loading, login, logout, refreshAuth]);


  if (loading) {
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
    

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
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
      <Toast config={toastConfig} />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            // Prevent going back to auth screen after login
            gestureEnabled: false
          }}
        />

        
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false
          }}
        />

        <Stack.Screen
          name="categories"
          options={{
            title: "Categories",
            presentation: 'card',
            headerShown: true
          }}
        />

        <Stack.Screen
          name="search" 
          options={{
            title: "Search",
            presentation: 'card',
            headerShown: true
          }}
        />

        <Stack.Screen
          name="product/[id]"
          options={{
            title: "Product Details",
            presentation: 'card',
            headerShown: false // We have custom header in the component
          }}
        />

        <Stack.Screen
          name="admin"
          options={{
            title: "Admin Panel",
            presentation: 'card',
            headerShown: false // We have custom header in the component
          }}
        />

        
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