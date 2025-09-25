// app/(tabs)/cart.tsx
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
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function CartScreen(): React.ReactElement {
  const { state, updateItem, removeItem, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
    // Navigate to checkout flow
    router.push('/checkout' as any);
    setIsCheckingOut(false);
  };

  const renderCartItem = (item: any) => {
    const isWeightBased = item.product.kilograms && item.weight;
    const displayPrice = isWeightBased 
      ? (item.product.sale_price / (item.product.kilograms || 1)) * (item.weight || 1)
      : item.product.sale_price;

    return (
      <View key={item.id} style={styles.cartItem}>
        <View style={styles.itemImageContainer}>
          <Image
            source={{ uri: item.product.image_url || 'https://via.placeholder.com/80x80' }}
            style={styles.itemImage}
          />
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
          <Text style={styles.itemCategory}>{item.product.category_name}</Text>
          
          {isWeightBased && (
            <Text style={styles.itemWeight}>{item.weight}kg</Text>
          )}
          
          <View style={styles.itemPriceRow}>
            <Text style={styles.itemPrice}>Ksh {displayPrice.toLocaleString()}</Text>
            {!isWeightBased && item.quantity > 1 && (
              <Text style={styles.itemQuantityMultiplier}>x {item.quantity}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.itemControls}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
          
          <View style={styles.quantityControls}>
            {isWeightBased ? (
              // Weight controls
              <>
                <TouchableOpacity
                  style={[styles.quantityButton, item.weight <= 0.25 && styles.disabledButton]}
                  onPress={() => handleWeightChange(item.id, item.quantity, item.weight, -0.25)}
                  disabled={item.weight <= 0.25}
                >
                  <Minus size={14} color={item.weight <= 0.25 ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.weight}kg</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleWeightChange(item.id, item.quantity, item.weight, 0.25)}
                >
                  <Plus size={14} color="#64748B" />
                </TouchableOpacity>
              </>
            ) : (
              // Quantity controls
              <>
                <TouchableOpacity
                  style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]}
                  onPress={() => handleQuantityChange(item.id, item.quantity, -1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={14} color={item.quantity <= 1 ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(item.id, item.quantity, 1)}
                >
                  <Plus size={14} color="#64748B" />
                </TouchableOpacity>
              </>
            )}
          </View>
          
          <Text style={styles.subtotalText}>Ksh {item.subtotal.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  if (state.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        {state.items.length > 0 && (
          <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {state.items.length === 0 ? (
        /* Empty Cart State */
        <View style={styles.emptyCart}>
          <View style={styles.emptyCartIcon}>
            <ShoppingBag size={64} color="#94A3B8" />
          </View>
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtitle}>Add some items to get started</Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => router.push('/(tabs)/' as any)}
          >
            <Text style={styles.shopNowButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Cart with Items */
        <>
          {/* Cart Items */}
          <ScrollView style={styles.cartItemsContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartItemsCount}>{state.totalItems} item{state.totalItems !== 1 ? 's' : ''}</Text>
              <View style={styles.deliveryInfo}>
                <MapPin size={14} color="#22C55E" />
                <Text style={styles.deliveryText}>Pickup at shop</Text>
              </View>
            </View>
            
            <View style={styles.cartItemsList}>
              {state.items.map(renderCartItem)}
            </View>
            
            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({state.totalItems} items)</Text>
                <Text style={styles.summaryValue}>Ksh {state.totalAmount.toLocaleString()}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>Pickup at shop</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>Ksh {state.totalAmount.toLocaleString()}</Text>
              </View>
            </View>
            
            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Bottom Checkout Bar */}
          <View style={styles.checkoutBar}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabelSmall}>Total</Text>
              <Text style={styles.totalAmountLarge}>Ksh {state.totalAmount.toLocaleString()}</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.checkoutButton, isCheckingOut && styles.disabledCheckoutButton]}
              onPress={handleCheckout}
              disabled={isCheckingOut}
            >
              <CreditCard size={18} color="#FFFFFF" />
              <Text style={styles.checkoutButtonText}>
                {isCheckingOut ? 'Processing...' : 'Place Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Empty Cart
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopNowButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  shopNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Cart Items Container
  cartItemsContainer: {
    flex: 1,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartItemsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
  },

  // Cart Items
  cartItemsList: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  cartItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemImageContainer: {
    marginRight: 16,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  itemDetails: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  itemWeight: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    marginBottom: 6,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemQuantityMultiplier: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },

  // Item Controls
  itemControls: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  removeButton: {
    padding: 4,
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 2,
    marginBottom: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#F1F5F9',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: 8,
    minWidth: 35,
    textAlign: 'center',
  },
  subtotalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },

  // Order Summary
  orderSummary: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },

  // Checkout Bar
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  totalContainer: {
    flex: 1,
    marginRight: 16,
  },
  totalLabelSmall: {
    fontSize: 14,
    color: '#64748B',
  },
  totalAmountLarge: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  disabledCheckoutButton: {
    backgroundColor: '#94A3B8',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
