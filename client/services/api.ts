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
  wallet_balance: number; // Current balance (positive = credit, negative = debt)
  max_debt_limit: number; // Maximum debt allowed (e.g., -5000)
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
  kilograms_in_stock?: number | null;
  sale_price: number;
  cost_price: number;
  in_stock: number;
  minimum_stock?: number | null;
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
  async getCategories(activeOnly?: boolean): Promise<Category[]> {
    const params = activeOnly ? '?active_only=true' : '';
    const { data } = await api.get<{ success: boolean; data: Category[] }>(`/categories${params}`);
    return data.data;
  },

  async getProducts(filters?: {
    search?: string;
    category_id?: number;
    active_only?: boolean;
    low_stock_only?: boolean;
    min_price?: number;
    max_price?: number;
  }): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category_id) params.append('category_id', filters.category_id.toString());
    if (filters?.active_only) params.append('active_only', 'true');
    if (filters?.low_stock_only) params.append('low_stock_only', 'true');
    if (filters?.min_price) params.append('min_price', filters.min_price.toString());
    if (filters?.max_price) params.append('max_price', filters.max_price.toString());

    const { data } = await api.get<{ success: boolean; data: { data: Product[] } }>(`/products?${params.toString()}`);
    return Array.isArray(data.data) ? data.data : data.data.data || [];
  },

  async getProduct(id: number): Promise<Product> {
    const { data } = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
    return data.data;
  },

  // Admin functions
  async createCategory(categoryData: { name: string; is_active?: boolean }): Promise<Category> {
    const { data } = await api.post<{ success: boolean; data: Category }>("/categories", categoryData);
    return data.data;
  },

  async updateCategory(id: number, categoryData: { name?: string; is_active?: boolean }): Promise<Category> {
    const { data } = await api.put<{ success: boolean; data: Category }>(`/categories/${id}`, categoryData);
    return data.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name' | 'profit_margin' | 'is_low_stock' | 'category' | 'image_url'> & { category_id: number; image_url?: string | null }): Promise<Product> {
    const { data } = await api.post<{ success: boolean; data: Product }>("/products", productData);
    return data.data;
  },

  async updateProduct(id: number, productData: Partial<Product> & { image_url?: string | null }): Promise<Product> {
    const { data } = await api.put<{ success: boolean; data: Product }>(`/products/${id}`, productData);
    return data.data;
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async getLowStockProducts(): Promise<Product[]> {
    const { data } = await api.get<{ success: boolean; data: Product[] }>("/products/low-stock");
    return data.data;
  },

  async uploadImage(imageUri: string): Promise<string> {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    const { data } = await api.post<{ success: boolean; data: { url: string } }>('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data.url;
  }
};

// Order interfaces
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  kilogram?: number | null;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  user?: User;
  order_status: 'pending' | 'confirmed' | 'cancelled';
  payment_status: 'pending' | 'fully-paid' | 'partially-paid' | 'debt' | 'failed';
  order_date: string;
  order_time: string;
  notes?: string;
  updated_at: string;
  total_amount: number;
  items?: OrderItem[];
  sale?: Sale;
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
    paymentMethod?: 'cash' | 'mpesa' | 'card',
    pickupTime?: string | null
  ): Promise<Order> {
    const { data } = await api.post<{ success: boolean; data: Order }>('/orders', {
      items,
      notes: notes || '',
      payment_status: paymentMethod === 'debt' ? 'debt' : paymentMethod === 'mpesa' ? 'pending' : 'pending',
      pickup_time: pickupTime || undefined,
    });
    return data.data;
  },

  async getOrders(filters?: {
    order_status?: string;
    payment_status?: string;
    user_id?: number;
  }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters?.order_status) params.append('order_status', filters.order_status);
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.user_id) params.append('user_id', filters.user_id.toString());

    const { data } = await api.get<{ success: boolean; data: { data: Order[] } }>(`/orders?${params.toString()}`);
    return Array.isArray(data.data) ? data.data : data.data.data || [];
  },

  async getOrderDetails(orderId: number): Promise<Order> {
    const { data } = await api.get<{ success: boolean; data: Order }>(`/orders/${orderId}`);
    return data.data;
  },

  async getPendingOrders(): Promise<Order[]> {
    const orders = await this.getOrders({ order_status: 'pending' });
    return orders;
  },

  async confirmOrder(orderId: number): Promise<Order> {
    const { data } = await api.put<{ success: boolean; data: Order }>(`/orders/${orderId}`, {
      order_status: 'confirmed'
    });
    return data.data;
  },

  async cancelOrder(orderId: number): Promise<Order> {
    const { data } = await api.post<{ success: boolean; data: Order }>(`/orders/${orderId}/cancel`);
    return data.data;
  },

  async updateOrder(orderId: number, updates: {
    order_status?: 'pending' | 'confirmed' | 'cancelled';
    payment_status?: 'pending' | 'fully-paid' | 'partially-paid' | 'debt' | 'failed';
    notes?: string;
  }): Promise<Order> {
    const { data } = await api.put<{ success: boolean; data: Order }>(`/orders/${orderId}`, updates);
    return data.data;
  },
};

