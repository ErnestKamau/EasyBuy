import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Order } from "@/services/api";
import { CheckCircle, CreditCard } from "lucide-react-native";

interface OrdersManagementProps {
  readonly pendingOrders: ReadonlyArray<Order>;
  readonly onConfirmOrder: (orderId: number) => void;
  readonly onInitiatePayment: (order: Order) => void;
  readonly loading: boolean;
}

export default function OrdersManagement({
  pendingOrders,
  onConfirmOrder,
  onInitiatePayment,
  loading,
}: OrdersManagementProps) {
  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Pending Orders</Text>
      {pendingOrders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>Order #{order.id}</Text>
            <Text style={styles.orderStatus}>{order.status}</Text>
          </View>

          <View style={styles.orderDetails}>
            <Text>Customer: {order.customer_name}</Text>
            <Text>Phone: {order.customer_phone}</Text>
            <Text>Total: KES {order.total_amount}</Text>
            <Text>Payment Status: {order.payment_status ?? "PENDING"}</Text>
          </View>

          <View style={styles.orderItems}>
            <Text style={styles.itemsTitle}>Items:</Text>
            {order.items?.map((item) => (
              <Text key={item.id} style={styles.item}>
                {item.product_name} x {item.quantity} - KES {item.subtotal}
              </Text>
            ))}
          </View>

          <View style={styles.actionButtons}>
            {order.payment_status === "PENDING" && (
              <TouchableOpacity
                style={[styles.button, styles.paymentButton]}
                onPress={() => onInitiatePayment(order)}
              >
                <CreditCard size={20} color="#fff" />
                <Text style={styles.buttonText}>Request Payment</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={() => onConfirmOrder(order.id)}
            >
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.buttonText}>Confirm Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  orderStatus: {
    fontSize: 14,
    color: "#666",
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  item: {
    marginLeft: 8,
    marginBottom: 4,
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    gap: 8,
  },
  paymentButton: {
    backgroundColor: "#2563eb",
  },
  confirmButton: {
    backgroundColor: "#059669",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
