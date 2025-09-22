// app/_layout.tsx
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext, useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { authApi, tokenManager } from '@/services/api';

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

// Auth Context
interface AuthContextType {
  user: string | null;
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


// Define User type (adjust fields as needed)
type User = {
  id: string;
  username: string;
  email?: string;
  // Add other fields as needed
};

function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  
  const checkAuthStatus = async () => {
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
  };

  
  const login = async (credentials: any) => {
    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error; // Re-throw so the component can handle it
    }
  };

  
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Refresh auth state
  const refreshAuth = async () => {
    setLoading(true);
    await checkAuthStatus();
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

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

  // Show loading screen while checking auth
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

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshAuth,
  };

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