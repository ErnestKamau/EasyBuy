// app/checkout.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Theme } from "@/constants/Themes";
import {
  ordersApi,
  CartItemForOrder,
  pickupSlotsApi,
  PickupSlotResponse,
} from "@/services/api";
import { useAuth } from "@/app/_layout";
import { ToastService } from "@/utils/toastService";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react-native";

type PaymentMethod = "cash" | "mpesa" | "card";
type DeliveryType = "pickup" | "delivery";

export default function CheckoutScreen() {
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const { currentTheme, themeName } = useTheme();
  const isDark = themeName === "dark";
  const params = useLocalSearchParams();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("cash");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryType>(
    (params.deliveryType as DeliveryType) || "pickup",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [selectedPickupTime, setSelectedPickupTime] = useState<string | null>(
    null,
  );
  const [availableSlots, setAvailableSlots] = useState<PickupSlotResponse[]>(
    [],
  );
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load available pickup slots when delivery type is pickup
  useEffect(() => {
    if (selectedDelivery === "pickup") {
      loadPickupSlots();
    }
  }, [selectedDelivery]);

  const loadPickupSlots = async () => {
    try {
      setLoadingSlots(true);
      // Get slots for today
      const today = new Date().toISOString().split("T")[0];
      const slots = await pickupSlotsApi.getAvailableSlots(today);
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Failed to load pickup slots:", error);
      ToastService.showError("Error", "Failed to load pickup times");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    if (method === "cash" && !canUseCash) {
      ToastService.showError(
        "Payment Blocked",
        "You must clear your debt before using cash payment. Please use M-Pesa or Card.",
      );
      return;
    }
    setSelectedPayment(method);
  };

  // Debt enforcement: if user has negative balance, force M-Pesa/Card only
  const hasDebt = user && user.wallet_balance < 0;
  const canUseCash = !hasDebt;

  const handlePlaceOrder = async () => {
    if (state.items.length === 0) {
      ToastService.showError("Empty Cart", "Your cart is empty");
      return;
    }

    // Determine current user phone number - required for M-Pesa
    const phoneNumber = user?.phone_number;
    if (selectedPayment === "mpesa" && !phoneNumber) {
      ToastService.showError(
        "Phone Number Required",
        "Please update your profile with a phone number for M-Pesa payment.",
      );
      // Ideally redirect to profile or show input, but for now block
      return;
    }

    try {
      setIsProcessing(true);

      // Convert cart items to order format
      const orderItems: CartItemForOrder[] = state.items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        weight: item.weight,
      }));

      // Validate pickup time for pickup orders
      if (selectedDelivery === "pickup" && !selectedPickupTime) {
        ToastService.showError(
          "Pickup Time Required",
          "Please select a pickup time",
        );
        setIsProcessing(false);
        return;
      }

      // Create the order
      const order = await ordersApi.createOrder(
        orderItems,
        `Payment method: ${selectedPayment === "cash" ? "Cash" : selectedPayment === "mpesa" ? "M-Pesa" : "Card"}`,
        selectedPayment,
        selectedDelivery === "pickup" ? selectedPickupTime : undefined,
      );

      // Trigger STK Push if M-Pesa
      if (selectedPayment === "mpesa" && phoneNumber) {
        // Calculate amount due (accounting for wallet credit)
        const amountDue = Math.max(
          0,
          state.totalAmount - (user?.wallet_balance || 0),
        );

        if (amountDue > 0) {
          ToastService.showInfo(
            "Initiating Payment",
            "Sending M-Pesa prompt to your phone...",
          );
          // Import mpesaApi dynamically to avoid circular dependencies if any, or just use import
          const { mpesaApi } = require("@/services/api");

          const stkResponse = await mpesaApi.initiateStkPush({
            orderId: order.id,
            phoneNumber: phoneNumber,
            amount: amountDue,
          });

          if (!stkResponse.success) {
            ToastService.showError(
              "Payment Initiation Failed",
              stkResponse.message,
            );
            // Order is created but payment failed. We still clear cart and show success but warn about payment?
            // Or maybe we treat it as success since order is pending payment.
            // Continuing flow...
          } else {
            ToastService.showSuccess(
              "Prompt Sent",
              "Please enter your PIN on your phone to complete payment.",
            );
          }
        }
      }

      // Clear the cart after successful order creation
      clearCart();
      setOrderPlaced(true);

      // Determine success message based on payment method
      const successTitle =
        selectedPayment === "mpesa"
          ? "Order Placed - Check Phone"
          : "Order Placed!";
      const successMsg =
        selectedPayment === "mpesa"
          ? `Order ${order.order_number} created. Please complete payment on your phone.`
          : `Your order ${order.order_number || `#${order.id}`} has been placed successfully`;

      ToastService.showSuccess(successTitle, successMsg);

      // Navigate to success screen or back to home
      setTimeout(
        () => {
          router.replace("/(tabs)/" as any);
        },
        selectedPayment === "mpesa" ? 5000 : 3000,
      ); // Give more time to read M-Pesa msg
    } catch (error) {
      console.error("Order creation failed:", error);
      ToastService.showError(
        "Order Failed",
        "Failed to place your order. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize styles with current theme
  const styles = createStyles(currentTheme, isDark);

  if (orderPlaced) {
    return (
      <View style={styles.successContainer}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={currentTheme.surface}
        />

        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <CheckCircle size={80} color={currentTheme.success} />
          </View>

          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successMessage}>
            Your order has been received and will be prepared for pickup.
          </Text>

          <View style={styles.nextSteps}>
            <View style={styles.stepItem}>
              <Clock size={20} color={currentTheme.success} />
              <Text style={styles.stepText}>Wait for admin confirmation</Text>
            </View>
            {selectedDelivery === "pickup" ? (
              <View style={styles.stepItem}>
                <MapPin size={20} color={currentTheme.success} />
                <Text style={styles.stepText}>Visit the shop for pickup</Text>
              </View>
            ) : (
              <View style={styles.stepItem}>
                <MapPin size={20} color={currentTheme.success} />
                <Text style={styles.stepText}>
                  We'll deliver to your location
                </Text>
              </View>
            )}
            {selectedPayment !== "debt" && (
              <View style={styles.stepItem}>
                <CreditCard size={20} color={currentTheme.success} />
                <Text style={styles.stepText}>
                  {selectedPayment === "mpesa"
                    ? "Pay via M-Pesa"
                    : "Pay at the shop"}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.redirectText}>Redirecting to home...</Text>
        </View>
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
          style={styles.headerButton}
        >
          <ArrowLeft size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({state.totalItems})</Text>
            <Text style={styles.summaryValue}>
              Ksh {state.totalAmount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>
              {selectedDelivery === "pickup"
                ? "Pickup at shop"
                : "Home delivery"}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          {/* Show wallet credit if user has positive balance */}
          {user && user.wallet_balance > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Wallet Credit</Text>
                <Text
                  style={[styles.summaryValue, { color: currentTheme.success }]}
                >
                  - Ksh{" "}
                  {Math.min(
                    user.wallet_balance,
                    state.totalAmount,
                  ).toLocaleString()}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount Due</Text>
                <Text style={styles.totalValue}>
                  Ksh{" "}
                  {Math.max(
                    0,
                    state.totalAmount - user.wallet_balance,
                  ).toLocaleString()}
                </Text>
              </View>
            </>
          )}
          {/* Show total if no wallet credit */}
          {(!user || user.wallet_balance <= 0) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                Ksh {state.totalAmount.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Option */}
        <View style={styles.deliveryCard}>
          <Text style={styles.sectionTitle}>Delivery Option</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedDelivery === "pickup" && styles.selectedPaymentOption,
            ]}
            onPress={() => setSelectedDelivery("pickup")}
          >
            <View style={styles.paymentIcon}>
              <MapPin
                size={24}
                color={selectedDelivery === "pickup" ? "#22C55E" : "#64748B"}
              />
            </View>
            <View style={styles.paymentContent}>
              <Text
                style={[
                  styles.paymentTitle,
                  selectedDelivery === "pickup" && styles.selectedPaymentTitle,
                ]}
              >
                Pickup at Shop
              </Text>
              <Text style={styles.paymentDescription}>
                Visit our shop to collect your order
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedDelivery === "pickup" && styles.selectedRadioButton,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedDelivery === "delivery" && styles.selectedPaymentOption,
            ]}
            onPress={() => setSelectedDelivery("delivery")}
          >
            <View style={styles.paymentIcon}>
              <MapPin
                size={24}
                color={selectedDelivery === "delivery" ? "#22C55E" : "#64748B"}
              />
            </View>
            <View style={styles.paymentContent}>
              <Text
                style={[
                  styles.paymentTitle,
                  selectedDelivery === "delivery" &&
                    styles.selectedPaymentTitle,
                ]}
              >
                Home Delivery
              </Text>
              <Text style={styles.paymentDescription}>
                We'll deliver your order to your location
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedDelivery === "delivery" && styles.selectedRadioButton,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Pickup Time Selection (only show if pickup is selected) */}
        {selectedDelivery === "pickup" && (
          <View style={styles.deliveryCard}>
            <Text style={styles.sectionTitle}>Select Pickup Time</Text>
            <Text style={styles.paymentSubtitle}>
              Choose when you'll collect your order
            </Text>

            {loadingSlots ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="large" color={currentTheme.primary} />
                <Text
                  style={{ color: currentTheme.textSecondary, marginTop: 10 }}
                >
                  Loading available times...
                </Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Clock size={40} color={currentTheme.textSecondary} />
                <Text
                  style={{ color: currentTheme.textSecondary, marginTop: 10 }}
                >
                  No pickup slots available
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                {availableSlots.slice(0, 6).map((slot) => (
                  <TouchableOpacity
                    key={slot.time}
                    style={[
                      styles.paymentOption,
                      selectedPickupTime === slot.datetime &&
                        styles.selectedPaymentOption,
                      !slot.available && styles.disabledPaymentOption,
                    ]}
                    onPress={() => {
                      if (slot.available) {
                        setSelectedPickupTime(slot.datetime);
                      } else {
                        ToastService.showWarning(
                          "Slot Full",
                          "This time slot is fully booked",
                        );
                      }
                    }}
                    disabled={!slot.available}
                  >
                    <View style={styles.paymentIcon}>
                      <Clock
                        size={20}
                        color={
                          !slot.available
                            ? "#94A3B8"
                            : selectedPickupTime === slot.datetime
                              ? "#22C55E"
                              : "#64748B"
                        }
                      />
                    </View>
                    <View style={styles.paymentContent}>
                      <Text
                        style={[
                          styles.paymentTitle,
                          selectedPickupTime === slot.datetime &&
                            styles.selectedPaymentTitle,
                          !slot.available && styles.disabledPaymentTitle,
                        ]}
                      >
                        {slot.label}
                      </Text>
                      <Text style={styles.paymentDescription}>
                        {slot.available
                          ? `${slot.remaining} slots available`
                          : "Fully booked"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioButton,
                        selectedPickupTime === slot.datetime &&
                          styles.selectedRadioButton,
                        !slot.available && styles.disabledRadioButton,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text style={styles.paymentSubtitle}>
            {selectedPayment === "card"
              ? "Pay via Debit/Credit Card"
              : selectedPayment === "mpesa"
                ? "Pay via M-Pesa Paybill"
                : "You will pay when you collect your order"}
          </Text>

          {selectedPayment === "mpesa" && (
            <View style={styles.paybillInstructions}>
              <Text style={styles.paybillTitle}>M-Pesa Payment:</Text>
              <Text style={styles.paybillStep}>
                1. Click "Place Order" below
              </Text>
              <Text style={styles.paybillStep}>
                2. A prompt will appear on your phone
              </Text>
              <Text style={styles.paybillStep}>
                3. Enter your M-Pesa PIN to complete payment
              </Text>
              <Text
                style={[
                  styles.paybillStep,
                  { marginTop: 8, fontStyle: "italic", fontSize: 13 },
                ]}
              >
                (Phone: {user?.phone_number || "No phone number set"})
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === "cash" && styles.selectedPaymentOption,
              !canUseCash && styles.disabledPaymentOption,
            ]}
            onPress={() => handlePaymentMethodSelect("cash")}
            disabled={!canUseCash}
          >
            <View style={styles.paymentIcon}>
              <CreditCard
                size={24}
                color={
                  !canUseCash
                    ? "#94A3B8"
                    : selectedPayment === "cash"
                      ? "#22C55E"
                      : "#64748B"
                }
              />
            </View>
            <View style={styles.paymentContent}>
              <Text
                style={[
                  styles.paymentTitle,
                  selectedPayment === "cash" && styles.selectedPaymentTitle,
                  !canUseCash && styles.disabledPaymentTitle,
                ]}
              >
                Cash Payment {!canUseCash && "(Unavailable)"}
              </Text>
              <Text style={styles.paymentDescription}>
                {!canUseCash
                  ? "Clear your debt to use cash payment"
                  : "Pay with cash when you collect your order"}
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedPayment === "cash" && styles.selectedRadioButton,
                !canUseCash && styles.disabledRadioButton,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === "mpesa" && styles.selectedPaymentOption,
            ]}
            onPress={() => handlePaymentMethodSelect("mpesa")}
          >
            <View style={styles.paymentIcon}>
              <Smartphone
                size={24}
                color={selectedPayment === "mpesa" ? "#22C55E" : "#64748B"}
              />
            </View>
            <View style={styles.paymentContent}>
              <Text
                style={[
                  styles.paymentTitle,
                  selectedPayment === "mpesa" && styles.selectedPaymentTitle,
                ]}
              >
                M-Pesa Payment
              </Text>
              <Text style={styles.paymentDescription}>
                Pay via M-Pesa Paybill (542542)
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedPayment === "mpesa" && styles.selectedRadioButton,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === "card" && styles.selectedPaymentOption,
            ]}
            onPress={() => handlePaymentMethodSelect("card")}
          >
            <View style={styles.paymentIcon}>
              <CreditCard
                size={24}
                color={selectedPayment === "card" ? "#22C55E" : "#64748B"}
              />
            </View>
            <View style={styles.paymentContent}>
              <Text
                style={[
                  styles.paymentTitle,
                  selectedPayment === "card" && styles.selectedPaymentTitle,
                ]}
              >
                Card Payment
              </Text>
              <Text style={styles.paymentDescription}>
                Pay with Debit or Credit Card
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedPayment === "card" && styles.selectedRadioButton,
              ]}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabelSmall}>Total Amount</Text>
          <Text style={styles.totalAmountLarge}>
            Ksh {state.totalAmount.toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            isProcessing && styles.disabledButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={isProcessing || state.items.length === 0}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <CheckCircle size={18} color="#FFFFFF" />
          )}
          <Text style={styles.placeOrderButtonText}>
            {isProcessing ? "Placing Order..." : "Place Order"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    successContainer: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    successContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    successIcon: {
      marginBottom: 32,
    },
    successTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      marginBottom: 16,
    },
    successMessage: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 40,
      lineHeight: 24,
    },
    nextSteps: {
      width: "100%",
      marginBottom: 40,
    },
    stepItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 16,
    },
    stepText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "500",
    },
    redirectText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
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
    headerButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
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
      backgroundColor: theme.surface,
      margin: 20,
      marginBottom: 12,
      padding: 20,
      borderRadius: 12,
    },
    deliveryCard: {
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 20,
      borderRadius: 12,
    },
    paymentCard: {
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 20,
      borderRadius: 12,
    },
    noteCard: {
      backgroundColor: isDark ? "#3B2D0F" : "#FFFBEB",
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 16,
      borderRadius: 12,
      flexDirection: "row",
      gap: 12,
    },

    // Section styling
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 16,
    },

    // Summary
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.success,
    },

    // Info items
    infoItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
      gap: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    infoDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },

    // Payment options
    paymentSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 20,
    },
    paymentOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: 12,
      marginBottom: 12,
      gap: 16,
    },
    selectedPaymentOption: {
      borderColor: theme.success,
      backgroundColor: isDark ? "#1B4D2F" : "#F0FDF4",
    },
    paymentIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? theme.border : "#F8FAFC",
      justifyContent: "center",
      alignItems: "center",
    },
    paymentContent: {
      flex: 1,
    },
    paymentTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    selectedPaymentTitle: {
      color: theme.success,
    },
    paymentDescription: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    paybillInstructions: {
      backgroundColor: isDark ? "#1B4D2F" : "#F0FDF4",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.success,
    },
    paybillTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? theme.success : "#15803D",
      marginBottom: 12,
    },
    paybillStep: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    paybillHighlight: {
      fontWeight: "700",
      color: isDark ? theme.success : "#15803D",
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.border,
    },
    selectedRadioButton: {
      borderColor: theme.success,
      backgroundColor: theme.success,
    },
    disabledPaymentOption: {
      opacity: 0.5,
      backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
    },
    disabledPaymentTitle: {
      color: theme.textSecondary,
    },
    disabledRadioButton: {
      borderColor: theme.textSecondary,
      backgroundColor: "transparent",
    },

    // Note
    noteContent: {
      flex: 1,
    },
    noteTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#FCD34D" : "#92400E",
      marginBottom: 4,
    },
    noteDescription: {
      fontSize: 12,
      color: isDark ? "#FCD34D" : "#92400E",
      lineHeight: 18,
    },

    // Bottom bar
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: 34,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      shadowColor: "#000",
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
      color: theme.textSecondary,
    },
    totalAmountLarge: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
    },
    placeOrderButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.success,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 8,
    },
    disabledButton: {
      backgroundColor: theme.textSecondary,
    },
    placeOrderButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
  });
