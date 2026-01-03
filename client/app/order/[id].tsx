// app/order/[id].tsx - Order detail page
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { ordersApi, Order, Payment } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Mail,
  XCircle,
} from 'lucide-react-native';

// Helper function to create dynamic styles
const createDynamicStyles = (currentTheme: any, themeName: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: currentTheme.background,
  },
  loadingText: {
    fontSize: 16,
    color: currentTheme.textSecondary,
    marginTop: 12,
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
    flex: 1,
    marginLeft: 12,
  },
  section: {
    backgroundColor: currentTheme.surface,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: currentTheme.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: currentTheme.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: currentTheme.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: currentTheme.text,
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border + '40',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: currentTheme.border + '40',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: currentTheme.text,
    marginBottom: 4,
  },
  itemInfo: {
    fontSize: 13,
    color: currentTheme.textSecondary,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: currentTheme.primary,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: currentTheme.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: currentTheme.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: currentTheme.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: currentTheme.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: currentTheme.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: currentTheme.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: currentTheme.border,
  },
  cancelButton: {
    backgroundColor: currentTheme.error + '15',
    borderColor: currentTheme.error + '40',
  },
  supportButton: {
    backgroundColor: currentTheme.primary + '15',
    borderColor: currentTheme.primary + '40',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: currentTheme.error,
  },
  supportButtonText: {
    color: currentTheme.primary,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border + '40',
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: currentTheme.text,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: currentTheme.primary,
  },
  paymentDate: {
    fontSize: 12,
    color: currentTheme.textSecondary,
    marginTop: 2,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentTheme.surface,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: currentTheme.border,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: currentTheme.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: currentTheme.textSecondary,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: currentTheme.text,
  },
});

