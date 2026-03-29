// contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, tokenManager, User } from "@/services/api";
import { ToastService } from "@/utils/toastService";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  socialLogin: (provider: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  checkVerificationStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  socialLogin: async () => {},
  logout: async () => {},
  refreshAuth: async () => {},
  checkVerificationStatus: async () => false,
});

export const useAuth = () => useContext(AuthContext);

const ONBOARDING_KEY = "has_seen_onboarding";

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const socialLogin = useCallback(async (provider: string, token: string) => {
    try {
      const response = await authApi.socialLogin(provider, token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.log("Social login failed", error);
      throw error;
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
      // Navigate directly to onboarding
      router.replace("/onboarding");
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
      await AsyncStorage.getItem(ONBOARDING_KEY);
    } catch (error) {
      console.log("Error checking onboarding status:", error);
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
    if (!isAuthenticated) {
      if (inOnboarding || inAuth) {
        return;
      }
      router.replace("/onboarding");
    }
  }, [isAuthenticated, loading, segments, router]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      loading: loading || !initialNavigationComplete, // Combine both for UI simplicity
      login,
      socialLogin,
      logout,
      refreshAuth,
      checkVerificationStatus,
    }),
    [
      user,
      isAuthenticated,
      loading,
      initialNavigationComplete,
      login,
      socialLogin,
      logout,
      refreshAuth,
      checkVerificationStatus,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