export type PingResponse = { ok: boolean; message: string };
export async function ping(): Promise<PingResponse> {
  const { data } = await api.get<PingResponse>("/ping/");
  return data;
}

// Sales interfaces
export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  kilogram?: number | null;
  unit_price: number;
  cost_price: number;
  subtotal: number;
  profit?: number;
  product?: Product;
}

export interface Payment {
  id: number;
  payment_number: string;
  sale_id: number;
  payment_method: 'mpesa' | 'cash' | 'card';
  amount: number;
  mpesa_transaction_id?: string;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  notes?: string;
  paid_at: string;
  refunded_at?: string;
  refund_amount?: number;
  created_at: string;
  updated_at: string;
  sale?: Sale; // Include sale in payment response
}

export interface Sale {
  id: number;
  sale_number: string;
  order_id: number;
  total_amount: number;
  cost_amount: number;
  profit_amount: number;
  payment_status: 'fully-paid' | 'partial-payment' | 'no-payment' | 'overdue';
  due_date?: string;
  receipt_generated: boolean;
  made_on: string;
  updated_at: string;
  total_paid: number;
  balance: number;
  is_fully_paid: boolean;
  items?: SaleItem[];
  payments?: Payment[];
  order?: Order;
  days_remaining?: number;
  is_near_due?: boolean;
  is_overdue?: boolean;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface SalesAnalytics {
  total_sales: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  profit_margin: number;
  payment_status_breakdown: Record<string, number>;
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
  card_total: number;
  transaction_count: number;
  recent_payments: Payment[];
}

// Sales API
export const salesApi = {
  async getSales(filters?: {
    payment_status?: string;
    date_from?: string;
    date_to?: string;
    overdue_only?: boolean;
    unpaid_only?: boolean;
  }): Promise<Sale[]> {
    const params = new URLSearchParams();
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.overdue_only) params.append('overdue_only', 'true');
    if (filters?.unpaid_only) params.append('unpaid_only', 'true');

    const { data } = await api.get<{ success: boolean; data: { data: Sale[] } }>(`/sales?${params.toString()}`);
    return Array.isArray(data.data) ? data.data : data.data.data || [];
  },

  async getSaleDetails(saleId: number): Promise<Sale> {
    const { data } = await api.get<{ success: boolean; data: Sale }>(`/sales/${saleId}`);
    return data.data;
  },

  async downloadReceipt(saleId: number): Promise<void> {
    const response = await api.get(`/sales/${saleId}/receipt`, {
      responseType: 'blob',
    });
    // Handle file download in React Native (you might need a library for this)
    return response.data;
  },

  async getAnalytics(days: number = 30): Promise<SalesAnalytics> {
    const { data } = await api.get<{ success: boolean; data: SalesAnalytics }>(`/sales/analytics?days=${days}`);
    return data.data;
  },

  async getOverduePayments(): Promise<{ data: Sale[]; count: number }> {
    const { data } = await api.get<{ success: boolean; data: Sale[]; count: number }>('/sales/overdue');
    return { data: data.data, count: data.count };
  },

  async getUnpaidSales(): Promise<{ data: Sale[]; count: number }> {
    const { data } = await api.get<{ success: boolean; data: Sale[]; count: number }>('/sales/unpaid');
    return { data: data.data, count: data.count };
  },

  async getDebts(): Promise<{ data: Sale[]; count: number }> {
    const { data } = await api.get<{ success: boolean; data: Sale[]; count: number }>('/sales/debts');
    return { data: data.data, count: data.count };
  },
};

