import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Linking,
  Pressable,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { router } from "expo-router";
import {
  Truck,
  MapPin,
  CheckCircle2,
  Navigation,
  Phone,
  Package,
  Power,
  RefreshCw,
  LogOut,
} from "lucide-react-native";
import * as Location from "expo-location";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { Order, deliveryApi } from "@/services/api";
import { websocketService } from "@/services/websocket";
import { ToastService } from "@/utils/toastService";
import { AppTheme } from "@/design";
import { OrderStatus } from "@/components/ui/Badge";
import {
  Text,
  Surface,
  Card,
  Button,
  IconButton,
  Switch,
  StatusPill,
  Divider,
  GlassSurface,
  Spinner,
} from "@/components/ui";

const RIDER_STATUS_MAP: Record<string, { pillStatus: OrderStatus; label: string }> = {
  assigned: { pillStatus: "pending", label: "Assigned" },
  driver_accepted: { pillStatus: "preparing", label: "Accepted" },
  en_route: { pillStatus: "delivering", label: "En Route" },
  delivered: { pillStatus: "delivered", label: "Delivered" },
};

export default function RiderDashboard() {
  const { user, logout } = useAuth();
  const theme = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const activeOrderIdRef = useRef<number | null>(null);

  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedMapOrder, setSelectedMapOrder] = useState<Order | null>(null);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => logout() }
      ]
    );
  };

  const fetchActiveAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const active = await deliveryApi.getActiveDelivery();
      const list = active ? [active] : [];
      setActiveOrders(list);
      activeOrderIdRef.current = active?.id ?? null;
    } catch (error) {
      ToastService.showError("Error", "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    if (user.role !== 'rider') {
      ToastService.showError("Access Denied", "Rider account required");
      router.replace("/(tabs)");
      return;
    }

    fetchActiveAssignments();

    const refresh = () => fetchActiveAssignments();
    websocketService.on('order.status.updated', refresh);
    websocketService.on('order.assigned', refresh);

    return () => {
      stopTracking();
      websocketService.off('order.status.updated', refresh);
      websocketService.off('order.assigned', refresh);
    };
  }, [user, fetchActiveAssignments]);

  const pushLocation = async (
    latitude: number,
    longitude: number,
    extras?: { heading?: number; speed?: number }
  ) => {
    await deliveryApi.updateLocation(latitude, longitude, {
      heading: extras?.heading,
      speed: extras?.speed,
      orderId: activeOrderIdRef.current,
    });
  };

  const fetchCurrentLocation = async () => {
    try {
      setIsFetchingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        ToastService.showError("Permission Denied", "Location access is required");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, heading, speed } = location.coords;
      setCurrentLocation({ latitude, longitude });

      await pushLocation(latitude, longitude, {
        heading: heading ?? 0,
        speed: speed ?? 0,
      });

      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        const formattedAddress = `${address.name || ""}, ${address.street || ""}, ${address.city || ""}`;
        setLocationAddress(formattedAddress.replace(/^, /, ""));
      }

      ToastService.showSuccess("Location Updated", "Your current position has been recorded");
    } catch (error) {
      console.error("Failed to fetch location:", error);
      ToastService.showError("Error", "Failed to update location");
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const startTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      ToastService.showError("Permission Denied", "Location access is required for tracking");
      return;
    }

    try {
      await fetchCurrentLocation();

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        async (location) => {
          const { latitude, longitude, heading, speed } = location.coords;
          setCurrentLocation({ latitude, longitude });
          pushLocation(latitude, longitude, {
            heading: heading ?? 0,
            speed: speed ?? 0,
          }).catch(console.error);
        }
      );
      setLocationSubscription(sub);
      setIsOnline(true);
      await deliveryApi.setOnlineStatus(true);
    } catch (error) {
      ToastService.showError("Error", "Failed to start location tracking");
    }
  };

  const stopTracking = async () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsOnline(false);
    try {
      await deliveryApi.setOnlineStatus(false);
    } catch (e) {}
  };

  const handleStatusUpdate = async (orderId: number, nextStatus: string) => {
    try {
      setLoading(true);
      if (nextStatus === 'driver_accepted') {
        await deliveryApi.acceptDelivery(orderId);
      } else if (nextStatus === 'en_route') {
        await deliveryApi.startDelivery(orderId);
      } else if (nextStatus === 'delivered') {
        await deliveryApi.confirmDelivery(orderId);
      }
      ToastService.showSuccess("Success", `Order status updated to ${nextStatus}`);
      fetchActiveAssignments();
    } catch (error) {
      ToastService.showApiError(error, "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = (value: boolean) => {
    if (value) {
      startTracking();
    } else {
      stopTracking();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing[6],
            paddingBottom: theme.spacing[6],
            backgroundColor: theme.colors.surface,
          },
          theme.getElevation('elv200'),
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text variant="title">Rider Dashboard</Text>
          <Text variant="bodySmall" color="secondary">Welcome back, {user?.first_name}</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon={<LogOut size={20} color={theme.colors.primary} />}
            onPress={handleLogout}
            accessibilityLabel="Logout"
            style={{ backgroundColor: theme.colors.primaryMuted, marginRight: theme.spacing[4] }}
          />
          <View style={styles.onlineToggle}>
            <Text
              variant="caption"
              style={{
                color: isOnline ? theme.colors.success : theme.colors.textSecondary,
                fontWeight: '700',
                textTransform: 'uppercase',
                marginRight: theme.spacing[3],
              }}
            >
              {isOnline ? 'On' : 'Off'}
            </Text>
            <Switch value={isOnline} onValueChange={toggleOnline} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: theme.spacing[6] }}>
        {/* Location Card */}
        <Surface variant="elevated" padding={5} radius="lg" style={{ marginBottom: theme.spacing[7] }}>
          <View style={styles.locationHeader}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.primaryMuted,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MapPin size={24} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: theme.spacing[4] }}>
              <Text variant="caption" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Your Current Location
              </Text>
              <Text variant="label" numberOfLines={1} style={{ marginTop: theme.spacing[1] }}>
                {locationAddress || (isFetchingLocation ? "Detecting..." : "Not Set")}
              </Text>
            </View>
            <IconButton
              icon={
                isFetchingLocation ? (
                  <Spinner />
                ) : (
                  <RefreshCw size={20} color={theme.colors.primary} />
                )
              }
              onPress={fetchCurrentLocation}
              disabled={isFetchingLocation}
              accessibilityLabel="Refresh location"
            />
          </View>

          {currentLocation && (
            <View
              style={[
                styles.coordinatesRow,
                { marginTop: theme.spacing[3], paddingTop: theme.spacing[3], borderTopColor: theme.colors.divider },
              ]}
            >
              <Text variant="caption" color="secondary" style={{ fontFamily: 'monospace' }}>
                LAT: {currentLocation.latitude.toFixed(6)}
              </Text>
              <Divider vertical style={{ height: 12, marginHorizontal: theme.spacing[3] }} />
              <Text variant="caption" color="secondary" style={{ fontFamily: 'monospace' }}>
                LNG: {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {!isOnline && (
            <Text
              variant="caption"
              color="secondary"
              style={{ fontStyle: 'italic', marginTop: theme.spacing[3], textAlign: 'center' }}
            >
              Go online to enable automatic background tracking
            </Text>
          )}
        </Surface>

        <View style={[styles.sectionHeader, { marginBottom: theme.spacing[6] }]}>
          <Text variant="title">Active Assignments ({activeOrders.length})</Text>
          <IconButton
            icon={<RefreshCw size={18} color={theme.colors.primary} />}
            onPress={fetchActiveAssignments}
            accessibilityLabel="Refresh assignments"
          />
        </View>

        {loading ? (
          <View style={{ marginTop: theme.spacing[10] }}>
            <Spinner size="large" />
          </View>
        ) : activeOrders.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: theme.spacing[12] }}>
            <Truck size={64} color={theme.colors.border} />
            <Text variant="title" color="secondary" style={{ marginTop: theme.spacing[5] }}>
              No Active Orders
            </Text>
            <Text
              variant="body"
              color="secondary"
              style={{ textAlign: 'center', marginTop: theme.spacing[2], paddingHorizontal: theme.spacing[9] }}
            >
              Switch to online to receive new delivery assignments
            </Text>
          </View>
        ) : (
          activeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              theme={theme}
              onStatusUpdate={handleStatusUpdate}
              onViewMap={() => {
                if (
                  Number.isFinite(Number(order.delivery_lat)) &&
                  Number.isFinite(Number(order.delivery_lng))
                ) {
                  setSelectedMapOrder(order);
                  setShowMapModal(true);
                } else {
                  ToastService.showWarning("No Location", "This order does not have precise map coordinates.");
                }
              }}
              onCall={() => {
                const phone = order.user?.phone_number;
                if (phone) {
                  Linking.openURL(`tel:${phone}`);
                } else {
                  ToastService.showWarning("No Phone", "Customer phone number is unavailable.");
                }
              }}
            />
          ))
        )}
      </ScrollView>

      {!isOnline && (
        <GlassSurface
          level={2}
          borderRadius={0}
          style={[styles.offlineOverlay, { top: 130 }]}
        >
          <View style={styles.offlineContent}>
            <Power size={48} color={theme.colors.textSecondary} />
            <Text variant="title" style={{ marginTop: theme.spacing[4], marginBottom: theme.spacing[6] }}>
              You are currently offline
            </Text>
            <Button title="Go Online" onPress={() => toggleOnline(true)} />
          </View>
        </GlassSurface>
      )}

      {/* Map Viewer Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={[
              styles.header,
              {
                paddingTop: theme.spacing[9],
                paddingHorizontal: theme.spacing[6],
                paddingBottom: theme.spacing[5],
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text variant="title">Delivery Destination</Text>
            <Pressable onPress={() => setShowMapModal(false)} hitSlop={8}>
              <Text variant="label" color="brand">Close</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1 }}>
            {(() => {
              const lat = Number(selectedMapOrder?.delivery_lat);
              const lng = Number(selectedMapOrder?.delivery_lng);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
              return (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={StyleSheet.absoluteFillObject}
                  initialRegion={{
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker
                    coordinate={{ latitude: lat, longitude: lng }}
                    title="Deliver Here"
                    description={selectedMapOrder?.delivery_address || `Order #${selectedMapOrder?.order_number}`}
                  />
                </MapView>
              );
            })()}
          </View>

          <View
            style={{
              padding: theme.spacing[6],
              backgroundColor: theme.colors.surface,
              borderTopWidth: StyleSheet.hairlineWidth * 2,
              borderTopColor: theme.colors.border,
            }}
          >
            <Text variant="label" style={{ marginBottom: theme.spacing[2] }}>Destination Address</Text>
            <Text variant="body" color="secondary">
              {selectedMapOrder?.delivery_address || "Address details unavailable"}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const OrderCard = ({
  order,
  theme,
  onStatusUpdate,
  onViewMap,
  onCall,
}: {
  order: Order;
  theme: AppTheme;
  onStatusUpdate: (orderId: number, nextStatus: string) => void;
  onViewMap: () => void;
  onCall: () => void;
}) => {
  const statusMeta = RIDER_STATUS_MAP[order.fulfillment_status];

  return (
    <Card radius="lg" style={{ marginBottom: theme.spacing[6] }}>
      <View style={[styles.orderHeader, { marginBottom: theme.spacing[5] }]}>
        <View>
          <Text variant="label">#{order.order_number}</Text>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.spacing[1] }}>
            {order.user?.first_name} {order.user?.last_name}
          </Text>
        </View>
        <StatusPill
          status={statusMeta?.pillStatus ?? order.fulfillment_status}
          label={statusMeta?.label}
        />
      </View>

      <View
        style={[
          styles.addressContainer,
          {
            marginBottom: theme.spacing[6],
            padding: theme.spacing[3],
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <MapPin size={18} color={theme.colors.primary} />
        <Text variant="bodySmall" numberOfLines={2} style={{ marginLeft: theme.spacing[3], flex: 1 }}>
          {order.delivery_address}
        </Text>
      </View>

      <View style={styles.actionRow}>
        {order.fulfillment_status === 'assigned' && (
          <Button
            title="Accept Assignment"
            onPress={() => onStatusUpdate(order.id, 'driver_accepted')}
            leftIcon={<CheckCircle2 size={18} color={theme.colors.textOnPrimary} />}
            style={{ flex: 1 }}
          />
        )}

        {order.fulfillment_status === 'driver_accepted' && (
          <Button
            title="Start Trip"
            onPress={() => onStatusUpdate(order.id, 'en_route')}
            leftIcon={<Package size={18} color={theme.colors.textOnPrimary} />}
            style={{ flex: 1 }}
          />
        )}

        {order.fulfillment_status === 'en_route' && (
          <Button
            title="Complete Delivery"
            onPress={() => onStatusUpdate(order.id, 'delivered')}
            leftIcon={<Navigation size={18} color={theme.colors.textOnPrimary} />}
            style={{ flex: 1 }}
          />
        )}

        <IconButton
          icon={<MapPin size={20} color={theme.colors.text} />}
          onPress={onViewMap}
          accessibilityLabel="View on map"
          style={{ backgroundColor: theme.colors.backgroundSecondary, marginLeft: theme.spacing[3] }}
        />

        <IconButton
          icon={<Phone size={20} color={theme.colors.text} />}
          onPress={onCall}
          accessibilityLabel="Call customer"
          style={{ backgroundColor: theme.colors.backgroundSecondary, marginLeft: theme.spacing[3] }}
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
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  offlineContent: {
    alignItems: 'center',
  },
});
