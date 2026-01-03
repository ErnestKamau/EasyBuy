// app/(tabs)/cart.tsx - Theme-integrated version
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ToastService } from '@/utils/toastService';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  MapPin,
  Clock,
  Truck,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

// Helper function to create dynamic styles
const createDynamicStyles = (currentTheme: any, themeName: string) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    loadingText: {
      fontSize: 16,
      color: currentTheme.textSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingTop: 60,
      backgroundColor: currentTheme.surface,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: themeName === 'dark' ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: themeName === 'dark' ? 8 : 2,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: currentTheme.text,
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.error,
    },
    emptyCartIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: currentTheme.border + '40',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyCartTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: currentTheme.text,
      marginBottom: 8,
    },
    emptyCartSubtitle: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
    },
    shopNowButton: {
      backgroundColor: currentTheme.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
    },
    shopNowButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    cartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: currentTheme.surface,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    cartItemsCount: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
    },
    deliveryText: {
      fontSize: 14,
      color: currentTheme.primary,
      fontWeight: '500',
    },
    cartItemsList: {
      backgroundColor: currentTheme.surface,
      paddingVertical: 8,
    },
    cartItem: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border + '40',
    },
    itemImage: {
      width: 64,
      height: 64,
      borderRadius: 8,
      backgroundColor: currentTheme.border + '40',
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 4,
    },
    itemCategory: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginBottom: 4,
    },
    itemWeight: {
      fontSize: 12,
      color: currentTheme.primary,
      fontWeight: '600',
      marginBottom: 6,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
    },
    itemQuantityMultiplier: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginLeft: 4,
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.background,
      borderRadius: 8,
      padding: 2,
      marginBottom: 8,
    },
    quantityButton: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: currentTheme.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: themeName === 'dark' ? 0.2 : 0.05,
      shadowRadius: 2,
      elevation: themeName === 'dark' ? 3 : 1,
      borderWidth: themeName === 'dark' ? 1 : 0,
      borderColor: themeName === 'dark' ? currentTheme.border : 'transparent',
    },
    disabledButton: {
      backgroundColor: currentTheme.background,
      shadowOpacity: 0,
      elevation: 0,
    },
    quantityText: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
      marginHorizontal: 8,
      minWidth: 35,
      textAlign: 'center',
    },
    subtotalText: {
      fontSize: 14,
      fontWeight: '700',
      color: currentTheme.primary,
    },
    orderSummary: {
      backgroundColor: currentTheme.surface,
      marginTop: 8,
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderWidth: themeName === 'dark' ? 1 : 0,
      borderColor: themeName === 'dark' ? currentTheme.border : 'transparent',
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: currentTheme.text,
      marginBottom: 16,
    },
    summaryLabel: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '500',
      color: currentTheme.text,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: currentTheme.border,
      marginVertical: 12,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: currentTheme.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: '700',
      color: currentTheme.primary,
    },
    checkoutBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: 34,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: themeName === 'dark' ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: themeName === 'dark' ? 15 : 8,
    },
    totalLabelSmall: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    totalAmountLarge: {
      fontSize: 20,
      fontWeight: '800',
      color: currentTheme.text,
    },
    checkoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 8,
      shadowColor: currentTheme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    disabledCheckoutButton: {
      backgroundColor: currentTheme.textSecondary,
      shadowOpacity: 0,
      elevation: 0,
    },
    checkoutButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
});

// Helper function for quantity changes
const useCartHandlers = (state: any, updateItem: any, removeItem: any, clearCart: any, setIsCheckingOut: any) => {
  const handleQuantityChange = (itemId: string, currentQuantity: number, change: number, weight?: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      updateItem(itemId, newQuantity, weight);
    }
  };

  const handleWeightChange = (itemId: string, currentQuantity: number, currentWeight: number, change: number) => {
    const newWeight = Math.max(0.25, currentWeight + change);
    updateItem(itemId, currentQuantity, newWeight);
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeItem(itemId);
            ToastService.showSuccess('Removed', 'Item removed from cart');
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearCart();
            ToastService.showSuccess('Cart Cleared', 'All items removed from cart');
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (state.items.length === 0) {
      ToastService.showError('Empty Cart', 'Please add items to your cart before checkout');
      return;
    }
    
    setIsCheckingOut(true);
    // Note: router is accessed from the global scope within the component
    // This function will be used within the CartScreen component context
    setIsCheckingOut(false);
  };

  return { handleQuantityChange, handleWeightChange, handleRemoveItem, handleClearCart };
};

