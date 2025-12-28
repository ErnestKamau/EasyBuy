// services/api.ts
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000/api";

console.log('API Base URL:', BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";

export const tokenManager = {
  async setToken(accessToken: string) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },

  async clearTokens() {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

// Request interceptor - adds auth token to every request
api.interceptors.request.use(async (config) => {
  const token = await tokenManager.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  };
  return config;
});

// Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If 401, clear tokens and redirect to auth
    if (error.response?.status === 401) {
      await tokenManager.clearTokens();
      router.replace('/auth');
    }

    // Preserve the original error with response data for better error handling
    throw error;
  }
);

// Types for API responses
export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  gender?: 'male' | 'female' | 'other' | 'Male' | 'Female';
  role?: 'admin' | 'customer';
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  message?: string;
  user: User;
  access_token: string;
  token_type: string;
}

export interface Category {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  products_count: number;
}

export interface Product {
  id: number;
  name: string;
  image_url: string;
  category: number;
  category_name: string;
  description: string;
  kilograms?: number | null;
  sale_price: number;
  cost_price: number;
  in_stock: number;
  minimum_stock: number;
  is_active: boolean;
  profit_margin: number;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  password: string;
  password_confirmation: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
}

export interface LoginData {
  username?: string;
  email?: string;
  password: string;
}

export const authApi = {
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { data } = await api.post<AuthResponse>("/register", userData);

      // Laravel returns access_token directly
      if (data.access_token) {
        await tokenManager.setToken(data.access_token);
      }

      return data;
    } catch (error: any) {
      console.error("Registration API error:", error);
      // Preserve the full error object so ToastService can parse validation errors
      // ToastService expects the axios error structure with response.data
      throw error;
    }
  },

  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      console.log('Login attempt - API Base URL:', BASE_URL);
      console.log('Login attempt - Full URL:', `${BASE_URL}/login`);

      const { data } = await api.post<AuthResponse>("/login", credentials);

      // Check if we got HTML instead of JSON (wrong endpoint)
      if (typeof data === 'string' && (data as string).includes('<!DOCTYPE html>')) {
        console.error('ERROR: Received HTML instead of JSON. API URL:', `${BASE_URL}/login`);
        throw new Error(`Received HTML instead of JSON. API URL is: ${BASE_URL}. Please check your .env file (EXPO_PUBLIC_API_URL) and restart the Expo server.`);
      }

      // Laravel returns access_token directly, not in a tokens object
      if (!data.access_token) {
        const backendMsg = (data as any)?.message || (data as any)?.error || 'Invalid login response from server';
        console.error("Login response validation failed:", data);
        throw new Error(backendMsg);
      }

      await tokenManager.setToken(data.access_token);
      return data;
    } catch (error: any) {
      console.error("Login API error:", error);

      // If it's an axios error, extract the actual response
      if (error.response) {
        // Check if response is HTML
        const responseData = error.response.data;
        if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE html>')) {
          throw new Error('API endpoint returned HTML instead of JSON. Please check your API URL configuration.');
        }

        const errorData = responseData;
        const errorMsg = errorData?.message || errorData?.error || 'Login failed';

        // For email verification errors (403), preserve the message
        if (error.response.status === 403 && errorData?.email_verified === false) {
          throw new Error(errorMsg);
        }

        throw new Error(errorMsg);
      }

      // If it's already an Error object, re-throw it
      if (error instanceof Error) {
        throw error;
      }

      // Otherwise, wrap it
      throw new Error(error?.message || 'Login failed. Please try again.');
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout API error (non-critical):", error);
    } finally {
      await tokenManager.clearTokens();
      router.replace('/auth');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await tokenManager.getAccessToken();
      if (!token) {
        console.log("No access token found, skipping getCurrentUser");
        return null;
      }

      const { data } = await api.get<User>("/user");
      return data;
    } catch (error) {
      console.log("Failed to fetch current user:", error);
      return null;
    }
  },

  async checkVerificationStatus(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user ? !!user.email_verified_at : false;
    } catch (error) {
      console.error("Failed to check verification status:", error);
      return false;
    }
  },

  async resendVerificationEmail(): Promise<void> {
    try {
      await api.post("/email/resend");
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data;
        const errorMsg = errorData?.message || errorData?.error || 'Failed to resend verification email';
        throw new Error(errorMsg);
      }
      throw new Error('Failed to resend verification email');
    }
  },

  async resendEmailVerificationCode(email: string): Promise<void> {
    try {
      await api.post("/resend-email-verification-code", { email });
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data;
        const errorMsg = errorData?.message || errorData?.error || 'Failed to resend verification code';
        throw new Error(errorMsg);
      }
      throw new Error('Failed to resend verification code');
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      await api.post("/forgot-password", { email });
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data;
        const errorMsg = errorData?.message || errorData?.error || 'Failed to send password reset code';
        throw new Error(errorMsg);
      }
      throw new Error('Failed to send password reset code');
    }
  },

  async verifyEmailCode(email: string, code: string): Promise<{ user: User }> {
    try {
      const { data } = await api.post("/verify-email-code", { email, code });
      return data;
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data;
        const errorMsg = errorData?.message || errorData?.error || 'Invalid verification code';
        throw new Error(errorMsg);
      }
      throw new Error('Failed to verify email code');
    }
  },

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    try {
      await api.post("/verify-reset-code", { email, code });
      return true;
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data;
        const errorMsg = errorData?.message || errorData?.error || 'Invalid reset code';
        throw new Error(errorMsg);
      }
      throw new Error('Failed to verify reset code');
    }
  },

  async resetPassword(email: string, code: string, password: string, passwordConfirmation: string): Promise<void> {
    try {
      await api.post("/reset-password", {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      });
    } catch (error: any) {
      if (error.response) {
        const errorData = error.response.data;
        const errorMsg = errorData?.message || errorData?.error || 'Failed to reset password';
        throw new Error(errorMsg);
      }
      throw new Error('Failed to reset password');
    }
  },
};

