// app/awaiting-pickup.tsx - Admin screen for managing orders ready for pickup
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Alert,
  RefreshControl,
  StatusBar,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { awaitingPickupApi, Order } from "@/services/api";
import { ToastService } from "@/utils/toastService";
import {
  ArrowLeft,
  QrCode,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
} from "lucide-react-native";
import { AppTheme } from "@/design";
import {
  Text,
  Surface,
  Card,
  Button,
  IconButton,
  Input,
  TextArea,
  Chip,
  EmptyState,
  SkeletonList,
  Modal as UIModal,
} from "@/components/ui";

export default function AwaitingPickupScreen() {
  const { user } = useAuth();
  const theme = useAppTheme();
  const isDark = theme.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modals
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [manualQrCode, setManualQrCode] = useState("");

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "cash" as "cash" | "card" | "mpesa",
    notes: "",
  });

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
    if (!qrCode) return;
    try {
      const order = await awaitingPickupApi.verifyQrCode(qrCode);
      setSelectedOrder(order);
      setShowQrScanner(false);
      setManualQrCode("");
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

    if (!paymentForm.amount || Number.parseFloat(paymentForm.amount) <= 0) {
      ToastService.showError("Invalid Amount", "Please enter a valid amount");
      return;
    }

    try {
      const updatedOrder = await awaitingPickupApi.addPayment(
        selectedOrder.id,
        {
          amount: Number.parseFloat(paymentForm.amount),
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.surface}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing[6],
            paddingVertical: theme.spacing[5],
            backgroundColor: theme.colors.surface,
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <IconButton
          icon={<ArrowLeft size={theme.iconSize.lg} color={theme.colors.text} />}
          onPress={() => router.back()}
          accessibilityLabel="Back"
        />
        <Text variant="title">Awaiting Pickup</Text>
        <IconButton
          icon={<QrCode size={theme.iconSize.lg} color={theme.colors.primary} />}
          onPress={() => {
            setManualQrCode("");
            setShowQrScanner(true);
          }}
          accessibilityLabel="Scan QR code"
        />
      </View>

      {/* Stats */}
      <View
        style={[
          styles.statsContainer,
          { paddingHorizontal: theme.spacing[6], paddingVertical: theme.spacing[5], gap: theme.spacing[4] },
        ]}
      >
        <Surface variant="elevated" padding={5} radius="md" style={styles.statCard}>
          <Text variant="h1" color="brand">
            {orders.length}
          </Text>
          <Text variant="bodySmall" color="secondary">
            Total Orders
          </Text>
        </Surface>
        <Surface variant="elevated" padding={5} radius="md" style={styles.statCard}>
          <Text variant="h1" color="brand">
            {orders.filter((o) => new Date(o.pickup_time!) < new Date()).length}
          </Text>
          <Text variant="bodySmall" color="secondary">
            Overdue
          </Text>
        </Surface>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={{ paddingHorizontal: theme.spacing[6] }}>
          <SkeletonList count={4} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, paddingHorizontal: theme.spacing[6] }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {orders.length === 0 ? (
            <EmptyState
              title="No Orders Awaiting Pickup"
              message="Orders ready for pickup will appear here"
            />
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                theme={theme}
                onPress={() => setSelectedOrder(order)}
                onPay={() => openPaymentModal(order)}
                onRequestConfirm={() => {
                  setSelectedOrder(order);
                  setShowConfirmModal(true);
                }}
              />
            ))
          )}
          <View style={{ height: theme.spacing[8] }} />
        </ScrollView>
      )}

      {/* QR Scanner Modal - Placeholder */}
      <UIModal
        visible={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        title="QR Scanner"
        primaryAction={{ label: "Verify", onPress: () => handleQrScan(manualQrCode) }}
        secondaryAction={{ label: "Close", onPress: () => setShowQrScanner(false) }}
      >
        <Text variant="body" color="secondary" style={{ textAlign: "center" }}>
          Install expo-barcode-scanner to enable QR scanning
        </Text>
        <Input
          placeholder="Or enter QR code manually"
          value={manualQrCode}
          onChangeText={setManualQrCode}
          onSubmitEditing={() => handleQrScan(manualQrCode)}
        />
      </UIModal>

      {/* Payment Modal */}
      <UIModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Add Payment"
        primaryAction={{ label: "Add Payment", onPress: addPayment }}
        secondaryAction={{ label: "Cancel", onPress: () => setShowPaymentModal(false) }}
      >
        {selectedOrder && (
          <Surface
            variant="filled"
            padding={4}
            radius="sm"
            style={{ backgroundColor: theme.colors.backgroundSecondary }}
          >
            <Text variant="body">Order: {selectedOrder.order_number}</Text>
            <Text variant="body">
              Balance: KES{" "}
              {(
                selectedOrder.total_amount -
                (selectedOrder.sale?.total_paid || 0)
              ).toLocaleString()}
            </Text>
          </Surface>
        )}

        <Input
          label="Amount (KES)"
          value={paymentForm.amount}
          onChangeText={(text) =>
            setPaymentForm({ ...paymentForm, amount: text })
          }
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <View style={{ gap: theme.spacing[2] }}>
          <Text variant="label" color="secondary">
            Payment Method
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing[3] }}>
            {(["cash", "mpesa", "card"] as const).map((method) => (
              <Chip
                key={method}
                label={method.toUpperCase()}
                selected={paymentForm.paymentMethod === method}
                onPress={() =>
                  setPaymentForm({ ...paymentForm, paymentMethod: method })
                }
              />
            ))}
          </View>
        </View>

        <TextArea
          label="Notes (Optional)"
          value={paymentForm.notes}
          onChangeText={(text) =>
            setPaymentForm({ ...paymentForm, notes: text })
          }
          placeholder="Payment notes..."
        />
      </UIModal>

      {/* Confirm Pickup Modal */}
      <UIModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Pickup?"
        primaryAction={{ label: "Confirm Pickup", onPress: confirmPickup }}
        secondaryAction={{ label: "Cancel", onPress: () => setShowConfirmModal(false) }}
      >
        <View
          style={{
            alignSelf: "center",
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: theme.colors.successMuted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle size={48} color={theme.colors.success} strokeWidth={2} />
        </View>

        {selectedOrder && (
          <Surface
            variant="filled"
            padding={4}
            radius="sm"
            style={{ backgroundColor: theme.colors.backgroundSecondary, gap: theme.spacing[1] }}
          >
            <Text variant="body">Order: {selectedOrder.order_number}</Text>
            <Text variant="body">
              Customer: {selectedOrder.user?.first_name}{" "}
              {selectedOrder.user?.last_name}
            </Text>
            <Text variant="body">
              Total: KES {selectedOrder.total_amount.toLocaleString()}
            </Text>
            <Text variant="body">
              Paid: KES {(selectedOrder.sale?.total_paid || 0).toLocaleString()}
            </Text>
          </Surface>
        )}

        <Text variant="bodySmall" color="secondary" style={{ textAlign: "center" }}>
          This will finalize the sale and adjust the customer's wallet balance
          if needed.
        </Text>
      </UIModal>
    </View>
  );
}

