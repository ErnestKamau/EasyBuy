// app/checkout.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { ordersApi, CartItemForOrder } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react-native';

type PaymentMethod = 'cash' | 'mpesa';

export default function CheckoutScreen() {
  const { state, clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handlePlaceOrder = async () => {
    if (state.items.length === 0) {
      ToastService.showError('Empty Cart', 'Your cart is empty');
      return;
    }

    try {
      setIsProcessing(true);

      // Convert cart items to order format
      const orderItems: CartItemForOrder[] = state.items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        weight: item.weight,
      }));

      // Create the order
      const order = await ordersApi.createOrder(
        orderItems,
        `Payment method: ${selectedPayment === 'cash' ? 'Cash' : 'M-Pesa'}`
      );

      // Clear the cart after successful order creation
      clearCart();
      setOrderPlaced(true);

      ToastService.showSuccess(
        'Order Placed!',
        `Your order #${order.id} has been placed successfully`
      );

      // Navigate to success screen or back to home
      setTimeout(() => {
        router.replace('/(tabs)/' as any);
      }, 3000);

    } catch (error) {
      console.error('Order creation failed:', error);
      ToastService.showError('Order Failed', 'Failed to place your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPayment(method);
  };

  if (orderPlaced) {
    return (
      <View style={styles.successContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <CheckCircle size={80} color="#22C55E" />
          </View>
          
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successMessage}>
            Your order has been received and will be prepared for pickup.
          </Text>
          
          <View style={styles.nextSteps}>
            <View style={styles.stepItem}>
              <Clock size={20} color="#22C55E" />
              <Text style={styles.stepText}>Wait for admin confirmation</Text>
            </View>
            <View style={styles.stepItem}>
              <MapPin size={20} color="#22C55E" />
              <Text style={styles.stepText}>Visit the shop for pickup</Text>
            </View>
            <View style={styles.stepItem}>
              <CreditCard size={20} color="#22C55E" />
              <Text style={styles.stepText}>Pay at the shop</Text>
            </View>
          </View>
          
          <Text style={styles.redirectText}>Redirecting to home...</Text>
        </View>
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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({state.totalItems})</Text>
            <Text style={styles.summaryValue}>Ksh {state.totalAmount.toLocaleString()}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>Pickup at shop</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Ksh {state.totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.deliveryCard}>
          <Text style={styles.sectionTitle}>Pickup Information</Text>
          
          <View style={styles.infoItem}>
            <MapPin size={20} color="#22C55E" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Shop Location</Text>
              <Text style={styles.infoDescription}>Visit our shop to collect your order</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Clock size={20} color="#22C55E" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Preparation Time</Text>
              <Text style={styles.infoDescription}>Your order will be ready shortly after confirmation</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text style={styles.paymentSubtitle}>You will pay when you arrive at the shop</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'cash' && styles.selectedPaymentOption
            ]}
            onPress={() => handlePaymentMethodSelect('cash')}
          >
            <View style={styles.paymentIcon}>
              <CreditCard size={24} color={selectedPayment === 'cash' ? '#22C55E' : '#64748B'} />
            </View>
            <View style={styles.paymentContent}>
              <Text style={[
                styles.paymentTitle,
                selectedPayment === 'cash' && styles.selectedPaymentTitle
              ]}>
                Cash Payment
              </Text>
              <Text style={styles.paymentDescription}>
                Pay with cash when you collect your order
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              selectedPayment === 'cash' && styles.selectedRadioButton
            ]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'mpesa' && styles.selectedPaymentOption
            ]}
            onPress={() => handlePaymentMethodSelect('mpesa')}
          >
            <View style={styles.paymentIcon}>
              <Smartphone size={24} color={selectedPayment === 'mpesa' ? '#22C55E' : '#64748B'} />
            </View>
            <View style={styles.paymentContent}>
              <Text style={[
                styles.paymentTitle,
                selectedPayment === 'mpesa' && styles.selectedPaymentTitle
              ]}>
                M-Pesa Payment
              </Text>
              <Text style={styles.paymentDescription}>
                Pay via M-Pesa STK push at the shop
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              selectedPayment === 'mpesa' && styles.selectedRadioButton
            ]} />
          </TouchableOpacity>
        </View>

        {/* Important Note */}
        <View style={styles.noteCard}>
          <AlertTriangle size={20} color="#F59E0B" />
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>Important Note</Text>
            <Text style={styles.noteDescription}>
              This is a pickup order. Please visit our shop to collect and pay for your items after admin confirmation.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabelSmall}>Total Amount</Text>
          <Text style={styles.totalAmountLarge}>Ksh {state.totalAmount.toLocaleString()}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.placeOrderButton, isProcessing && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={isProcessing || state.items.length === 0}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <CheckCircle size={18} color="#FFFFFF" />
          )}
          <Text style={styles.placeOrderButtonText}>
            {isProcessing ? 'Placing Order...' : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  nextSteps: {
    width: '100%',
    marginBottom: 40,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  redirectText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
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
  headerPlaceholder: {
    width: 32,
  },

  // Content
  scrollContainer: {
    flex: 1,
  },
  
  // Cards
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
  },
  noteCard: {
    backgroundColor: '#FFFBEB',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
  },

  // Section styling
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  
  // Summary
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
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

  // Info items
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // Payment options
  paymentSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  selectedPaymentOption: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentContent: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  selectedPaymentTitle: {
    color: '#22C55E',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  selectedRadioButton: {
    borderColor: '#22C55E',
    backgroundColor: '#22C55E',
  },

  // Note
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  noteDescription: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },

  // Bottom bar
  bottomBar: {
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
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
