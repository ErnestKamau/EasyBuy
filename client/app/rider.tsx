import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
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
  LogOut
} from "lucide-react-native";
import * as Location from "expo-location";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ordersApi, Order, deliveryApi } from "@/services/api";
import { websocketService } from "@/services/websocket";
import { ToastService } from "@/utils/toastService";

export default function RiderDashboard() {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
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
      // Fetch orders assigned to this rider
      const orders = await ordersApi.getPendingOrders();
      // Filter for orders where this user is the driver and status is assigned, accepted, or picked_up
      const riderOrders = orders.filter(o => 
        o.driver_id === user?.id && 
        ['assigned', 'accepted', 'picked_up'].includes(o.order_status)
      );
      setActiveOrders(riderOrders);
    } catch (error) {
      ToastService.showError("Error", "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return; // Wait for AuthContext or let it handle redirection
    
    if (user.role !== 'rider') {
      ToastService.showError("Access Denied", "Rider account required");
      router.replace("/(tabs)/");
      return;
    }

    fetchActiveAssignments();

    // Subscribe to assignments
    websocketService.on('order.assigned', fetchActiveAssignments);

    return () => {
      stopTracking();
      websocketService.off('order.assigned', fetchActiveAssignments);
    };
  }, [user, fetchActiveAssignments]);

  const fetchCurrentLocation = async () => {
    try {
      setIsFetchingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        ToastService.showError("Permission Denied", "Location access is required");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });

      // Update backend
      await deliveryApi.updateLocation(latitude, longitude);

      // Reverse geocode
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
      // Get initial location
      await fetchCurrentLocation();

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds for battery efficiency
          distanceInterval: 50, // Or every 50 meters
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          setCurrentLocation({ latitude, longitude });
          deliveryApi.updateLocation(latitude, longitude).catch(console.error);
          
          // Occasionally update address string (e.g. if moved significantly)
          const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (address) {
            const formattedAddress = `${address.name || ""}, ${address.street || ""}, ${address.city || ""}`;
            setLocationAddress(formattedAddress.replace(/^, /, ""));
          }
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
      if (nextStatus === 'accepted') {
        await deliveryApi.acceptDelivery(orderId);
      } else if (nextStatus === 'picked_up') {
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

  const renderOrderCard = (order: Order) => (
    <View key={order.id} style={[styles.orderCard, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderNumber, { color: currentTheme.text }]}>#{order.order_number}</Text>
          <Text style={[styles.customerName, { color: currentTheme.textSecondary }]}>{order.user?.first_name} {order.user?.last_name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.order_status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(order.order_status) }]}>{order.order_status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.addressContainer}>
        <MapPin size={18} color={currentTheme.primary} />
        <Text style={[styles.addressText, { color: currentTheme.text }]} numberOfLines={2}>{order.delivery_address}</Text>
      </View>

      <View style={styles.actionRow}>
        {order.order_status === 'assigned' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => handleStatusUpdate(order.id, 'accepted')}
          >
            <CheckCircle2 size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Accept Assignment</Text>
          </TouchableOpacity>
        )}
        
        {order.order_status === 'accepted' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => handleStatusUpdate(order.id, 'picked_up')}
          >
            <Package size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Mark as Picked Up</Text>
          </TouchableOpacity>
        )}

        {order.order_status === 'picked_up' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
            onPress={() => handleStatusUpdate(order.id, 'delivered')}
          >
            <Navigation size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Complete Delivery</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.circleButton, { backgroundColor: currentTheme.border }]}
          onPress={() => {/* Open Maps Protocol */}}
        >
          <MapPin size={20} color={currentTheme.text} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.circleButton, { backgroundColor: currentTheme.border }]}>
          <Phone size={20} color={currentTheme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'assigned': return '#F59E0B';
      case 'accepted': return '#8B5CF6';
      case 'picked_up': return '#3B82F6';
      case 'delivered': return '#22C55E';
      default: return '#64748B';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.surface }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Rider Dashboard</Text>
          <Text style={[styles.headerSubtitle, { color: currentTheme.textSecondary }]}>Welcome back, {user?.first_name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: currentTheme.primary + '10' }]}
          >
            <LogOut size={20} color={currentTheme.primary} />
          </TouchableOpacity>
          <View style={styles.onlineToggle}>
            <Text style={[styles.toggleLabel, { color: isOnline ? '#22C55E' : currentTheme.textSecondary }]}>
              {isOnline ? 'On' : 'Off'}
            </Text>
            <Switch 
              value={isOnline} 
              onValueChange={toggleOnline}
              trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
              thumbColor={isOnline ? "#22C55E" : "#94A3B8"}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Active Assignments ({activeOrders.length})</Text>
          <TouchableOpacity onPress={fetchActiveAssignments}>
            <RefreshCw size={18} color={currentTheme.primary} />
          </TouchableOpacity>
        </View>

        {/* Location Card */}
        <View style={[styles.locationCard, { backgroundColor: currentTheme.surface }]}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationIconContainer, { backgroundColor: currentTheme.primary + '15' }]}>
              <MapPin size={24} color={currentTheme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.locationTitle, { color: currentTheme.textSecondary }]}>Your Current Location</Text>
              <Text style={[styles.locationValue, { color: currentTheme.text }]} numberOfLines={1}>
                {locationAddress || (isFetchingLocation ? "Detecting..." : "Not Set")}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={fetchCurrentLocation}
              disabled={isFetchingLocation}
              style={[
                styles.refreshButton, 
                { opacity: isFetchingLocation ? 0.5 : 1 }
              ]}
            >
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color={currentTheme.primary} />
              ) : (
                <RefreshCw size={20} color={currentTheme.primary} />
              )}
            </TouchableOpacity>
          </View>
          
          {currentLocation && (
            <View style={styles.coordinatesRow}>
              <Text style={[styles.coordinateText, { color: currentTheme.textSecondary }]}>
                LAT: {currentLocation.latitude.toFixed(6)}
              </Text>
              <View style={[styles.coordinateDivider, { backgroundColor: currentTheme.border }]} />
              <Text style={[styles.coordinateText, { color: currentTheme.textSecondary }]}>
                LNG: {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          
          {!isOnline && (
            <Text style={[styles.locationHint, { color: currentTheme.textSecondary }]}>
              Go online to enable automatic background tracking
            </Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Active Assignments ({activeOrders.length})</Text>
          <TouchableOpacity onPress={fetchActiveAssignments}>
            <RefreshCw size={18} color={currentTheme.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={currentTheme.primary} style={{ marginTop: 50 }} />
        ) : activeOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Truck size={64} color={currentTheme.border} />
            <Text style={[styles.emptyTitle, { color: currentTheme.textSecondary }]}>No Active Orders</Text>
            <Text style={[styles.emptySubtitle, { color: currentTheme.textSecondary }]}>Switch to online to receive new delivery assignments</Text>
          </View>
        ) : (
          activeOrders.map(renderOrderCard)
        )}
      </ScrollView>

      {!isOnline && (
        <View style={[styles.offlineOverlay, { backgroundColor: currentTheme.surface + 'F0' }]}>
          <Power size={48} color={currentTheme.textSecondary} />
          <Text style={[styles.offlineText, { color: currentTheme.text }]}>You are currently offline</Text>
          <TouchableOpacity 
            style={[styles.onlineButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => toggleOnline(true)}
          >
            <Text style={styles.onlineButtonText}>Go Online</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  locationCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  coordinateText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  coordinateDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 12,
  },
  locationHint: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  orderCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  addressText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  offlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 130,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  offlineText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  onlineButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
  },
  onlineButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