export default function CartScreen(): React.ReactElement {
  const { state, updateItem, removeItem, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const { currentTheme, themeName } = useTheme();

  // Dynamic styles based on theme
  const dynamicStyles = createDynamicStyles(currentTheme, themeName);
  
  // Cart handlers
  const cartHandlers = useCartHandlers(state, updateItem, removeItem, clearCart, setIsCheckingOut);
  
  // Override handleCheckout to use local router
  const handleCheckout = () => {
    if (state.items.length === 0) {
      ToastService.showError('Empty Cart', 'Please add items to your cart before checkout');
      return;
    }
    
    setIsCheckingOut(true);
    router.push({
      pathname: '/checkout',
      params: { deliveryType: deliveryType }
    } as any);
    setIsCheckingOut(false);
  };
  
  const { handleQuantityChange, handleWeightChange, handleRemoveItem, handleClearCart } = cartHandlers;

  const renderCartItem = (item: any) => {
    const isWeightBased = item.product.kilograms_in_stock && item.weight;
    const displayPrice = isWeightBased 
      ? item.product.sale_price * (item.weight || 1) // sale_price is price per kg
      : item.product.sale_price;

    return (
      <View key={item.id} style={dynamicStyles.cartItem}>
        <View style={styles.itemImageContainer}>
          <Image
            source={{ uri: item.product.image_url || 'https://via.placeholder.com/80x80' }}
            style={dynamicStyles.itemImage}
          />
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={dynamicStyles.itemName} numberOfLines={2}>{item.product.name}</Text>
          <Text style={dynamicStyles.itemCategory}>{item.product.category_name}</Text>
          
          {isWeightBased && (
            <Text style={dynamicStyles.itemWeight}>{item.weight}kg</Text>
          )}
          
          <View style={styles.itemPriceRow}>
            <Text style={dynamicStyles.itemPrice}>Ksh {displayPrice.toLocaleString()}</Text>
            {!isWeightBased && item.quantity > 1 && (
              <Text style={dynamicStyles.itemQuantityMultiplier}>x {item.quantity}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.itemControls}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}
          >
            <Trash2 size={16} color={currentTheme.error} />
          </TouchableOpacity>
          
          <View style={dynamicStyles.quantityControls}>
            {isWeightBased ? (
              <>
                <TouchableOpacity
                  style={[dynamicStyles.quantityButton, item.weight <= 0.25 && dynamicStyles.disabledButton]}
                  onPress={() => handleWeightChange(item.id, item.quantity, item.weight, -0.25)}
                  disabled={item.weight <= 0.25}
                >
                  <Minus size={14} color={item.weight <= 0.25 ? currentTheme.textSecondary : currentTheme.text} />
                </TouchableOpacity>
                <Text style={dynamicStyles.quantityText}>{item.weight}kg</Text>
                <TouchableOpacity
                  style={dynamicStyles.quantityButton}
                  onPress={() => handleWeightChange(item.id, item.quantity, item.weight, 0.25)}
                >
                  <Plus size={14} color={currentTheme.text} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[dynamicStyles.quantityButton, item.quantity <= 1 && dynamicStyles.disabledButton]}
                  onPress={() => handleQuantityChange(item.id, item.quantity, -1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} color={item.quantity <= 1 ? currentTheme.textSecondary : currentTheme.text} />
                </TouchableOpacity>
                <Text style={dynamicStyles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={dynamicStyles.quantityButton}
                  onPress={() => handleQuantityChange(item.id, item.quantity, 1)}
                >
                  <Plus size={14} color={currentTheme.text} />
                </TouchableOpacity>
              </>
            )}
          </View>
          
          <Text style={dynamicStyles.subtotalText}>Ksh {item.subtotal.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  if (state.isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={dynamicStyles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <StatusBar 
        barStyle={themeName === 'dark' ? "light-content" : "dark-content"} 
        backgroundColor={currentTheme.surface} 
      />
      
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>My Cart</Text>
        {state.items.length > 0 && (
          <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
            <Text style={dynamicStyles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {state.items.length === 0 ? (
        <View style={styles.emptyCart}>
          <View style={dynamicStyles.emptyCartIcon}>
            <ShoppingBag size={64} color={currentTheme.textSecondary} />
          </View>
          <Text style={dynamicStyles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={dynamicStyles.emptyCartSubtitle}>Add some items to get started</Text>
          <TouchableOpacity
            style={dynamicStyles.shopNowButton}
            onPress={() => router.push('/(tabs)/' as any)}
          >
            <Text style={dynamicStyles.shopNowButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.cartItemsContainer} showsVerticalScrollIndicator={false}>
            <View style={dynamicStyles.cartHeader}>
              <Text style={dynamicStyles.cartItemsCount}>
                {state.totalItems} item{state.totalItems !== 1 ? 's' : ''}
              </Text>
              <View style={styles.deliveryOptions}>
                <TouchableOpacity
                  style={[
                    styles.deliveryOption,
                    deliveryType === 'pickup' && { backgroundColor: currentTheme.primary + '20', borderColor: currentTheme.primary }
                  ]}
                  onPress={() => setDeliveryType('pickup')}
                >
                  <MapPin size={14} color={deliveryType === 'pickup' ? currentTheme.primary : currentTheme.textSecondary} />
                  <Text style={[
                    dynamicStyles.deliveryText,
                    deliveryType === 'pickup' && { color: currentTheme.primary, fontWeight: '600' }
                  ]}>Pickup</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deliveryOption,
                    deliveryType === 'delivery' && { backgroundColor: currentTheme.primary + '20', borderColor: currentTheme.primary }
                  ]}
                  onPress={() => setDeliveryType('delivery')}
                >
                  <Truck size={14} color={deliveryType === 'delivery' ? currentTheme.primary : currentTheme.textSecondary} />
                  <Text style={[
                    dynamicStyles.deliveryText,
                    deliveryType === 'delivery' && { color: currentTheme.primary, fontWeight: '600' }
                  ]}>Delivery</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={dynamicStyles.cartItemsList}>
              {state.items.map(renderCartItem)}
            </View>
            
            <View style={dynamicStyles.orderSummary}>
              <Text style={dynamicStyles.summaryTitle}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={dynamicStyles.summaryLabel}>Subtotal ({state.totalItems} items)</Text>
                <Text style={dynamicStyles.summaryValue}>Ksh {state.totalAmount.toLocaleString()}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={dynamicStyles.summaryLabel}>Delivery</Text>
                <Text style={dynamicStyles.summaryValue}>{deliveryType === 'pickup' ? 'Pickup at shop' : 'Home delivery'}</Text>
              </View>
              
              <View style={dynamicStyles.summaryDivider} />
              
              <View style={styles.summaryRow}>
                <Text style={dynamicStyles.totalLabel}>Total</Text>
                <Text style={dynamicStyles.totalValue}>Ksh {state.totalAmount.toLocaleString()}</Text>
              </View>
            </View>
            
            <View style={styles.bottomSpacing} />
          </ScrollView>

          <View style={dynamicStyles.checkoutBar}>
            <View style={styles.totalContainer}>
              <Text style={dynamicStyles.totalLabelSmall}>Total</Text>
              <Text style={dynamicStyles.totalAmountLarge}>Ksh {state.totalAmount.toLocaleString()}</Text>
            </View>
            
            <TouchableOpacity
              style={[dynamicStyles.checkoutButton, isCheckingOut && dynamicStyles.disabledCheckoutButton]}
              onPress={handleCheckout}
              disabled={isCheckingOut}
            >
              <CreditCard size={18} color="#FFFFFF" />
              <Text style={dynamicStyles.checkoutButtonText}>
                {isCheckingOut ? 'Processing...' : 'Place Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// Static styles that don't change with theme
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cartItemsContainer: {
    flex: 1,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  itemImageContainer: {
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
    marginRight: 16,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemControls: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  removeButton: {
    padding: 4,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  totalContainer: {
    flex: 1,
    marginRight: 16,
  },
});
