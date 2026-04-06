import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { ArrowLeft, Phone, Navigation, Package } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { ordersApi, Order, deliveryApi } from "@/services/api";
import { websocketService } from "@/services/websocket";
import { ToastService } from "@/utils/toastService";

const { width, height } = Dimensions.get("window");

// Shop location (Placeholder - should ideally come from backend config)
const SHOP_LOCATION = {
  latitude: -1.286389,
  longitude: 36.817223,
  address: "EasyBuy Shop, Nairobi Central",
};

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentTheme, themeName } = useTheme();
  const isDark = themeName === 'dark';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadOrderDetails();
    
    if (id) {
      const orderId = Number.parseInt(id, 10);
      // Subscribe to real-time updates
      websocketService.subscribeToOrder(orderId);

      const handleLocationUpdate = (data: any) => {
        if (data.lat && data.lng) {
          setDriverLocation({
            latitude: data.lat,
            longitude: data.lng,
          });
        }
      };

      const handleStatusUpdate = () => {
        loadOrderDetails();
      };

      websocketService.on('location.updated', handleLocationUpdate);
      websocketService.on('order.status_updated', handleStatusUpdate);

      return () => {
        websocketService.unsubscribeFromOrder(orderId);
        websocketService.off('location.updated', handleLocationUpdate);
        websocketService.off('order.status_updated', handleStatusUpdate);
      };
    }
  }, [id]);

  const loadOrderDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await ordersApi.getOrderDetails(Number.parseInt(id, 10));
      setOrder(data);
      
      // If driver is already assigned/picked up, fetch initial location
      if (data.driver_id && (data.order_status === 'assigned' || data.order_status === 'accepted' || data.order_status === 'picked_up')) {
        try {
          const loc = await deliveryApi.getDriverLocation(data.driver_id);
          setDriverLocation(loc);
        } catch (e) {
          console.warn("Could not fetch initial driver location");
        }
      }
    } catch (error) {
      ToastService.showError("Error", "Failed to load order tracking info");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = () => {
    switch (order?.order_status) {
      case 'assigned': return "Driver Assigned";
      case 'accepted': return "Driver is heading to shop";
      case 'picked_up': return "Driver is on the way to you";
      case 'delivered': return "Order Delivered";
      default: return "Processing";
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

  const customerLocation = order.delivery_lat && order.delivery_lng ? {
    latitude: order.delivery_lat,
    longitude: order.delivery_lng
  } : null;

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Track Order</Text>
          <Text style={[styles.headerSubtitle, { color: currentTheme.textSecondary }]}>#{order.order_number}</Text>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: driverLocation?.latitude || customerLocation?.latitude || SHOP_LOCATION.latitude,
            longitude: driverLocation?.longitude || customerLocation?.longitude || SHOP_LOCATION.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
        >
          {/* Shop Marker */}
          <Marker
            coordinate={SHOP_LOCATION}
            title="EasyBuy Shop"
            description="Pickup Point"
          >
            <View style={[styles.markerBase, { backgroundColor: currentTheme.primary }]}>
              <Package size={16} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Customer Marker */}
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

          {/* Driver Marker */}
          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title={order.driver?.first_name || "Driver"}
              description="Live Location"
            >
              <View style={[styles.markerBase, { backgroundColor: '#22C55E' }]}>
                <Navigation size={16} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Simple Polyline (Route visualization placeholder) */}
          {driverLocation && customerLocation && (
            <Polyline
              coordinates={[driverLocation, customerLocation]}
              strokeColor={currentTheme.primary}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: currentTheme.surface }]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusIndicator, { backgroundColor: currentTheme.primary }]} />
          <Text style={[styles.statusText, { color: currentTheme.text }]}>{getStatusText()}</Text>
        </View>

        {order.driver && (
          <View style={styles.driverInfo}>
            <View style={[styles.driverAvatar, { backgroundColor: currentTheme.border }]}>
               <Text style={{ fontWeight: '700', color: currentTheme.text }}>{order.driver.first_name?.[0]}</Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={[styles.driverName, { color: currentTheme.text }]}>{order.driver.first_name} {order.driver.last_name}</Text>
              <Text style={[styles.vehicleInfo, { color: currentTheme.textSecondary }]}>{order.driver.vehicle_type || 'Rider'} • {order.driver.vehicle_registration || 'No Plate'}</Text>
            </View>
            <TouchableOpacity style={[styles.callButton, { backgroundColor: currentTheme.primary }]}>
              <Phone size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.addressBox, { backgroundColor: currentTheme.background }]}>
          <Text style={[styles.addressLabel, { color: currentTheme.textSecondary }]}>Delivery Address</Text>
          <Text style={[styles.addressText, { color: currentTheme.text }]} numberOfLines={2}>
            {order.delivery_address || "No address provided"}
          </Text>
        </View>
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
});