// Payments API
export const paymentsApi = {
  async getPayments(filters?: {
    sale_id?: number;
    payment_method?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Payment[]> {
    const params = new URLSearchParams();
    if (filters?.sale_id) params.append('sale_id', filters.sale_id.toString());
    if (filters?.payment_method) params.append('payment_method', filters.payment_method);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const { data } = await api.get<{ success: boolean; data: { data: Payment[] } }>(`/payments?${params.toString()}`);
    return Array.isArray(data.data) ? data.data : data.data.data || [];
  },

  async getPaymentDetails(paymentId: number): Promise<Payment> {
    const { data } = await api.get<{ success: boolean; data: Payment }>(`/payments/${paymentId}`);
    return data.data;
  },

  async addPayment(saleId: number, payment: {
    payment_method: 'mpesa' | 'cash' | 'card';
    amount: number;
    phone_number?: string;
    reference?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; data: Payment }> {
    const { data } = await api.post<{ success: boolean; message: string; data: Payment }>(
      `/payments/sales/${saleId}/payments`,
      payment
    );
    return data;
  },

  async verifyPayment(paymentId: number): Promise<Payment> {
    const { data } = await api.post<{ success: boolean; data: { payment: Payment; is_verified: boolean } }>(
      `/payments/${paymentId}/verify`
    );
    return data.data.payment;
  },

  async refundPayment(paymentId: number): Promise<Payment> {
    const { data } = await api.post<{ success: boolean; message: string; data: Payment }>(
      `/payments/${paymentId}/refund`
    );
    return data.data;
  },

  async getPaymentSummary(date?: string): Promise<PaymentSummary> {
    const params = date ? `?date=${date}` : '';
    const { data } = await api.get<{ success: boolean; data: PaymentSummary }>(`/payments/summary${params}`);
    return data.data;
  },
};

// M-Pesa API
export const mpesaApi = {
  async initiateStkPush(params: {
    saleId?: number;
    orderId?: number;
    phoneNumber: string;
    amount: number;
  }): Promise<{
    success: boolean;
    message: string;
    data?: {
      merchant_request_id?: string;
      checkout_request_id?: string;
      response_description?: string;
      payment_id: number;
    };
  }> {
    try {
      const { data } = await api.post<{
        success: boolean;
        message: string;
        data: {
          merchant_request_id?: string;
          checkout_request_id?: string;
          response_description?: string;
          payment_id: number;
        };
      }>('/mpesa/initiate', {
        sale_id: params.saleId,
        order_id: params.orderId,
        phone_number: params.phoneNumber,
        amount: params.amount,
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to initiate payment',
      };
    }
  },

  async getTransactions(filters?: {
    status?: string;
    payment_id?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.payment_id) params.append('payment_id', filters.payment_id.toString());

    const { data } = await api.get<{ success: boolean; data: { data: any[] } }>(`/mpesa/transactions?${params.toString()}`);
    return Array.isArray(data.data) ? data.data : data.data.data || [];
  },

  async verifyTransaction(transactionId: number): Promise<any> {
    const { data } = await api.get<{ success: boolean; data: any }>(`/mpesa/transactions/${transactionId}/verify`);
    return data.data;
  },
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

// Notification interfaces
export interface Notification {
  id: number;
  user_id?: number | null;
  type: 'order_placed' | 'order_confirmed' | 'order_cancelled' | 'debt_warning_2days' | 'debt_warning_admin_2days' | 'debt_overdue' | 'debt_overdue_admin' | 'payment_received' | 'payment_received_admin' | 'sale_fully_paid' | 'low_stock_alert' | 'refund_processed' | 'new_product_available';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  read_at?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: number;
  user_id: number;
  type: string;
  enabled: boolean;
  push_enabled: boolean;
}

export interface DeviceToken {
  id: number;
  user_id: number;
  device_token: string;
  platform: 'ios' | 'android';
}

// Notifications API
export const notificationsApi = {
  async getNotifications(filters?: {
    unread_only?: boolean;
    per_page?: number;
  }): Promise<{ data: Notification[]; current_page: number; last_page: number; total: number }> {
    const params = new URLSearchParams();
    if (filters?.unread_only) params.append('unread_only', 'true');
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());

    const { data } = await api.get<{ success: boolean; data: { data: Notification[]; current_page: number; last_page: number; total: number } }>(`/notifications?${params.toString()}`);
    return Array.isArray(data.data) 
      ? { data: data.data, current_page: 1, last_page: 1, total: data.data.length }
      : data.data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<{ success: boolean; data: { count: number } }>('/notifications/unread-count');
    return data.data.count;
  },

  async markAsRead(notificationId: number): Promise<Notification> {
    const { data } = await api.post<{ success: boolean; data: Notification }>(`/notifications/${notificationId}/read`);
    return data.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-all-read');
  },

  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },

  async getPreferences(): Promise<NotificationPreference[]> {
    const { data } = await api.get<{ success: boolean; data: NotificationPreference[] }>('/notifications/preferences');
    return data.data;
  },

  async updatePreference(type: string, enabled?: boolean, pushEnabled?: boolean): Promise<NotificationPreference> {
    const { data } = await api.post<{ success: boolean; data: NotificationPreference }>('/notifications/preferences', {
      type,
      enabled,
      push_enabled: pushEnabled,
    });
    return data.data;
  },

  async registerDeviceToken(deviceToken: string, platform: 'ios' | 'android'): Promise<DeviceToken> {
    const { data } = await api.post<{ success: boolean; data: DeviceToken }>('/notifications/device-token', {
      device_token: deviceToken,
      platform,
    });
    return data.data;
  },

  async unregisterDeviceToken(deviceToken: string): Promise<void> {
    await api.delete('/notifications/device-token', {
      data: { device_token: deviceToken },
    });
  },
};

// Pickup Slots interfaces
export interface PickupSlotResponse {
  time: string;
  available_capacity: number;
  max_capacity: number;
  is_full: boolean;
}

export interface AvailableSlotsResponse {
  success: boolean;
  date: string;
  slots: PickupSlotResponse[];
}

// Pickup Slots API
export const pickupSlotsApi = {
  async getAvailableSlots(date: string): Promise<PickupSlotResponse[]> {
    const { data } = await api.get<AvailableSlotsResponse>(`/pickup-slots?date=${date}`);
    return data.slots;
  },

  async checkSlotAvailability(pickupTime: string): Promise<{ available: boolean; available_capacity: number }> {
    const { data} = await api.get<{ success: boolean; data: { available: boolean; available_capacity: number } }>(`/pickup-slots/check?pickup_time=${encodeURIComponent(pickupTime)}`);
    return data.data;
  },
};

// Awaiting Pickup API
export const awaitingPickupApi = {
  async getAwaitingPickupOrders(date?: string): Promise<Order[]> {
    const params = date ? `?date=${date}` : '';
    const { data } = await api.get<{ success: boolean; data: Order[] }>(`/awaiting-pickup${params}`);
    return data.data;
  },

  async verifyQrCode(qrCode: string): Promise<Order> {
    const { data } = await api.post<{ success: boolean; message: string; data: Order }>('/awaiting-pickup/verify-qr', {
      qr_code: qrCode,
    });
    return data.data;
  },

  async addPayment(orderId: number, payment: { amount: number; payment_method: 'cash' | 'card' | 'mpesa'; notes?: string }): Promise<Order> {
    const { data } = await api.post<{ success: boolean; message: string; data: { order: Order; payment: Payment } }>(`/awaiting-pickup/${orderId}/add-payment`, payment);
    return data.data.order;
  },

 async confirmPickup(orderId: number): Promise<Order> {
    const { data } = await api.post<{ success: boolean; message: string; data: Order }>(`/awaiting-pickup/${orderId}/confirm`);
    return data.data;
  },

  async cancelOrder(orderId: number, reason: string, refundToWallet?: boolean): Promise<Order> {
    const { data } = await api.post<{ success: boolean; message: string; data: Order }>(`/awaiting-pickup/${orderId}/cancel`, {
      reason,
      refund_to_wallet: refundToWallet,
    });
    return data.data;
  },

  async getOverdueOrders(): Promise<{ orders: Order[]; graceHours: number; count: number }> {
    const { data } = await api.get<{ success: boolean; data: Order[]; meta: { grace_hours: number; count: number } }>('/awaiting-pickup/overdue');
    return {
      orders: data.data,
      graceHours: data.meta.grace_hours,
      count: data.meta.count,
    };
  },
};

// Wallet API
export interface WalletTransaction {
  id: number;
  user_id: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  reference_id?: string; // e.g., order_id or sale_id
  reference_type?: string; 
  balance_after?: number;
  created_at: string;
}

export const walletApi = {
  async getTransactions(params?: { type?: 'credit' | 'debit'; date_from?: string; date_to?: string; page?: number }): Promise<{ data: WalletTransaction[]; current_page: number; last_page: number }> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.page) queryParams.append('page', params.page.toString());

    const { data } = await api.get<{ success: boolean; data: { data: WalletTransaction[]; current_page: number; last_page: number } }>(`/wallet/transactions?${queryParams.toString()}`);
    return data.data;
  },

  async getSummary(): Promise<{ current_balance: number; total_credited: number; total_spent: number }> {
    const { data } = await api.get<{ success: boolean; data: { current_balance: number; total_credited: number; total_spent: number } }>('/wallet/summary');
    return data.data;
  },
};