export const productsApi = {
  async getCategories(): Promise<Category[]> {
    const token = await tokenManager.getAccessToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const { data } = await api.get<{ results: Category[] } | Category[]>("/categories/");
    // Handle both paginated and non-paginated responses
    return Array.isArray(data) ? data : data.results;
  },

  async getProducts(search?: string, categoryId?: number): Promise<Product[]> {
    const token = await tokenManager.getAccessToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryId) params.append('category', categoryId.toString());

    const { data } = await api.get<{ results: Product[] } | Product[]>(`/products/?${params.toString()}`);
    // Handle both paginated and non-paginated responses
    return Array.isArray(data) ? data : data.results;
  },

  async getProduct(id: number): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${id}/`);
    return data;
  },

  // Admin functions
  async createCategory(name: string): Promise<Category> {
    const { data } = await api.post<Category>("/admin/categories/", { name });
    return data;
  },

  async updateCategory(id: number, name: string): Promise<Category> {
    const { data } = await api.put<Category>(`/admin/categories/${id}/`, { name });
    return data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/admin/categories/${id}/`);
  },

  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name' | 'profit_margin' | 'is_low_stock'>): Promise<Product> {
    const { data } = await api.post<Product>("/admin/products/", productData);
    return data;
  },

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    const { data } = await api.put<Product>(`/admin/products/${id}/`, productData);
    return data;
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/admin/products/${id}/`);
  },

  async getLowStockProducts(): Promise<{ count: number; products: Product[] }> {
    const { data } = await api.get("/admin/products/low-stock/");
    return data;
  }
};

// Order interfaces
export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  weight?: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  user: number;
  customer_name: string;
  customer_phone: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  order_date: string;
  order_time: string;
  updated_at: string;
  total_amount: number;
  payment_status?: 'PENDING' | 'PAID' | 'DEBT' | 'FAILED';
  delivery_type?: 'pickup' | 'delivery';
  payment_method?: 'cash' | 'mpesa' | 'debt';
  items?: OrderItem[];
}

export interface CartItemForOrder {
  product_id: number;
  quantity: number;
  weight?: number;
}

// Orders API
export const ordersApi = {
  async createOrder(
    items: CartItemForOrder[],
    notes?: string,
    deliveryType?: 'pickup' | 'delivery',
    paymentMethod?: 'cash' | 'mpesa' | 'debt'
  ): Promise<Order> {
    const { data } = await api.post('/orders/create/', {
      items,
      notes: notes || '',
      delivery_type: deliveryType || 'pickup',
      payment_method: paymentMethod || 'cash'
    });
    return data.order;
  },

  async getOrders(): Promise<Order[]> {
    const { data } = await api.get('/orders/orders/');
    return Array.isArray(data) ? data : data.results || [];
  },

  async getOrderDetails(orderId: number): Promise<{ order: Order; items: OrderItem[] }> {
    const { data } = await api.get(`/orders/${orderId}/details/`);
    return data;
  },

  async getPendingOrders(): Promise<{ orders: Order[]; count: number }> {
    const { data } = await api.get('/orders/admin/pending/');
    return data;
  },

  async confirmOrder(orderId: number): Promise<{ message: string; sale_id: number }> {
    const { data } = await api.post(`/orders/orders/${orderId}/confirm/`);
    return data;
  },

  async cancelOrder(orderId: number): Promise<void> {
    await api.patch(`/orders/orders/${orderId}/`, { status: 'cancelled' });
  },

  async initiatePayment(orderId: number): Promise<{ success: boolean; message: string; MerchantRequestID?: string; CheckoutRequestID?: string }> {
    try {
      // fetch order details
      const { data: order } = await api.get(`/orders/${orderId}/`);
      const payload = {
        order_id: order.id,
        phone_number: order.customer_phone,
        amount: order.total_amount,
      };

      const { data } = await api.post('/mpesa/initiate/', payload);
      return {
        success: true,
        message: data.ResponseDescription || data.message || 'Payment request sent',
        MerchantRequestID: data.MerchantRequestID,
        CheckoutRequestID: data.CheckoutRequestID,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Failed to initiate payment',
      };
    }
  }
};

export type PingResponse = { ok: boolean; message: string };
export async function ping(): Promise<PingResponse> {
  const { data } = await api.get<PingResponse>("/ping/");
  return data;
}

// Sales interfaces
export interface SaleItem {
  id: number;
  product: number;
  product_name: string;
  product_image: string;
  category_name: string;
  quantity: number;
  unit_price: number;
  sale_price: number;
  subtotal: number;
  profit_total: number;
}

export interface Payment {
  id: number;
  method: 'cash' | 'mpesa' | 'bank_transfer' | 'card';
  amount: number;
  reference: string;
  notes: string;
  paid_at: string;
}

export interface Sale {
  id: number;
  order_id: number;
  sale_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  cost_amount: number;
  profit_amount: number;
  payment_status: 'fully-paid' | 'partial' | 'no-payment' | 'overdue';
  due_date?: string;
  made_on: string;
  updated_on: string;
  total_paid: number;
  balance: number;
  is_fully_paid: boolean;
  items?: SaleItem[];
  payments?: Payment[];
  days_remaining?: number;
  is_near_due?: boolean;
  is_overdue?: boolean;
}

export interface SalesAnalytics {
  total_sales: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  profit_margin: number;
  payment_status_breakdown: Record<string, { name: string; count: number }>;
  recent_sales: Sale[];
  daily_sales: Array<{
    date: string;
    sales_count: number;
    revenue: number;
  }>;
  period_days: number;
}

export interface PaymentSummary {
  date: string;
  total_payments: number;
  cash_total: number;
  mpesa_total: number;
  other_total: number;
  transaction_count: number;
  recent_payments: Payment[];
}

// Sales API
export const salesApi = {
  async getSales(): Promise<Sale[]> {
    const { data } = await api.get('/sales/sales/');
    return Array.isArray(data) ? data : data.results || [];
  },

  async getSaleDetails(saleId: number): Promise<Sale> {
    const { data } = await api.get(`/sales/sales/${saleId}/`);
    return data;
  },

  async addPayment(saleId: number, payment: {
    method: string;
    amount: number;
    reference?: string;
    notes?: string;
  }): Promise<{ message: string; payment: Payment; sale: Sale }> {
    const { data } = await api.post(`/sales/sales/${saleId}/add_payment/`, payment);
    return data;
  },

  async getAnalytics(days: number = 30): Promise<SalesAnalytics> {
    const { data } = await api.get(`/sales/analytics/?days=${days}`);
    return data;
  },

  async getOverduePayments(): Promise<{ overdue_sales: Sale[]; count: number }> {
    const { data } = await api.get('/sales/overdue/');
    return data;
  },

  async getPaymentSummary(): Promise<PaymentSummary> {
    const { data } = await api.get('/sales/payments/summary/');
    return data;
  },

  async getDebts(): Promise<{ debts: Sale[]; count: number }> {
    const { data } = await api.get('/sales/debts/');
    return data;
  },

  async getUnpaidSales(): Promise<{ unpaid_sales: Sale[]; count: number }> {
    const { data } = await api.get('/sales/unpaid/');
    return data;
  }
};

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