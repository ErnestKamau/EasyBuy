import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { ArrowLeft, Phone, Navigation, Package, CheckCircle2 } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { ordersApi, Order, deliveryApi, OrderTracking } from "@/services/api";
import { websocketService } from "@/services/websocket";
import { ToastService } from "@/utils/toastService";
import { decodePolyline } from "@/utils/polyline";
import { TrackStepper, GlassSurface, Text as UIText, Button } from "@/components/ui";

const { width } = Dimensions.get("window");

const SHOP_FALLBACK_LAT = Number(process.env.EXPO_PUBLIC_SHOP_LAT) || -1.286389;
const SHOP_FALLBACK_LNG = Number(process.env.EXPO_PUBLIC_SHOP_LNG) || 36.817223;

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentTheme, themeName } = useTheme();
  const isDark = themeName === 'dark';
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  
  const mapRef = useRef<MapView>(null);

  const applyTracking = useCallback((data: OrderTracking) => {
    setTracking(data);
    if (data.driver_location?.lat != null && data.driver_location?.lng != null) {
      setDriverLocation({
        latitude: data.driver_location.lat,
        longitude: data.driver_location.lng,
      });
    }
    if (data.route?.polyline) {
      setRouteCoords(decodePolyline(data.route.polyline));
    }
  }, []);

  const loadTracking = useCallback(async (orderId: number) => {
    try {
      const data = await deliveryApi.getOrderTracking(orderId);
      applyTracking(data);
    } catch (e) {
      console.warn("Could not fetch order tracking", e);
    }
  }, [applyTracking]);

  const loadOrderDetails = useCallback(async () => {
    if (!id) return;
    const orderId = Number.parseInt(id, 10);
    try {
      setLoading(true);
      const data = await ordersApi.getOrderDetails(orderId);
      setOrder(data);
      await loadTracking(orderId);
    } catch (error) {
      ToastService.showError("Error", "Failed to load order tracking info");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, loadTracking]);

  useEffect(() => {
    loadOrderDetails();
    
    if (id) {
      const orderId = Number.parseInt(id, 10);
      websocketService.subscribeToOrder(orderId);

      const handleLocationUpdate = (data: any) => {
        const lat = data?.lat ?? data?.location?.lat;
        const lng = data?.lng ?? data?.location?.lng;
        if (lat != null && lng != null) {
          setDriverLocation({
            latitude: Number(lat),
            longitude: Number(lng),
          });
        }
      };

      const handleStatusUpdate = () => {
        loadOrderDetails();
      };

      websocketService.on('driver.location.updated', handleLocationUpdate);
      websocketService.on('location.updated', handleLocationUpdate);
      websocketService.on('order.status.updated', handleStatusUpdate);
      websocketService.on('order.status_updated', handleStatusUpdate);

      // REST polling fallback when WebSocket is down
      const poll = setInterval(() => {
        loadTracking(orderId);
      }, 10000);

      return () => {
        clearInterval(poll);
        websocketService.unsubscribeFromOrder(orderId);
        websocketService.off('driver.location.updated', handleLocationUpdate);
        websocketService.off('location.updated', handleLocationUpdate);
        websocketService.off('order.status.updated', handleStatusUpdate);
        websocketService.off('order.status_updated', handleStatusUpdate);
      };
    }
  }, [id, loadOrderDetails, loadTracking]);

  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;
    mapRef.current.animateCamera({
      center: driverLocation,
      zoom: 14,
    });
  }, [driverLocation?.latitude, driverLocation?.longitude]);

  const getStatusText = () => {
    const status = tracking?.fulfillment_status || order?.fulfillment_status;
    switch (status) {
      case 'pending':
      case 'preparing':
        return "Preparing your order";
      case 'assigned':
        return "Driver assigned — waiting for acceptance";
      case 'driver_accepted':
        return "Driver confirmed — heading to shop";
      case 'en_route':
        return "Driver is on the way to you";
      case 'delivered':
        return "Order delivered";
      default:
        return "Processing";
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order) return;
    try {
      setConfirming(true);
      await deliveryApi.customerConfirmDelivery(order.id);
      ToastService.showSuccess("Delivered", "Thanks for confirming your delivery");
      await loadOrderDetails();
    } catch (error) {
      ToastService.showApiError(error, "Failed to confirm delivery");
    } finally {
      setConfirming(false);
    }
  };

  if (loading && !order) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  if (!order) return null;

  const customerLocation =
    (tracking?.destination?.lat != null && tracking?.destination?.lng != null
      ? {
          latitude: Number(tracking.destination.lat),
          longitude: Number(tracking.destination.lng),
        }
      : null) ||
    (order.delivery_lat && order.delivery_lng
      ? {
          latitude: order.delivery_lat,
          longitude: order.delivery_lng,
        }
      : null);

  const fulfillmentStatus = tracking?.fulfillment_status || order.fulfillment_status;
  const etaLabel = tracking?.route?.duration && tracking.route.duration !== 'N/A'
    ? tracking.route.duration
    : null;
  const distanceLabel = tracking?.route?.distance && tracking.route.distance !== 'N/A'
    ? tracking.route.distance
    : null;

  const driverName = tracking?.driver?.name
    || (order.driver ? `${order.driver.first_name} ${order.driver.last_name}` : null);
  const vehicleInfo = tracking?.driver
    ? `${tracking.driver.vehicle_type || 'Rider'} • ${tracking.driver.vehicle_registration || 'No Plate'}`
    : order.driver
      ? `${order.driver.vehicle_type || 'Rider'} • ${order.driver.vehicle_registration || 'No Plate'}`
      : null;

  const polylinePoints =
    routeCoords.length > 1
      ? routeCoords
      : driverLocation && customerLocation
        ? [driverLocation, customerLocation]
        : [];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Track Order</Text>
          <Text style={[styles.headerSubtitle, { color: currentTheme.textSecondary }]}>#{order.order_number}</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: driverLocation?.latitude || customerLocation?.latitude || SHOP_FALLBACK_LAT,
            longitude: driverLocation?.longitude || customerLocation?.longitude || SHOP_FALLBACK_LNG,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
        >
          {customerLocation && (
            <Marker
              coordinate={customerLocation}
              title="You"
              description={order.delivery_address}
            >
              <View style={[styles.markerBase, { backgroundColor: '#3B82F6' }]}>
                <Navigation size={16} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title={driverName || "Driver"}
              description="Live Location"
            >
              <View style={[styles.markerBase, { backgroundColor: currentTheme.primary }]}>
                <Package size={16} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {polylinePoints.length > 1 && (
            <Polyline
              coordinates={polylinePoints}
              strokeColor={currentTheme.primary}
              strokeWidth={4}
              lineDashPattern={routeCoords.length > 1 ? undefined : [5, 5]}
            />
          )}
        </MapView>
      </View>

      <View style={[styles.infoCard, { backgroundColor: currentTheme.surface }]}>
        <TrackStepper
          current={
            fulfillmentStatus === 'delivered'
              ? 3
              : fulfillmentStatus === 'en_route'
                ? 2
                : fulfillmentStatus === 'preparing' || fulfillmentStatus === 'ready'
                  ? 1
                  : 0
          }
        />
        <View style={styles.statusRow}>
          <View style={[styles.statusIndicator, { backgroundColor: currentTheme.primary }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusText, { color: currentTheme.text }]}>{getStatusText()}</Text>
            {(etaLabel || distanceLabel) && fulfillmentStatus === 'en_route' && (
              <Text style={[styles.etaText, { color: currentTheme.textSecondary }]}>
                {[etaLabel && `ETA ${etaLabel}`, distanceLabel].filter(Boolean).join(' • ')}
              </Text>
            )}
          </View>
        </View>

        {(driverName || order.driver) && (
          <View style={styles.driverInfo}>
            <View style={[styles.driverAvatar, { backgroundColor: currentTheme.border }]}>
               <Text style={{ fontWeight: '700', color: currentTheme.text }}>
                 {(driverName || order.driver?.first_name || 'D')[0]}
               </Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={[styles.driverName, { color: currentTheme.text }]}>
                {driverName || `${order.driver?.first_name} ${order.driver?.last_name}`}
              </Text>
              {vehicleInfo && (
                <Text style={[styles.vehicleInfo, { color: currentTheme.textSecondary }]}>
                  {vehicleInfo}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.callButton, { backgroundColor: currentTheme.primary }]}
              onPress={() => {
                const phone = order.driver?.phone_number;
                if (phone) {
                  Linking.openURL(`tel:${phone}`);
                } else {
                  ToastService.showWarning("No Phone", "Driver phone number is unavailable.");
                }
              }}
            >
              <Phone size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.addressBox, { backgroundColor: currentTheme.background }]}>
          <Text style={[styles.addressLabel, { color: currentTheme.textSecondary }]}>Delivery Address</Text>
          <Text style={[styles.addressText, { color: currentTheme.text }]} numberOfLines={2}>
            {order.delivery_address || tracking?.destination?.address || "No address provided"}
          </Text>
        </View>

        {fulfillmentStatus === 'en_route' && (
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: currentTheme.primary, opacity: confirming ? 0.7 : 1 }]}
            onPress={handleConfirmDelivery}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Confirm Delivery Received</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: width,
    height: '100%',
  },
  markerBase: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  etaText: {
    fontSize: 13,
    marginTop: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 15,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleInfo: {
    fontSize: 13,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressBox: {
    padding: 15,
    borderRadius: 12,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  confirmButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
});
