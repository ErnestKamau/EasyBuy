// contexts/CartContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/services/api';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  weight?: number; // For kilogram-based products
  subtotal: number;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  isLoading: boolean;
}

type CartAction =
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number; weight?: number } }
  | { type: 'UPDATE_ITEM'; payload: { id: string; quantity: number; weight?: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  isLoading: false,
};

const calculateSubtotal = (product: Product, quantity: number, weight?: number): number => {
  if (product.kilograms && weight) {
    // For weight-based products, calculate based on selected weight
    const pricePerKg = product.sale_price / (product.kilograms || 1);
    return pricePerKg * weight;
  }
  return product.sale_price * quantity;
};

const generateCartItemId = (productId: number, weight?: number): string => {
  return weight ? `${productId}-${weight}` : `${productId}`;
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOAD_CART': {
      const items = action.payload;
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      return { ...state, items, totalItems, totalAmount, isLoading: false };
    }

    case 'ADD_ITEM': {
      const { product, quantity, weight } = action.payload;
      const itemId = generateCartItemId(product.id, weight);
      
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(item => item.id === itemId);
      
      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = state.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + quantity;
            const newWeight = weight || item.weight;
            return {
              ...item,
              quantity: newQuantity,
              weight: newWeight,
              subtotal: calculateSubtotal(product, newQuantity, newWeight),
            };
          }
          return item;
        });
      } else {
        // Add new item
        const subtotal = calculateSubtotal(product, quantity, weight);
        const newItem: CartItem = {
          id: itemId,
          product,
          quantity,
          weight,
          subtotal,
        };
        newItems = [...state.items, newItem];
      }

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = newItems.reduce((sum, item) => sum + item.subtotal, 0);

      return { ...state, items: newItems, totalItems, totalAmount };
    }

    case 'UPDATE_ITEM': {
      const { id, quantity, weight } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        const newItems = state.items.filter(item => item.id !== id);
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        return { ...state, items: newItems, totalItems, totalAmount };
      }

      const newItems = state.items.map(item => {
        if (item.id === id) {
          const newWeight = weight !== undefined ? weight : item.weight;
          return {
            ...item,
            quantity,
            weight: newWeight,
            subtotal: calculateSubtotal(item.product, quantity, newWeight),
          };
        }
        return item;
      });

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = newItems.reduce((sum, item) => sum + item.subtotal, 0);

      return { ...state, items: newItems, totalItems, totalAmount };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = newItems.reduce((sum, item) => sum + item.subtotal, 0);

      return { ...state, items: newItems, totalItems, totalAmount };
    }

    case 'CLEAR_CART':
      return { ...state, items: [], totalItems: 0, totalAmount: 0 };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity: number, weight?: number) => void;
  updateItem: (id: string, quantity: number, weight?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getItemCount: (productId: number, weight?: number) => number;
  isItemInCart: (productId: number, weight?: number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'easybuy_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from storage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    if (state.items.length > 0 || state.totalItems === 0) {
      saveCart();
    }
  }, [state.items, state.totalItems]);

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        const items: CartItem[] = JSON.parse(cartData);
        dispatch({ type: 'LOAD_CART', payload: items });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addItem = (product: Product, quantity: number, weight?: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, weight } });
  };

  const updateItem = (id: string, quantity: number, weight?: number) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { id, quantity, weight } });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemCount = (productId: number, weight?: number): number => {
    const itemId = generateCartItemId(productId, weight);
    const item = state.items.find(item => item.id === itemId);
    return item?.quantity || 0;
  };

  const isItemInCart = (productId: number, weight?: number): boolean => {
    return getItemCount(productId, weight) > 0;
  };

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      getItemCount,
      isItemInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
