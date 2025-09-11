// services/api.ts
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
});

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";


export const tokenManager = {
  async setTokens(accessToken: string, refreshToken: string) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async clearTokens() {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

// Attach JWT
api.interceptors.request.use(async (config) => {
  const token = await tokenManager.getAccessToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await tokenManager.clearTokens();
        // You might want to emit an event or use a navigation service here
        console.log('Token refresh failed, user needs to login again');
      }
    }

    return Promise.reject(error);
  }
);

// Types for API responses
export interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  gender?: 'Male' | 'Female';
  role: 'admin' | 'customer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RegisterData {
  username: string;
  email: string;
  phone_number: string;
  password: string;
  password_confirm: string;
  gender?: 'Male' | 'Female';
  role?: 'admin' | 'customer';
}

export interface LoginData {
  username: string;
  password: string;
}


export const authApi = {
  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register/", userData);


    await tokenManager.setTokens(data.tokens.access, data.tokens.refresh);

    return data;
  },

  async login(credentials: LoginData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login/", credentials);


    await tokenManager.setTokens(data.tokens.access, data.tokens.refresh);

    return data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (refreshToken) {
          await api.post("/auth/logout/",{
              refresh: refreshToken
          });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await tokenManager.clearTokens();
    }
  },

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (!refreshToken) return null;

      const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
        refresh: refreshToken,
      });

      const { access } = response.data;
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);

      return access;
    } catch (error) {
      await tokenManager.clearTokens();
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await api.get<User>("/auth/me/");
      return data;
    } catch (error) {
      return null;
    }
  },
};


export type PingResponse = { ok: boolean; message: string };
export async function ping(): Promise<PingResponse> {
  const { data } = await api.get<PingResponse>("/ping/");
  return data;
}


export async function isAuthenticated(): Promise<boolean> {
  const token = await tokenManager.getAccessToken();
  return token !== null;
}


export function handleApiError(error: any): string {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error.response?.status === 400) {
    const errors = error.response.data;
    const errorMessages = Object.values(errors).flat();
    return errorMessages.join(', ');
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
}