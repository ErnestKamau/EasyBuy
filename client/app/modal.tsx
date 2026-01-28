// app/modal.tsx - Notification Center
import React, { useState, useMemo, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  FlatList,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Notification } from "@/services/api";
import {
  Bell,
  Check,
  CheckCircle2,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  Package,
  Trash2,
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
    notificationItem: {
      backgroundColor: currentTheme.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border + "40",
      flexDirection: "row",
      alignItems: "flex-start",
    },
    unreadNotification: {
      backgroundColor: currentTheme.primary + "08",
      borderLeftWidth: 3,
      borderLeftColor: currentTheme.primary,
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: currentTheme.text,
      marginBottom: 4,
    },
    unreadTitle: {
      fontWeight: "700",
    },
    notificationMessage: {
      fontSize: 13,
      color: currentTheme.textSecondary,
      lineHeight: 18,
      marginBottom: 4,
    },
    notificationTime: {
      fontSize: 11,
      color: currentTheme.textSecondary,
    },
    notificationActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginLeft: 8,
    },
    actionIcon: {
      padding: 4,
    },
    priorityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginTop: 4,
      alignSelf: "flex-start",
    },
    priorityText: {
      fontSize: 10,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    // Tab styles
    tabContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: currentTheme.surface,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
      gap: 12,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
      backgroundColor: currentTheme.background,
    },
    activeTab: {
      backgroundColor: currentTheme.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: currentTheme.textSecondary,
    },
    activeTabText: {
      color: "#FFFFFF",
    },
  });

// Get icon for notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "order_placed":
    case "order_confirmed":
    case "order_cancelled":
      return ShoppingBag;
    case "payment_received":
    case "payment_received_admin":
    case "sale_fully_paid":
      return CreditCard;
    case "debt_warning_2days":
    case "debt_warning_admin_2days":
    case "debt_overdue":
    case "debt_overdue_admin":
      return AlertTriangle;
    case "low_stock_alert":
      return Package;
    case "refund_processed":
      return CreditCard;
    case "new_product_available":
      return Package;
    default:
      return Bell;
  }
};

// Get icon color for notification type
const getNotificationIconColor = (type: string, currentTheme: any) => {
  switch (type) {
    case "order_placed":
    case "order_confirmed":
      return currentTheme.success;
    case "order_cancelled":
    case "debt_overdue":
    case "debt_overdue_admin":
      return currentTheme.error;
    case "debt_warning_2days":
    case "debt_warning_admin_2days":
      return currentTheme.warning;
    case "payment_received":
    case "payment_received_admin":
    case "sale_fully_paid":
      return currentTheme.success;
    case "low_stock_alert":
      return currentTheme.warning;
    case "refund_processed":
      return currentTheme.info;
    default:
      return currentTheme.primary;
  }
};

// Format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Handle notification tap - deep linking
const handleNotificationTap = (notification: Notification) => {
  const data = notification.data || {};

  if (data.order_id) {
    router.push(`/order/${data.order_id}` as any);
  } else if (data.sale_id) {
    // Navigate to sale/order detail
    if (data.order_id) {
      router.push(`/order/${data.order_id}` as any);
    }
  }
  // Add more deep linking logic as needed
};

export default function NotificationModal() {
  const { currentTheme, themeName } = useTheme();
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"unread" | "read">("unread");

  const dynamicStyles = createDynamicStyles(currentTheme, themeName);

  // Configure header buttons and title
  useLayoutEffect(() => {
    navigation.setOptions({
      title:
        unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications",
      headerRight: () => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            marginRight: 8,
          }}
        >
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={{ padding: 4 }}>
              <Check size={20} color={currentTheme.primary} />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [navigation, unreadCount, markAllAsRead, currentTheme.primary]);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.read_at);
    } else {
      return notifications.filter((n) => n.read_at);
    }
  }, [notifications, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    // Navigate to relevant page
    handleNotificationTap(notification);
  };

  const renderNotificationItem = (notification: Notification) => {
    const isUnread = !notification.read_at;
    const IconComponent = getNotificationIcon(notification.type);
    const iconColor = getNotificationIconColor(notification.type, currentTheme);

    return (
      <TouchableOpacity
        style={[
          dynamicStyles.notificationItem,
          isUnread && dynamicStyles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View
          style={[
            dynamicStyles.notificationIcon,
            { backgroundColor: iconColor + "20" },
          ]}
        >
          <IconComponent size={20} color={iconColor} />
        </View>

        <View style={dynamicStyles.notificationContent}>
          <Text
            style={[
              dynamicStyles.notificationTitle,
              isUnread && dynamicStyles.unreadTitle,
            ]}
          >
            {notification.title}
          </Text>
          <Text style={dynamicStyles.notificationMessage}>
            {notification.message}
          </Text>
          <Text style={dynamicStyles.notificationTime}>
            {formatTimeAgo(notification.created_at)}
          </Text>
          {notification.priority === "high" && (
            <View
              style={[
                dynamicStyles.priorityBadge,
                { backgroundColor: currentTheme.error + "20" },
              ]}
            >
              <Text
                style={[
                  dynamicStyles.priorityText,
                  { color: currentTheme.error },
                ]}
              >
                High Priority
              </Text>
            </View>
          )}
        </View>

        <View style={dynamicStyles.notificationActions}>
          {isUnread && (
            <TouchableOpacity
              style={dynamicStyles.actionIcon}
              onPress={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
              }}
            >
              <CheckCircle2 size={18} color={currentTheme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={dynamicStyles.actionIcon}
            onPress={(e) => {
              e.stopPropagation();
              deleteNotification(notification.id);
            }}
          >
            <Trash2 size={18} color={currentTheme.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <StatusBar
          barStyle={themeName === "dark" ? "light-content" : "dark-content"}
          backgroundColor={currentTheme.surface}
        />
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={dynamicStyles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <StatusBar
        barStyle={themeName === "dark" ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.surface}
      />

      {/* Tab Buttons */}
      <View style={dynamicStyles.tabContainer}>
        <TouchableOpacity
          style={[
            dynamicStyles.tab,
            activeTab === "unread" && dynamicStyles.activeTab,
          ]}
          onPress={() => setActiveTab("unread")}
        >
          <Text
            style={[
              dynamicStyles.tabText,
              activeTab === "unread" && dynamicStyles.activeTabText,
            ]}
          >
            Unread ({notifications.filter((n) => !n.read_at).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.tab,
            activeTab === "read" && dynamicStyles.activeTab,
          ]}
          onPress={() => setActiveTab("read")}
        >
          <Text
            style={[
              dynamicStyles.tabText,
              activeTab === "read" && dynamicStyles.activeTabText,
            ]}
          >
            Read
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
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
          <View style={dynamicStyles.emptyContainer}>
            <View style={dynamicStyles.emptyIcon}>
              <Bell size={48} color={currentTheme.textSecondary} />
            </View>
            <Text style={dynamicStyles.emptyTitle}>
              No {activeTab} Notifications
            </Text>
            <Text style={dynamicStyles.emptySubtitle}>
              {activeTab === "unread"
                ? "You're all caught up! New notifications will appear here."
                : "No read notifications yet."}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={({ item }) => renderNotificationItem(item)}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={currentTheme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