export default function OrderDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentTheme, themeName } = useTheme();
  const { markOrderNotificationsAsRead } = useNotifications();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const dynamicStyles = createDynamicStyles(currentTheme, themeName);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const orderData = await ordersApi.getOrderDetails(Number.parseInt(id, 10));
      setOrder(orderData);
      
      // Mark related notifications as read when viewing order
      await markOrderNotificationsAsRead(orderData.id);
    } catch (error) {
      console.error('Error fetching order details:', error);
      ToastService.showError('Error', 'Failed to load order details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;

    Alert.alert(
      'Cancel Order',
      `Are you sure you want to cancel order ${order.order_number}? This action cannot be undone.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await ordersApi.cancelOrder(order.id);
              ToastService.showSuccess('Order Cancelled', 'Your order has been cancelled successfully');
              router.back();
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
              ToastService.showError('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+254700000000');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@easybuy.com?subject=Order Inquiry - ' + (order?.order_number || ''));
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status === 'pending') {
      return {
        backgroundColor: currentTheme.warning + '20',
        color: currentTheme.warning,
      };
    } else if (status === 'confirmed') {
      return {
        backgroundColor: currentTheme.success + '20',
        color: currentTheme.success,
      };
    } else {
      return {
        backgroundColor: currentTheme.error + '20',
        color: currentTheme.error,
      };
    }
  };

  const getPaymentStatusBadgeStyle = (status: string) => {
    if (status === 'fully-paid') {
      return {
        backgroundColor: currentTheme.success + '20',
        color: currentTheme.success,
      };
    } else if (status === 'partially-paid') {
      return {
        backgroundColor: currentTheme.warning + '20',
        color: currentTheme.warning,
      };
    } else if (status === 'pending') {
      return {
        backgroundColor: currentTheme.warning + '20',
        color: currentTheme.warning,
      };
    } else if (status === 'debt') {
      return {
        backgroundColor: currentTheme.info + '20',
        color: currentTheme.info,
      };
    } else {
      return {
        backgroundColor: currentTheme.error + '20',
        color: currentTheme.error,
      };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const formatWeight = (weight: number | null | undefined): string => {
    if (!weight) return '';
    if (weight === 0) return '0KG';
    
    const whole = Math.floor(weight);
    const decimal = weight - whole;
    
    if (decimal === 0) {
      return `${whole}KG`;
    } else if (decimal === 0.5) {
      if (whole === 0) {
        return '1/2KG';
      } else {
        return `${whole} 1/2KG`;
      }
    }
    
    return `${weight}KG`;
  };

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <StatusBar 
          barStyle={themeName === 'dark' ? "light-content" : "dark-content"} 
          backgroundColor={currentTheme.surface} 
        />
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={dynamicStyles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return null;
  }

  // Calculate total from order items if total_amount is not available
  const calculateOrderTotal = () => {
    if (order.total_amount && order.total_amount > 0) {
      return order.total_amount;
    }
    // Calculate from items
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum, item) => {
        // Use subtotal if available, otherwise calculate it
        if (item.subtotal && item.subtotal > 0) {
          return sum + item.subtotal;
        }
        // Calculate subtotal from unit_price and quantity/kilogram
        if (item.kilogram) {
          return sum + (item.unit_price * item.kilogram);
        } else {
          return sum + (item.unit_price * item.quantity);
        }
      }, 0);
    }
    return 0;
  };

  const orderTotal = calculateOrderTotal();

  const statusStyle = getStatusBadgeStyle(order.order_status);
  const paymentStyle = getPaymentStatusBadgeStyle(order.payment_status);

  return (
    <View style={dynamicStyles.container}>
      <StatusBar 
        barStyle={themeName === 'dark' ? "light-content" : "dark-content"} 
        backgroundColor={currentTheme.surface} 
      />

      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Information */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Order Information</Text>
          
          <View style={dynamicStyles.infoRow}>
            <Text style={dynamicStyles.infoLabel}>Order Number</Text>
            <Text style={dynamicStyles.infoValue}>{order.order_number}</Text>
          </View>

          <View style={dynamicStyles.infoRow}>
            <Text style={dynamicStyles.infoLabel}>Date</Text>
            <Text style={dynamicStyles.infoValue}>
              {formatDate(order.order_date)} • {formatTime(order.order_time)}
            </Text>
          </View>

          <View style={dynamicStyles.infoRow}>
            <Text style={dynamicStyles.infoLabel}>Status</Text>
            <View style={[dynamicStyles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[dynamicStyles.statusBadgeText, { color: statusStyle.color }]}>
                {order.order_status}
              </Text>
            </View>
          </View>

          <View style={dynamicStyles.infoRow}>
            <Text style={dynamicStyles.infoLabel}>Payment Status</Text>
            <View style={[dynamicStyles.statusBadge, { backgroundColor: paymentStyle.backgroundColor }]}>
              <Text style={[dynamicStyles.statusBadgeText, { color: paymentStyle.color }]}>
                {order.payment_status}
              </Text>
            </View>
          </View>

          {order.order_status === 'pending' && (
            <View style={[dynamicStyles.infoRow, { marginTop: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Clock size={14} color={currentTheme.warning} />
                <Text style={[dynamicStyles.infoLabel, { marginLeft: 6 }]}>Awaiting Approval</Text>
              </View>
            </View>
          )}

          {order.notes && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: currentTheme.border + '40' }}>
              <Text style={[dynamicStyles.infoLabel, { marginBottom: 4 }]}>Notes</Text>
              <Text style={[dynamicStyles.infoValue, { textAlign: 'left' }]}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Order Items</Text>
            {order.items.map((item) => (
              <View key={item.id} style={dynamicStyles.orderItem}>
                <Image
                  source={{ uri: item.product?.image_url || 'https://via.placeholder.com/60x60' }}
                  style={dynamicStyles.itemImage}
                />
                <View style={dynamicStyles.itemDetails}>
                  <Text style={dynamicStyles.itemName}>{item.product?.name || 'Product'}</Text>
                  {item.kilogram ? (
                    <Text style={dynamicStyles.itemInfo}>
                      {formatWeight(item.kilogram)} • Ksh {item.unit_price?.toLocaleString()}/kg
                    </Text>
                  ) : (
                    <Text style={dynamicStyles.itemInfo}>
                      Qty: {item.quantity} • Ksh {item.unit_price?.toLocaleString()}/unit
                    </Text>
                  )}
                  <Text style={dynamicStyles.itemPrice}>
                    Ksh {(() => {
                      // Calculate item subtotal if not available
                      if (item.subtotal && item.subtotal > 0) {
                        return item.subtotal.toLocaleString();
                      }
                      // Calculate from unit_price and quantity/kilogram
                      const unitPrice = item.unit_price || 0;
                      if (item.kilogram && item.kilogram > 0) {
                        return (unitPrice * item.kilogram).toLocaleString();
                      } else if (item.quantity && item.quantity > 0) {
                        return (unitPrice * item.quantity).toLocaleString();
                      }
                      return '0';
                    })()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Order Summary */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Order Summary</Text>
          
          <View style={dynamicStyles.summaryRow}>
            <Text style={dynamicStyles.summaryLabel}>Subtotal</Text>
            <Text style={dynamicStyles.summaryValue}>
              Ksh {orderTotal.toLocaleString()}
            </Text>
          </View>

          <View style={dynamicStyles.totalRow}>
            <Text style={dynamicStyles.totalLabel}>Total</Text>
            <Text style={dynamicStyles.totalValue}>
              Ksh {orderTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Sale Information (if confirmed) */}
        {order.sale && order.order_status === 'confirmed' && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Sale Information</Text>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Sale Number</Text>
              <Text style={dynamicStyles.infoValue}>{order.sale.sale_number}</Text>
            </View>

            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Total Amount</Text>
              <Text style={dynamicStyles.infoValue}>
                Ksh {order.sale.total_amount?.toLocaleString()}
              </Text>
            </View>

            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Payment Status</Text>
              <Text style={dynamicStyles.infoValue}>
                {order.sale.payment_status?.replace('-', ' ').toUpperCase()}
              </Text>
            </View>

            {order.sale.total_paid > 0 && (
              <View style={dynamicStyles.infoRow}>
                <Text style={dynamicStyles.infoLabel}>Total Paid</Text>
                <Text style={dynamicStyles.infoValue}>
                  Ksh {order.sale.total_paid?.toLocaleString()}
                </Text>
              </View>
            )}

            {order.sale.balance > 0 && (
              <View style={dynamicStyles.infoRow}>
                <Text style={dynamicStyles.infoLabel}>Balance</Text>
                <Text style={[dynamicStyles.infoValue, { color: currentTheme.warning }]}>
                  Ksh {order.sale.balance?.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Payment History */}
        {order.sale?.payments && order.sale.payments.length > 0 && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Payment History</Text>
            {order.sale.payments.map((payment: Payment) => (
              <View key={payment.id} style={dynamicStyles.paymentItem}>
                <View style={{ flex: 1 }}>
                  <Text style={dynamicStyles.paymentMethod}>
                    {payment.payment_method?.toUpperCase()} Payment
                  </Text>
                  <Text style={dynamicStyles.paymentDate}>
                    {new Date(payment.paid_at).toLocaleDateString()} • {payment.status}
                  </Text>
                </View>
                <Text style={dynamicStyles.paymentAmount}>
                  Ksh {payment.amount?.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Delivery/Pickup Information */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Delivery Information</Text>
          
          <View style={dynamicStyles.infoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MapPin size={16} color={currentTheme.textSecondary} />
              <Text style={[dynamicStyles.infoLabel, { marginLeft: 8 }]}>Type</Text>
            </View>
            <Text style={dynamicStyles.infoValue}>Pickup at Shop</Text>
          </View>

          <View style={[dynamicStyles.infoRow, { marginTop: 8 }]}>
            <Text style={dynamicStyles.infoLabel}>Status</Text>
            <Text style={dynamicStyles.infoValue}>
              {order.order_status === 'confirmed' ? 'Ready for Pickup' : 'Pending Confirmation'}
            </Text>
          </View>
        </View>

        {/* Contact Support */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Need Help?</Text>
          
          <TouchableOpacity
            style={[dynamicStyles.contactCard, dynamicStyles.supportButton]}
            onPress={handleCallSupport}
          >
            <View style={dynamicStyles.contactIcon}>
              <Phone size={20} color={currentTheme.primary} />
            </View>
            <View style={dynamicStyles.contactInfo}>
              <Text style={dynamicStyles.contactLabel}>Phone</Text>
              <Text style={dynamicStyles.contactValue}>+254 700 000 000</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[dynamicStyles.contactCard, dynamicStyles.supportButton]}
            onPress={handleEmailSupport}
          >
            <View style={dynamicStyles.contactIcon}>
              <Mail size={20} color={currentTheme.primary} />
            </View>
            <View style={dynamicStyles.contactInfo}>
              <Text style={dynamicStyles.contactLabel}>Email</Text>
              <Text style={dynamicStyles.contactValue}>support@easybuy.com</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Cancel Order Button (only for pending orders) */}
        {order.order_status === 'pending' && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
            <TouchableOpacity
              style={[dynamicStyles.actionButton, dynamicStyles.cancelButton]}
              onPress={handleCancelOrder}
            >
              <XCircle size={20} color={currentTheme.error} />
              <Text style={[dynamicStyles.actionButtonText, dynamicStyles.cancelButtonText]}>
                Cancel Order
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}