const OrderCard = ({
  order,
  theme,
  onPress,
  onPay,
  onRequestConfirm,
}: {
  order: Order;
  theme: AppTheme;
  onPress: () => void;
  onPay: () => void;
  onRequestConfirm: () => void;
}) => {
  const pickupTime = order.pickup_time ? new Date(order.pickup_time) : null;
  const isOverdue = pickupTime && pickupTime < new Date();
  const balance = order.total_amount - (order.sale?.total_paid || 0);
  const isPaid = balance <= 0;

  return (
    <Card
      onPress={onPress}
      radius="md"
      style={[
        { marginBottom: theme.spacing[4] },
        isOverdue && { borderWidth: 1.5, borderColor: theme.colors.error },
      ]}
    >
      <View style={[styles.orderHeader, { marginBottom: theme.spacing[4] }]}>
        <View>
          <Text variant="title">{order.order_number}</Text>
          <Text variant="bodySmall" color="secondary">
            {order.user?.first_name} {order.user?.last_name}
          </Text>
        </View>
        {isOverdue && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing[1],
              backgroundColor: theme.colors.dangerMuted,
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[1],
              borderRadius: theme.radius.sm,
            }}
          >
            <AlertTriangle size={14} color={theme.colors.error} />
            <Text variant="caption" style={{ color: theme.colors.error, fontWeight: "700" }}>
              OVERDUE
            </Text>
          </View>
        )}
      </View>

      <View style={{ gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
        <View style={styles.detailRow}>
          <Clock size={16} color={theme.colors.textSecondary} />
          <Text variant="body">{pickupTime?.toLocaleString() || "Not set"}</Text>
        </View>

        <View style={styles.detailRow}>
          <DollarSign size={16} color={theme.colors.textSecondary} />
          <Text variant="body">
            Total: KES {order.total_amount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <CreditCard size={16} color={theme.colors.textSecondary} />
          <Text variant="body">
            Paid: KES {(order.sale?.total_paid || 0).toLocaleString()}
          </Text>
        </View>

        {!isPaid && (
          <View
            style={[
              styles.detailRow,
              {
                justifyContent: "space-between",
                paddingTop: theme.spacing[3],
                borderTopWidth: StyleSheet.hairlineWidth * 2,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <Text variant="label">Balance:</Text>
            <Text variant="title" style={{ color: theme.colors.error }}>
              KES {balance.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing[3] }}>
        <Button
          title="Add Payment"
          variant="secondary"
          onPress={onPay}
          leftIcon={<DollarSign size={18} color={theme.colors.primary} />}
          style={{ flex: 1 }}
        />
        <Button
          title="Confirm"
          variant="primary"
          onPress={onRequestConfirm}
          leftIcon={<CheckCircle size={18} color={theme.colors.textOnPrimary} />}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
};

// Layout-only styles (no theme colors — token-driven values are applied inline)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsContainer: {
    flexDirection: "row",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
