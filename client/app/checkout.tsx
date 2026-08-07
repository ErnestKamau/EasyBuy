// app/checkout.tsx
import React, { useState, useEffect, useRef } from "react";
import * as ExpoLocation from "expo-location";
import {
  View,
  ScrollView,
  StatusBar,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { router, useLocalSearchParams } from "expo-router";
import { useCart } from "@/contexts/CartContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import {
  ordersApi,
  CartItemForOrder,
  pickupSlotsApi,
  PickupSlotResponse,
  mpesaApi,
  stripeApi,
} from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { ToastService } from "@/utils/toastService";
import { useStripe } from "@/components/stripeNative";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react-native";
import { AppTheme } from "@/design";
import {
  Text,
  Surface,
  Button,
  IconButton,
  SegmentedControl,
  Chip,
  ListItem,
  KeyValueRow,
  Divider,
  Spinner,
  Modal as UIModal,
  SheetStatus,
  ReceiptTicket,
} from "@/components/ui";

type PaymentMethod = "cash" | "mpesa" | "card";
type DeliveryType = "pickup" | "delivery";

export default function CheckoutScreen() {
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const theme = useAppTheme();
  const isDark = theme.mode === "dark";
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const params = useLocalSearchParams();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("cash");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryType>(
    (params.deliveryType as DeliveryType) || "pickup",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null);
  const [sheetStatus, setSheetStatus] = useState<'processing' | 'success' | 'error' | null>(null);
  const [selectedPickupTime, setSelectedPickupTime] = useState<string | null>(
    null,
  );
  const [availableSlots, setAvailableSlots] = useState<PickupSlotResponse[]>(
    [],
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [tempSelectedTime, setTempSelectedTime] = useState<string | null>(null);

  // M-Pesa payment polling state
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(
    null,
  );
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "failed" | null
  >(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingCountRef = useRef(0);

  // Delivery-specific state
  const [deliveryLocation, setDeliveryLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [deliveryFee] = useState(150); // Standard fee, could be fetched from API

  // Map Picker State
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempMapLocation, setTempMapLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Default Map Region (e.g. initial coords before GPS)
  const defaultRegion = {
    latitude: -1.2921, // Defaulting loosely to Nairobi if unavailable
    longitude: 36.8219,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Load available pickup slots when delivery type is pickup
  useEffect(() => {
    if (selectedDelivery === "pickup") {
      loadPickupSlots();
    }
  }, [selectedDelivery]);

  // Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  const fetchLocation = async () => {
    try {
      setIsFetchingLocation(true);
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        ToastService.showError(
          "Permission Denied",
          "Permission to access location was denied",
        );
        return;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({});
      setDeliveryLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Simple reverse geocoding to get a string address
      const [address] = await ExpoLocation.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const formattedAddress = `${address.name ? address.name + ", " : ""}${address.street ? address.street + ", " : ""}${address.city || ""}`;
        setDeliveryAddress(formattedAddress.trim().replace(/,$/, ""));
      }
    } catch (error) {
      console.error("Failed to fetch location:", error);
      ToastService.showError("Error", "Failed to get current location");
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const openMapPicker = async () => {
    // If we don't have a starting location, try to get one
    if (!deliveryLocation) {
      try {
        const { status } =
          await ExpoLocation.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await ExpoLocation.getCurrentPositionAsync({});
          setTempMapLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } else {
          setTempMapLocation({
            latitude: defaultRegion.latitude,
            longitude: defaultRegion.longitude,
          });
        }
      } catch (e) {
        setTempMapLocation({
          latitude: defaultRegion.latitude,
          longitude: defaultRegion.longitude,
        });
      }
    } else {
      setTempMapLocation({ ...deliveryLocation });
    }
    setShowMapModal(true);
  };

  const handleConfirmMapLocation = async () => {
    if (!tempMapLocation) {
      setShowMapModal(false);
      return;
    }

    setDeliveryLocation(tempMapLocation);
    setIsReverseGeocoding(true);
    try {
      const [address] = await ExpoLocation.reverseGeocodeAsync({
        latitude: tempMapLocation.latitude,
        longitude: tempMapLocation.longitude,
      });

      if (address) {
        const formattedAddress = `${address.name ? address.name + ", " : ""}${address.street ? address.street + ", " : ""}${address.city || ""}`;
        setDeliveryAddress(formattedAddress.trim().replace(/,$/, ""));
      } else {
        setDeliveryAddress("Selected on map");
      }
    } catch (e) {
      console.error("Geocoding failed:", e);
      setDeliveryAddress("Selected on map");
    } finally {
      setIsReverseGeocoding(false);
      setShowMapModal(false);
    }
  };

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

  const pollPaymentStatus = async (requestId: string) => {
    if (pollingCountRef.current >= 30) {
      // Timeout after 30 attempts (60 seconds with 2s intervals)
      setPaymentPolling(false);
      ToastService.showError(
        "Payment Timeout",
        "Please check your M-Pesa app to confirm payment status",
      );
      // Don't redirect - let user manually check
      return;
    }

    try {
      pollingCountRef.current += 1;
      const result = await mpesaApi.queryStkStatus(requestId);

      if (result.success && result.data) {
        const status = result.data.status;

        if (status === "success") {
          setPaymentStatus("success");
          setPaymentPolling(false);
          pollingCountRef.current = 0;
          ToastService.showSuccess(
            "Payment Successful",
            "Your payment has been processed",
          );
          // Payment is captured in callback, order is ready
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 2000);
          return;
        } else if (status === "failed") {
          setPaymentStatus("failed");
          setPaymentPolling(false);
          pollingCountRef.current = 0;
          ToastService.showError(
            "Payment Failed",
            result.data.result_desc || "Payment was not successful",
          );
          return;
        }
        // Still pending, continue polling
      }

      // Continue polling after 2 seconds
      pollingTimeoutRef.current = setTimeout(() => {
        pollPaymentStatus(requestId);
      }, 2000) as any;
    } catch (error) {
      console.error("Polling error:", error);
      // Continue polling even on error
      pollingTimeoutRef.current = setTimeout(() => {
        pollPaymentStatus(requestId);
      }, 3000) as any;
    }
  };

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

      // Validate delivery location for delivery orders
      if (
        selectedDelivery === "delivery" &&
        (!deliveryLocation || !deliveryAddress)
      ) {
        ToastService.showError(
          "Location Required",
          "Please set your delivery location",
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
        selectedDelivery === "delivery" && deliveryLocation
          ? {
              latitude: deliveryLocation.latitude,
              longitude: deliveryLocation.longitude,
              address: deliveryAddress,
              delivery_fee: deliveryFee,
            }
          : undefined,
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
            // Start polling for payment status
            const reqId = stkResponse.data?.checkout_request_id;
            if (reqId) {
              setCheckoutRequestId(reqId);
              setPaymentPolling(true);
              pollingCountRef.current = 0;

              ToastService.showSuccess(
                "Prompt Sent",
                "Please enter your PIN on your phone to complete payment.",
              );

              // Start polling immediately
              pollPaymentStatus(reqId);
            }
          }
        }
      }

      // Card: Stripe Payment Sheet
      if (selectedPayment === "card") {
        const amountDue = Math.max(
          0,
          state.totalAmount - (user?.wallet_balance || 0),
        );

        if (amountDue > 0) {
          ToastService.showInfo(
            "Card Payment",
            "Opening secure payment sheet...",
          );

          const intentResponse = await stripeApi.createIntent({
            orderId: order.id,
            amount: amountDue,
          });

          if (!intentResponse.success || !intentResponse.data?.client_secret) {
            ToastService.showError(
              "Payment Failed",
              intentResponse.message || "Could not start card payment",
            );
            setIsProcessing(false);
            return;
          }

          const { error: initError } = await initPaymentSheet({
            merchantDisplayName: "EasyBuy",
            paymentIntentClientSecret: intentResponse.data.client_secret,
            allowsDelayedPaymentMethods: false,
            returnURL: "easybuy://stripe-redirect",
          });

          if (initError) {
            ToastService.showError(
              "Payment Failed",
              initError.message || "Could not initialize payment sheet",
            );
            setIsProcessing(false);
            return;
          }

          const { error: presentError } = await presentPaymentSheet();

          if (presentError) {
            if (presentError.code !== "Canceled") {
              ToastService.showError(
                "Payment Failed",
                presentError.message || "Card payment was not completed",
              );
            }
            setIsProcessing(false);
            return;
          }

          // Optimistic confirm — webhook remains source of truth
          await stripeApi.confirmPayment(intentResponse.data.payment_intent_id);

          ToastService.showSuccess(
            "Payment Successful",
            "Your card payment has been processed",
          );
        }
      }

      // Clear the cart after successful order creation
      clearCart();
      setOrderPlaced(true);
      setPlacedOrderNumber(order.order_number || `#${order.id}`);
      setSheetStatus(selectedPayment === "mpesa" ? "processing" : "success");

      // Determine success message based on payment method
      const successTitle =
        selectedPayment === "mpesa"
          ? "Order Placed - Check Phone"
          : selectedPayment === "card"
            ? "Order Paid!"
            : "Order Placed!";
      const successMsg =
        selectedPayment === "mpesa"
          ? `Order ${order.order_number} created. Please complete payment on your phone.`
          : selectedPayment === "card"
            ? `Order ${order.order_number || `#${order.id}`} paid successfully`
            : `Your order ${order.order_number || `#${order.id}`} has been placed successfully`;

      ToastService.showSuccess(successTitle, successMsg);

      // Navigate to success screen or back to home
      setTimeout(
        () => {
          router.replace("/(tabs)");
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

  if (orderPlaced) {
    return (
      <View style={[styles.successContainer, { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing[6] }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.surface}
        />
        <ReceiptTicket
          title={paymentPolling ? "Almost there" : "Thank you!"}
          subtitle={
            paymentPolling
              ? "Complete payment on your phone"
              : "Your order has been confirmed"
          }
          rows={[
            { label: "Order", value: placedOrderNumber || "—" },
            { label: "Fulfillment", value: selectedDelivery === "pickup" ? "Pickup" : "Delivery" },
            { label: "Payment", value: selectedPayment.toUpperCase() },
          ]}
          barcodeValue={placedOrderNumber || undefined}
        />
        <Button
          title="Back to home"
          onPress={() => router.replace("/(tabs)")}
          fullWidth
          style={{ marginTop: theme.spacing[4] }}
        />
        <SheetStatus
          visible={sheetStatus != null}
          status={sheetStatus === "error" ? "error" : paymentPolling || sheetStatus === "processing" ? "processing" : "success"}
          title={
            paymentPolling || sheetStatus === "processing"
              ? "Processing..."
              : "Success!"
          }
          message={
            paymentPolling
              ? "Complete the payment on your phone"
              : "Your order was placed successfully"
          }
          onClose={() => setSheetStatus(null)}
          onAction={() => {
            setSheetStatus(null);
            router.replace("/(tabs)");
          }}
        />
      </View>
    );
  }

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
        <Text variant="title">Checkout</Text>
        <View style={{ width: theme.touchTarget }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <Surface
          variant="elevated"
          padding={6}
          radius="lg"
          style={{ margin: theme.spacing[6], marginBottom: theme.spacing[4] }}
        >
          <Text variant="title" style={{ marginBottom: theme.spacing[3] }}>
            Order Summary
          </Text>

          <KeyValueRow
            label={`Items (${state.totalItems})`}
            value={`Ksh ${state.totalAmount.toLocaleString()}`}
          />
          <KeyValueRow
            label="Delivery"
            value={selectedDelivery === "pickup" ? "Pickup at shop" : "Delivery"}
          />
          {selectedDelivery === "delivery" && (
            <KeyValueRow
              label="Delivery Fee"
              value={`Ksh ${deliveryFee.toLocaleString()}`}
            />
          )}

          <Divider style={{ marginVertical: theme.spacing[3] }} />

          {user && user.wallet_balance > 0 ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: theme.spacing[2],
                }}
              >
                <Text variant="caption" color="muted" style={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Wallet Credit
                </Text>
                <Text variant="body" color="success">
                  - Ksh {Math.min(user.wallet_balance, state.totalAmount).toLocaleString()}
                </Text>
              </View>
              <KeyValueRow
                label="Amount Due"
                value={`Ksh ${Math.max(
                  0,
                  state.totalAmount +
                    (selectedDelivery === "delivery" ? deliveryFee : 0) -
                    user.wallet_balance,
                ).toLocaleString()}`}
                emphasize
              />
            </>
          ) : (
            <KeyValueRow
              label="Total"
              value={`Ksh ${(
                state.totalAmount + (selectedDelivery === "delivery" ? deliveryFee : 0)
              ).toLocaleString()}`}
              emphasize
            />
          )}
        </Surface>

        {/* Delivery Option */}
        <Surface
          variant="elevated"
          padding={6}
          radius="lg"
          style={{ marginHorizontal: theme.spacing[6], marginBottom: theme.spacing[4] }}
        >
          <Text variant="title" style={{ marginBottom: theme.spacing[4] }}>
            Delivery Option
          </Text>
          <SegmentedControl
            options={[
              { value: "pickup", label: "Pickup at Shop" },
              { value: "delivery", label: "Delivery" },
            ]}
            value={selectedDelivery}
            onChange={(v) => setSelectedDelivery(v as DeliveryType)}
          />
          <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.spacing[3] }}>
            {selectedDelivery === "pickup"
              ? "Visit our shop to collect your order"
              : "We'll deliver your order to your location"}
          </Text>
        </Surface>

        {/* Delivery Address (only show if delivery is selected) */}
        {selectedDelivery === "delivery" && (
          <Surface
            variant="elevated"
            padding={6}
            radius="lg"
            style={{ marginHorizontal: theme.spacing[6], marginBottom: theme.spacing[4] }}
          >
            <Text variant="title" style={{ marginBottom: theme.spacing[2] }}>
              Delivery Address
            </Text>
            <Text variant="bodySmall" color="secondary" style={{ marginBottom: theme.spacing[3] }}>
              Where should we deliver your order?
            </Text>

            <ListItem
              title={deliveryLocation ? "Location Set" : "Detect My Location"}
              subtitle={deliveryAddress || "Tap to use your current GPS location"}
              icon={
                isFetchingLocation ? (
                  <Spinner />
                ) : (
                  <MapPin
                    size={22}
                    color={deliveryLocation ? theme.colors.primary : theme.colors.textSecondary}
                  />
                )
              }
              onPress={isFetchingLocation ? undefined : fetchLocation}
            />

            <ListItem
              title="Choose Location on Map"
              subtitle="Pinpoint your exact delivery address"
              icon={<MapPin size={22} color={theme.colors.primary} />}
              onPress={openMapPicker}
            />

            {deliveryLocation && (
              <View
                style={{
                  marginTop: theme.spacing[2],
                  padding: theme.spacing[3],
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderRadius: theme.radius.sm,
                }}
              >
                <Text variant="caption" color="secondary" style={{ fontFamily: "monospace" }}>
                  Lat: {deliveryLocation.latitude.toFixed(6)}, Lng:{" "}
                  {deliveryLocation.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </Surface>
        )}

        {/* Pickup Time Selection (only show if pickup is selected) */}
        {selectedDelivery === "pickup" && (
          <Surface
            variant="elevated"
            padding={6}
            radius="lg"
            style={{ marginHorizontal: theme.spacing[6], marginBottom: theme.spacing[4] }}
          >
            <Text variant="title" style={{ marginBottom: theme.spacing[2] }}>
              Select Pickup Time
            </Text>
            <Text variant="bodySmall" color="secondary" style={{ marginBottom: theme.spacing[3] }}>
              Choose when you'll collect your order
            </Text>

            {loadingSlots ? (
              <View style={{ paddingVertical: theme.spacing[6], alignItems: "center" }}>
                <Spinner size="large" />
                <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.spacing[3] }}>
                  Loading available times...
                </Text>
              </View>
            ) : !availableSlots || availableSlots.length === 0 ? (
              <View style={{ paddingVertical: theme.spacing[6], alignItems: "center" }}>
                <Clock size={40} color={theme.colors.textSecondary} />
                <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.spacing[3] }}>
                  No pickup slots available
                </Text>
              </View>
            ) : (
              <ListItem
                title={
                  selectedPickupTime
                    ? availableSlots.find((s) => s.datetime === selectedPickupTime)?.label ||
                      "Time Selected"
                    : "Select Pickup Time"
                }
                subtitle={selectedPickupTime ? "Tap to change" : "Choose from available times"}
                icon={
                  <Clock
                    size={22}
                    color={selectedPickupTime ? theme.colors.primary : theme.colors.textSecondary}
                  />
                }
                onPress={() => {
                  setTempSelectedTime(selectedPickupTime);
                  setShowPickupModal(true);
                }}
              />
            )}
          </Surface>
        )}

        {/* Payment Method */}
        <Surface
          variant="elevated"
          padding={6}
          radius="lg"
          style={{ marginHorizontal: theme.spacing[6], marginBottom: theme.spacing[6] }}
        >
          <Text variant="title" style={{ marginBottom: theme.spacing[2] }}>
            Payment Method
          </Text>
          <Text variant="bodySmall" color="secondary" style={{ marginBottom: theme.spacing[4] }}>
            {selectedPayment === "card"
              ? "Pay via Debit/Credit Card"
              : selectedPayment === "mpesa"
                ? "Pay via M-Pesa Paybill"
                : "You will pay when you collect your order"}
          </Text>

          {selectedPayment === "mpesa" && (
            <Surface
              variant="filled"
              padding={4}
              radius="md"
              style={{ backgroundColor: theme.colors.successMuted, marginBottom: theme.spacing[4], gap: theme.spacing[2] }}
            >
              <Text variant="label" style={{ color: theme.colors.success }}>
                M-Pesa Payment:
              </Text>
              <Text variant="bodySmall">1. Click "Place Order" below</Text>
              <Text variant="bodySmall">2. A prompt will appear on your phone</Text>
              <Text variant="bodySmall">3. Enter your M-Pesa PIN to complete payment</Text>
              <Text variant="caption" color="secondary" style={{ fontStyle: "italic", marginTop: theme.spacing[1] }}>
                (Phone: {user?.phone_number || "No phone number set"})
              </Text>
            </Surface>
          )}

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[3] }}>
            <View style={{ opacity: canUseCash ? 1 : 0.5 }}>
              <Chip
                label="Cash"
                selected={selectedPayment === "cash"}
                onPress={() => handlePaymentMethodSelect("cash")}
                icon={
                  <CreditCard
                    size={16}
                    color={selectedPayment === "cash" ? theme.colors.primary : theme.colors.textSecondary}
                  />
                }
              />
            </View>
            <Chip
              label="M-Pesa"
              selected={selectedPayment === "mpesa"}
              onPress={() => handlePaymentMethodSelect("mpesa")}
              icon={
                <Smartphone
                  size={16}
                  color={selectedPayment === "mpesa" ? theme.colors.primary : theme.colors.textSecondary}
                />
              }
            />
            <Chip
              label="Card"
              selected={selectedPayment === "card"}
              onPress={() => handlePaymentMethodSelect("card")}
              icon={
                <CreditCard
                  size={16}
                  color={selectedPayment === "card" ? theme.colors.primary : theme.colors.textSecondary}
                />
              }
            />
          </View>
          {!canUseCash && (
            <Text variant="caption" color="error" style={{ marginTop: theme.spacing[3] }}>
              Clear your debt to use cash payment
            </Text>
          )}
        </Surface>
      </ScrollView>

      {/* Bottom Action */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing[6],
            paddingTop: theme.spacing[4],
            paddingBottom: theme.spacing[9],
            borderTopWidth: StyleSheet.hairlineWidth * 2,
            borderTopColor: theme.colors.border,
          },
          theme.getElevation("elv400"),
        ]}
      >
        <View style={{ flex: 1, marginRight: theme.spacing[4] }}>
          <Text variant="bodySmall" color="secondary">Total Amount</Text>
          <Text variant="h3">Ksh {state.totalAmount.toLocaleString()}</Text>
        </View>

        <Button
          title="Place Order"
          onPress={handlePlaceOrder}
          loading={isProcessing}
          disabled={state.items.length === 0}
          leftIcon={<CheckCircle size={18} color={theme.colors.textOnPrimary} />}
        />
      </View>

      {/* Map Picker Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={[
              styles.mapModalHeader,
              {
                paddingHorizontal: theme.spacing[6],
                paddingBottom: theme.spacing[5],
                backgroundColor: theme.colors.surface,
                borderBottomWidth: StyleSheet.hairlineWidth * 2,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <Text variant="title">Select Location</Text>
            <Pressable onPress={() => setShowMapModal(false)} hitSlop={8}>
              <Text variant="label" color="brand">Cancel</Text>
            </Pressable>
          </View>

          <View style={styles.mapContainer}>
            {tempMapLocation && (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: tempMapLocation.latitude,
                  longitude: tempMapLocation.longitude,
                  latitudeDelta: defaultRegion.latitudeDelta,
                  longitudeDelta: defaultRegion.longitudeDelta,
                }}
                onRegionChangeComplete={(region) => {
                  setTempMapLocation({
                    latitude: region.latitude,
                    longitude: region.longitude,
                  });
                }}
              />
            )}

            {/* Center Marker */}
            <View style={styles.mapMarkerContainer} pointerEvents="none">
              <MapPin size={32} color={theme.colors.error} fill={theme.colors.error} />
            </View>
          </View>

          <View
            style={{
              padding: theme.spacing[6],
              paddingBottom: theme.spacing[9],
              backgroundColor: theme.colors.surface,
              borderTopWidth: StyleSheet.hairlineWidth * 2,
              borderTopColor: theme.colors.border,
            }}
          >
            <Button
              title="Confirm Location"
              onPress={handleConfirmMapLocation}
              loading={isReverseGeocoding}
              fullWidth
            />
          </View>
        </View>
      </Modal>

      {/* Pickup Time Modal */}
      <UIModal
        visible={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        title="Select Pickup Time"
        primaryAction={{
          label: "Confirm",
          onPress: () => {
            if (tempSelectedTime) {
              setSelectedPickupTime(tempSelectedTime);
              setShowPickupModal(false);
            } else {
              ToastService.showError("No Selection", "Please select a time slot");
            }
          },
        }}
        secondaryAction={{ label: "Cancel", onPress: () => setShowPickupModal(false) }}
      >
        <ScrollView style={{ maxHeight: 340 }}>
          {availableSlots.map((slot) => {
            const selected = tempSelectedTime === slot.datetime;
            return (
              <View
                key={slot.time}
                style={[
                  { opacity: slot.available ? 1 : 0.5, borderRadius: theme.radius.md },
                  selected && { backgroundColor: theme.colors.primaryMuted },
                ]}
              >
                <ListItem
                  title={slot.label}
                  subtitle={slot.available ? `${slot.remaining} slots available` : "Fully booked"}
                  onPress={slot.available ? () => setTempSelectedTime(slot.datetime) : undefined}
                  showChevron={false}
                  trailing={
                    selected ? <CheckCircle size={20} color={theme.colors.primary} /> : undefined
                  }
                />
              </View>
            );
          })}
        </ScrollView>
      </UIModal>
    </View>
  );
}

// Layout-only styles (no theme colors — token-driven values are applied inline)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapMarkerContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -32,
    marginLeft: -16,
  },
});
