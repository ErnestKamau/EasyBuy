// app/(tabs)/orders.tsx - Orders page with three tabs
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/app/_layout";
import { ordersApi, Order } from "@/services/api";
import { ToastService } from "@/utils/toastService";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Calendar,
} from "lucide-react-native";

// Helper function to create dynamic styles
const createDynamicStyles = (currentTheme: any, themeName: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.background,
    },
    loadingText: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      marginTop: 12,
    },
    tabsContainer: {
      flexDirection: "row",
      backgroundColor: currentTheme.surface,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
      paddingHorizontal: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    activeTab: {
      borderBottomColor: currentTheme.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: currentTheme.textSecondary,
    },
    activeTabText: {
      color: currentTheme.primary,
      fontWeight: "700",
    },
    ordersList: {
      flex: 1,
    },
    orderCard: {
      backgroundColor: currentTheme.surface,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: themeName === "dark" ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: themeName === "dark" ? 4 : 2,
    },
    orderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: "700",
      color: currentTheme.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    orderDate: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginTop: 4,
    },
    orderInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    orderAmount: {
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.primary,
    },
    orderItemsCount: {
      fontSize: 13,
      color: currentTheme.textSecondary,
    },
    paymentStatusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    paymentStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginRight: 8,
    },
    paymentStatusText: {
      fontSize: 10,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: currentTheme.border + "40",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: currentTheme.text,
      marginBottom: 8,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      textAlign: "center",
    },
  });

type TabType = "ongoing" | "completed" | "cancelled";

export default function OrdersScreen(): React.ReactElement {
  const { currentTheme, themeName } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("ongoing");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dynamicStyles = createDynamicStyles(currentTheme, themeName);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      let fetchedOrders: Order[] = [];

      if (activeTab === "ongoing") {
        fetchedOrders = await ordersApi.getOrders({
          user_id: user.id,
          order_status: "pending",
        });
      } else if (activeTab === "completed") {
        fetchedOrders = await ordersApi.getOrders({
          user_id: user.id,
          order_status: "confirmed",
        });
      } else if (activeTab === "cancelled") {
        fetchedOrders = await ordersApi.getOrders({
          user_id: user.id,
          order_status: "cancelled",
        });
      }

      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      ToastService.showError("Error", "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadgeStyle = (status: string) => {
    if (status === "pending") {
      return {
        backgroundColor: currentTheme.warning + "20",
        color: currentTheme.warning,
      };
    } else if (status === "confirmed") {
      return {
        backgroundColor: currentTheme.success + "20",
        color: currentTheme.success,
      };
    } else {
      return {
        backgroundColor: currentTheme.error + "20",
        color: currentTheme.error,
      };
    }
  };

  const getPaymentStatusBadgeStyle = (status: string) => {
    if (status === "paid") {
      return {
        backgroundColor: currentTheme.success + "20",
        color: currentTheme.success,
      };
    } else if (status === "pending") {
      return {
        backgroundColor: currentTheme.warning + "20",
        color: currentTheme.warning,
      };
    } else if (status === "debt") {
      return {
        backgroundColor: currentTheme.info + "20",
        color: currentTheme.info,
      };
    } else {
      return {
        backgroundColor: currentTheme.error + "20",
        color: currentTheme.error,
      };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Format HH:MM
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const statusStyle = getStatusBadgeStyle(item.order_status);
    const paymentStyle = getPaymentStatusBadgeStyle(item.payment_status);

    return (
      <TouchableOpacity
        style={dynamicStyles.orderCard}
        onPress={() => router.push(`/order/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={dynamicStyles.orderHeader}>
          <View style={{ flex: 1 }}>
            <Text style={dynamicStyles.orderNumber}>{item.order_number}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Calendar size={12} color={currentTheme.textSecondary} />
              <Text style={dynamicStyles.orderDate}>
                {formatDate(item.order_date)} • {formatTime(item.order_time)}
              </Text>
            </View>
          </View>
          <View
            style={[
              dynamicStyles.statusBadge,
              { backgroundColor: statusStyle.backgroundColor },
            ]}
          >
            <Text
              style={[
                dynamicStyles.statusBadgeText,
                { color: statusStyle.color },
              ]}
            >
              {item.order_status}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.orderInfo}>
          <View>
            <Text style={dynamicStyles.orderAmount}>
              Ksh {item.total_amount?.toLocaleString() || "0"}
            </Text>
            <View style={dynamicStyles.paymentStatusContainer}>
              <View
                style={[
                  dynamicStyles.paymentStatusBadge,
                  { backgroundColor: paymentStyle.backgroundColor },
                ]}
              >
                <Text
                  style={[
                    dynamicStyles.paymentStatusText,
                    { color: paymentStyle.color },
                  ]}
                >
                  {item.payment_status}
                </Text>
              </View>
              {item.items && item.items.length > 0 && (
                <Text style={dynamicStyles.orderItemsCount}>
                  {item.items.length}{" "}
                  {item.items.length === 1 ? "item" : "items"}
                </Text>
              )}
            </View>
          </View>
          <ChevronRight size={20} color={currentTheme.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    let IconComponent = Package;
    let title = "No Orders";
    let subtitle = "You haven't placed any orders yet.";

    if (activeTab === "ongoing") {
      IconComponent = Clock;
      title = "No Ongoing Orders";
      subtitle = "You don't have any pending orders at the moment.";
    } else if (activeTab === "completed") {
      IconComponent = CheckCircle;
      title = "No Completed Orders";
      subtitle = "Your completed orders will appear here.";
    } else if (activeTab === "cancelled") {
      IconComponent = XCircle;
      title = "No Cancelled Orders";
      subtitle = "You don't have any cancelled orders.";
    }

    return (
      <View style={dynamicStyles.emptyContainer}>
        <View style={dynamicStyles.emptyIcon}>
          <IconComponent size={48} color={currentTheme.textSecondary} />
        </View>
        <Text style={dynamicStyles.emptyTitle}>{title}</Text>
        <Text style={dynamicStyles.emptySubtitle}>{subtitle}</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <StatusBar
          barStyle={themeName === "dark" ? "light-content" : "dark-content"}
          backgroundColor={currentTheme.surface}
        />
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={dynamicStyles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <StatusBar
        barStyle={themeName === "dark" ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.surface}
      />

      {/* Tabs */}
      <View style={dynamicStyles.tabsContainer}>
        <TouchableOpacity
          style={[
            dynamicStyles.tab,
            activeTab === "ongoing" && dynamicStyles.activeTab,
          ]}
          onPress={() => setActiveTab("ongoing")}
        >
          <Text
            style={[
              dynamicStyles.tabText,
              activeTab === "ongoing" && dynamicStyles.activeTabText,
            ]}
          >
            ONGOING
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            dynamicStyles.tab,
            activeTab === "completed" && dynamicStyles.activeTab,
          ]}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={[
              dynamicStyles.tabText,
              activeTab === "completed" && dynamicStyles.activeTabText,
            ]}
          >
            COMPLETED
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            dynamicStyles.tab,
            activeTab === "cancelled" && dynamicStyles.activeTab,
          ]}
          onPress={() => setActiveTab("cancelled")}
        >
          <Text
            style={[
              dynamicStyles.tabText,
              activeTab === "cancelled" && dynamicStyles.activeTabText,
            ]}
          >
            CANCELLED
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingVertical: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={currentTheme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={currentTheme.primary}
            />
          }
        >
          {renderEmptyState()}
        </ScrollView>
      )}
    </View>
  );
}
