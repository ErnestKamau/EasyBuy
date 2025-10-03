// services/api.ts
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000";

console.log('API Base URL:', BASE_URL);

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

// Request interceptor - adds auth token to every request
api.interceptors.request.use(async (config) => {
  const token = await tokenManager.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  };
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
        console.error("Token Refresh Error:", refreshError)
        await tokenManager.clearTokens();
        router.replace('/auth');
      }
    }

    let rejectionError;
    if (error instanceof Error) {
      rejectionError = error;
    } else if (typeof error === 'string') {
      rejectionError = new Error(error);
    } else {
      rejectionError = new Error(JSON.stringify(error));
    }
    return Promise.reject(rejectionError);
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

    // Validate response shape to avoid "cannot read property 'access' of undefined"
    const tokens = (data as any)?.tokens;
    if (!tokens?.access || !tokens?.refresh) {
      const backendMsg = (data as any)?.error || (data as any)?.detail || 'Invalid login response from server';
      throw new Error(backendMsg);
    }

    await tokenManager.setTokens(tokens.access, tokens.refresh);
    return data;
  },


  async logout(): Promise<void> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (refreshToken) {
        await api.post("/auth/logout/", {
          refresh: refreshToken
        });
      }
    } catch (error) {
      console.error("Logout API error (non-critical):", error);
    } finally {
      await tokenManager.clearTokens();
      router.replace('/auth');
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
      console.error("Token refresh error:", error);
      await tokenManager.clearTokens();
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await tokenManager.getAccessToken();
      if (!token) {
        console.log("No access token found, skipping getCurrentUser");
        return null;
      }

      const { data } = await api.get<User>("/auth/me/");
      return data;
    } catch (error) {
      console.log("Failed to fetch current user:", error);
      return null;
    }
  },
};

export const productsApi = {
  async getCategories(): Promise<Category[]> {
    const token = await tokenManager.getAccessToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    
    const { data } = await api.get<{results: Category[]} | Category[]>("/categories/");
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
    
    const { data } = await api.get<{results: Product[]} | Product[]>(`/products/?${params.toString()}`);
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
  items?: OrderItem[];
}

export interface CartItemForOrder {
  product_id: number;
  quantity: number;
  weight?: number;
}

// Orders API
export const ordersApi = {
  async createOrder(items: CartItemForOrder[], notes?: string): Promise<Order> {
    const { data } = await api.post('/orders/create/', {
      items,
      notes: notes || ''
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