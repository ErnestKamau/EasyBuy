// app/awaiting-pickup.tsx - Admin screen for managing orders ready for pickup
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/app/_layout";
import { useTheme } from "@/contexts/ThemeContext";
import { Theme } from "@/constants/Themes";
import { awaitingPickupApi, Order } from "@/services/api";
import { ToastService } from "@/utils/toastService";
import {
  ArrowLeft,
  QrCode,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Smartphone,
  Ban,
} from "lucide-react-native";

// Note: You'll need to install expo-barcode-scanner for QR functionality
// Run: npx expo install expo-barcode-scanner

export default function AwaitingPickupScreen() {
  const { user } = useAuth();
  const { currentTheme, themeName } = useTheme();
  const isDark = themeName === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modals
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "cash" as "cash" | "card" | "mpesa",
    notes: "",
  });

  const styles = createStyles(currentTheme, isDark);

  useEffect(() => {
    if (user?.role !== "admin") {
      ToastService.showError("Access Denied", "Admin access required");
      router.back();
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await awaitingPickupApi.getAwaitingPickupOrders();
      setOrders(data);
    } catch (error) {
      ToastService.showApiError(error, "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleQrScan = async (qrCode: string) => {
    try {
      const order = await awaitingPickupApi.verifyQrCode(qrCode);
      setSelectedOrder(order);
      setShowQrScanner(false);
      ToastService.showSuccess(
        "QR Verified",
        `Order ${order.order_number} verified`,
      );
    } catch (error) {
      ToastService.showApiError(error, "Invalid QR code");
    }
  };

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    const balance = order.total_amount - (order.sale?.total_paid || 0);
    setPaymentForm({
      amount: balance.toFixed(2),
      paymentMethod: "cash",
      notes: "",
    });
    setShowPaymentModal(true);
  };

  const addPayment = async () => {
    if (!selectedOrder) return;

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      ToastService.showError("Invalid Amount", "Please enter a valid amount");
      return;
    }

    try {
      const updatedOrder = await awaitingPickupApi.addPayment(
        selectedOrder.id,
        {
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.paymentMethod,
          notes: paymentForm.notes || undefined,
        },
      );

      setSelectedOrder(updatedOrder);
      setShowPaymentModal(false);
      ToastService.showSuccess(
        "Payment Added",
        "Payment recorded successfully",
      );
      loadOrders();
    } catch (error) {
      ToastService.showApiError(error, "Failed to add payment");
    }
  };

  const confirmPickup = async () => {
    if (!selectedOrder) return;

    try {
      await awaitingPickupApi.confirmPickup(selectedOrder.id);
      setShowConfirmModal(false);
      setSelectedOrder(null);
      ToastService.showSuccess(
        "Pickup Confirmed",
        "Order completed successfully",
      );
      loadOrders();
    } catch (error) {
      ToastService.showApiError(error, "Failed to confirm pickup");
    }
  };

  const cancelOrder = async () => {
    if (!selectedOrder) return;

    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? Payments will be refunded to wallet.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: async () => {
            try {
              await awaitingPickupApi.cancelOrder(
                selectedOrder.id,
                "Cancelled by admin",
                true, // refund to wallet
              );
              setSelectedOrder(null);
              ToastService.showSuccess(
                "Order Cancelled",
                "Order cancelled and refunded",
              );
              loadOrders();
            } catch (error) {
              ToastService.showApiError(error, "Failed to cancel order");
            }
          },
        },
      ],
    );
  };

  const renderOrderCard = (order: Order) => {
    const pickupTime = order.pickup_time ? new Date(order.pickup_time) : null;
    const isOverdue = pickupTime && pickupTime < new Date();
    const balance = order.total_amount - (order.sale?.total_paid || 0);
    const isPaid = balance <= 0;

    return (
      <TouchableOpacity
        key={order.id}
        style={[styles.orderCard, isOverdue && styles.overdueCard]}
        onPress={() => setSelectedOrder(order)}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{order.order_number}</Text>
            <Text style={styles.customerName}>
              {order.user?.first_name} {order.user?.last_name}
            </Text>
          </View>
          {isOverdue && (
            <View style={styles.overdueBadge}>
              <AlertTriangle size={16} color="#EF4444" />
              <Text style={styles.overdueText}>OVERDUE</Text>
            </View>
          )}
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Clock size={16} color={currentTheme.textSecondary} />
            <Text style={styles.detailText}>
              {pickupTime?.toLocaleString() || "Not set"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <DollarSign size={16} color={currentTheme.textSecondary} />
            <Text style={styles.detailText}>
              Total: KES {order.total_amount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <CreditCard size={16} color={currentTheme.textSecondary} />
            <Text style={styles.detailText}>
              Paid: KES {(order.sale?.total_paid || 0).toLocaleString()}
            </Text>
          </View>

          {!isPaid && (
            <View style={[styles.detailRow, styles.balanceRow]}>
              <Text style={styles.balanceLabel}>Balance:</Text>
              <Text style={styles.balanceAmount}>
                KES {balance.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.paymentButton]}
            onPress={() => openPaymentModal(order)}
          >
            <DollarSign size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => {
              setSelectedOrder(order);
              setShowConfirmModal(true);
            }}
          >
            <CheckCircle size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.surface}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Awaiting Pickup</Text>
        <TouchableOpacity
          onPress={() => setShowQrScanner(true)}
          style={styles.qrButton}
        >
          <QrCode size={24} color={currentTheme.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {orders.filter((o) => new Date(o.pickup_time!) < new Date()).length}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color={currentTheme.textSecondary} />
            <Text style={styles.emptyTitle}>No Orders Awaiting Pickup</Text>
            <Text style={styles.emptySubtitle}>
              Orders ready for pickup will appear here
            </Text>
          </View>
        ) : (
          orders.map(renderOrderCard)
        )}
      </ScrollView>

      {/* QR Scanner Modal - Placeholder */}
      <Modal visible={showQrScanner} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.modalTitle}>QR Scanner</Text>
            <Text style={styles.modalSubtitle}>
              Install expo-barcode-scanner to enable QR scanning
            </Text>
            <TextInput
              style={styles.qrInput}
              placeholder="Or enter QR code manually"
              placeholderTextColor={currentTheme.textSecondary}
              onSubmitEditing={(e) => handleQrScan(e.nativeEvent.text)}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQrScanner(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Payment</Text>

            {selectedOrder && (
              <View style={styles.orderSummary}>
                <Text style={styles.summaryText}>
                  Order: {selectedOrder.order_number}
                </Text>
                <Text style={styles.summaryText}>
                  Balance: KES{" "}
                  {(
                    selectedOrder.total_amount -
                    (selectedOrder.sale?.total_paid || 0)
                  ).toLocaleString()}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Amount (KES)</Text>
            <TextInput
              style={styles.input}
              value={paymentForm.amount}
              onChangeText={(text) =>
                setPaymentForm({ ...paymentForm, amount: text })
              }
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={currentTheme.textSecondary}
            />

            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {(["cash", "mpesa", "card"] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodButton,
                    paymentForm.paymentMethod === method &&
                      styles.methodButtonActive,
                  ]}
                  onPress={() =>
                    setPaymentForm({ ...paymentForm, paymentMethod: method })
                  }
                >
                  <Text
                    style={[
                      styles.methodText,
                      paymentForm.paymentMethod === method &&
                        styles.methodTextActive,
                    ]}
                  >
                    {method.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={paymentForm.notes}
              onChangeText={(text) =>
                setPaymentForm({ ...paymentForm, notes: text })
              }
              placeholder="Payment notes..."
              placeholderTextColor={currentTheme.textSecondary}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={addPayment}
              >
                <Text style={styles.submitButtonText}>Add Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Pickup Modal */}
      <Modal visible={showConfirmModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <CheckCircle size={64} color={currentTheme.success} />
            <Text style={styles.confirmTitle}>Confirm Pickup?</Text>

            {selectedOrder && (
              <View style={styles.confirmDetails}>
                <Text style={styles.confirmText}>
                  Order: {selectedOrder.order_number}
                </Text>
                <Text style={styles.confirmText}>
                  Customer: {selectedOrder.user?.first_name}{" "}
                  {selectedOrder.user?.last_name}
                </Text>
                <Text style={styles.confirmText}>
                  Total: KES {selectedOrder.total_amount.toLocaleString()}
                </Text>
                <Text style={styles.confirmText}>
                  Paid: KES{" "}
                  {(selectedOrder.sale?.total_paid || 0).toLocaleString()}
                </Text>
              </View>
            )}

            <Text style={styles.confirmWarning}>
              This will finalize the sale and adjust the customer's wallet
              balance if needed.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmActionButton, styles.confirmCancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmActionButton, styles.confirmSubmitButton]}
                onPress={confirmPickup}
              >
                <Text style={styles.confirmSubmitText}>Confirm Pickup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.textSecondary,
    },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingTop: 60,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    qrButton: {
      padding: 4,
    },

    // Stats
    statsContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    statValue: {
      fontSize: 32,
      fontWeight: "800",
      color: theme.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },

    // Scroll
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },

    // Empty State
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
    },

    // Order Card
    orderCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    overdueCard: {
      borderColor: "#EF4444",
      borderWidth: 2,
    },
    orderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    orderNumber: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 4,
    },
    customerName: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    overdueBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FEE2E2",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 4,
    },
    overdueText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#EF4444",
    },

    orderDetails: {
      gap: 8,
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    detailText: {
      fontSize: 14,
      color: theme.text,
    },
    balanceRow: {
      justifyContent: "space-between",
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    balanceLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    balanceAmount: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.error,
    },

    orderActions: {
      flexDirection: "row",
      gap: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 8,
      gap: 6,
    },
    paymentButton: {
      backgroundColor: theme.primary,
    },
    confirmButton: {
      backgroundColor: theme.success,
    },
    actionButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 24,
      width: "100%",
      maxWidth: 400,
    },
    qrModalContent: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 24,
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
    },
    confirmModalContent: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 24,
      width: "100%",
      maxWidth: 400,
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 16,
    },
    modalSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 16,
    },

    orderSummary: {
      backgroundColor: theme.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    summaryText: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 4,
    },

    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    qrInput: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      width: "100%",
      marginBottom: 16,
    },

    paymentMethods: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
    },
    methodButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: "center",
    },
    methodButtonActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + "20",
    },
    methodText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    methodTextActive: {
      color: theme.primary,
    },

    modalActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    submitButton: {
      backgroundColor: theme.primary,
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    closeButton: {
      backgroundColor: theme.textSecondary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    closeButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },

    // Confirm Modal
    confirmTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
      marginTop: 16,
      marginBottom: 16,
    },
    confirmDetails: {
      width: "100%",
      backgroundColor: theme.background,
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
    },
    confirmText: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 4,
    },
    confirmWarning: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    confirmActions: {
      flexDirection: "row",
      width: "100%",
      gap: 12,
    },
    confirmActionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    confirmCancelButton: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    confirmCancelText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    confirmSubmitButton: {
      backgroundColor: theme.success,
    },
    confirmSubmitText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
  });
