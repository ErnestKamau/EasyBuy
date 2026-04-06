// contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "expo-router";
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
  hasSeenOnboarding: boolean | null;
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
  hasSeenOnboarding: null,
});

export const useAuth = () => useContext(AuthContext);

const ONBOARDING_KEY = "has_seen_onboarding";

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const router = useRouter();

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
    } catch (error: any) {
      console.log("Login failed", error);
      
      // Handle email not verified (403 from backend)
      if (error.response?.status === 403 || error.message?.includes("verify your email")) {
        ToastService.showWarning(
          "Email Not Verified",
          "Please verify your email address before logging in."
        );
        
        // Redirect to email-verification screen
        router.replace({
          pathname: "/auth",
          params: { 
            mode: "email-verification", 
            email: credentials.email || credentials.email_or_username || "" 
          },
        } as any);
        
        // We still throw to allow the components to handle the local loading state
        throw error;
      }

      ToastService.showApiError(error, "Login Failed");
      throw new Error("Login failed. Please try again.");
    }
  }, [router]);

  const socialLogin = useCallback(async (provider: string, token: string) => {
    try {
      const response = await authApi.socialLogin(provider, token);
      setUser(response.user);
      setIsAuthenticated(true);
      ToastService.showSuccess(
        "Login Successful!",
        `Welcome back, ${response.user.username}`,
      );
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
      // Centralized navigation guards handle the redirect.
    }
  }, []);

  // Check if user has seen onboarding
  const checkOnboardingStatus = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(value === "true");
    } catch (error) {
      console.log("Error checking onboarding status:", error);
      setHasSeenOnboarding(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    await Promise.all([checkAuthStatus(), checkOnboardingStatus()]);
    setLoading(false);
  }, [checkAuthStatus, checkOnboardingStatus]);

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


  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([checkAuthStatus(), checkOnboardingStatus()]);
      setLoading(false);
    };
    initialize();
  }, [checkAuthStatus, checkOnboardingStatus]);

  // Initial navigation and session-based guards are now handled by app/index.tsx 
  // and ProtectedRoute-like logic in components, or below.

  // Navigation is now handled by conditional Stack in app/_layout.tsx 
  // and the redirection hub in app/index.tsx

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      loading,
      login,
      socialLogin,
      logout,
      refreshAuth,
      checkVerificationStatus,
      hasSeenOnboarding,
    }),
    [
      user,
      isAuthenticated,
      loading,
      login,
      socialLogin,
      logout,
      refreshAuth,
      checkVerificationStatus,
      hasSeenOnboarding,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
