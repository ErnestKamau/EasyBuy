// app/modal.tsx - Notification Center
import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { useAuth } from '@/app/_layout';
import {
  Bell,
  X,
  Check,
  CheckCircle2,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  Package,
  Clock,
  Trash2,
  Settings,
  ChevronRight,
} from 'lucide-react-native';

// Helper function to create dynamic styles
const createDynamicStyles = (currentTheme: any, themeName: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: currentTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: themeName === 'dark' ? 0.3 : 0.05,
    shadowRadius: 4,
    elevation: themeName === 'dark' ? 8 : 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: currentTheme.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: currentTheme.background,
  },
  loadingText: {
    fontSize: 16,
    color: currentTheme.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: currentTheme.border + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: currentTheme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: currentTheme.textSecondary,
    textAlign: 'center',
  },
  notificationGroup: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: currentTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: currentTheme.textSecondary,
    textTransform: 'uppercase',
  },
  groupCount: {
    fontSize: 12,
    fontWeight: '600',
    color: currentTheme.primary,
    backgroundColor: currentTheme.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notificationItem: {
    backgroundColor: currentTheme.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border + '40',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadNotification: {
    backgroundColor: currentTheme.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: currentTheme.primary,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: currentTheme.text,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

// Group notifications by type and time window
const groupNotifications = (notifications: Notification[]): Array<{
  type: string;
  title: string;
  notifications: Notification[];
  timeWindow: string;
}> => {
  const groups: Record<string, Notification[]> = {};
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  notifications.forEach(notification => {
    const createdAt = new Date(notification.created_at);
    const isRecent = createdAt >= oneHourAgo;
    const groupKey = isRecent ? `${notification.type}_recent` : `${notification.type}_older`;

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });

  // Convert to array and sort
  return Object.entries(groups)
    .map(([key, notifs]) => {
      const type = notifs[0].type;
      const isRecent = key.includes('_recent');
      const count = notifs.length;

      let title = '';
      switch (type) {
        case 'order_placed':
          title = count === 1 ? 'New Order' : `${count} New Orders`;
          break;
        case 'order_confirmed':
          title = count === 1 ? 'Order Confirmed' : `${count} Orders Confirmed`;
          break;
        case 'order_cancelled':
          title = count === 1 ? 'Order Cancelled' : `${count} Orders Cancelled`;
          break;
        case 'debt_warning_2days':
          title = count === 1 ? 'Payment Due Soon' : `${count} Payments Due Soon`;
          break;
        case 'debt_warning_admin_2days':
          title = count === 1 ? 'Customer Payment Due' : `${count} Customer Payments Due`;
          break;
        case 'debt_overdue':
          title = count === 1 ? 'Payment Overdue' : `${count} Payments Overdue`;
          break;
        case 'debt_overdue_admin':
          title = count === 1 ? 'Customer Payment Overdue' : `${count} Customer Payments Overdue`;
          break;
        case 'payment_received':
          title = count === 1 ? 'Payment Received' : `${count} Payments Received`;
          break;
        case 'payment_received_admin':
          title = count === 1 ? 'Payment Received' : `${count} Payments Received`;
          break;
        case 'sale_fully_paid':
          title = count === 1 ? 'Payment Complete' : `${count} Payments Complete`;
          break;
        case 'low_stock_alert':
          title = count === 1 ? 'Low Stock Alert' : `${count} Low Stock Alerts`;
          break;
        case 'refund_processed':
          title = count === 1 ? 'Refund Processed' : `${count} Refunds Processed`;
          break;
        case 'new_product_available':
          title = count === 1 ? 'New Product' : `${count} New Products`;
          break;
        default:
          title = `${count} Notifications`;
      }

      return {
        type,
        title,
        notifications: notifs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        timeWindow: isRecent ? 'recent' : 'older',
      };
    })
    .sort((a, b) => {
      // Sort by time window (recent first), then by type
      if (a.timeWindow !== b.timeWindow) {
        return a.timeWindow === 'recent' ? -1 : 1;
      }
      return new Date(b.notifications[0].created_at).getTime() - 
             new Date(a.notifications[0].created_at).getTime();
    });
};

// Get icon for notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order_placed':
    case 'order_confirmed':
    case 'order_cancelled':
      return ShoppingBag;
    case 'payment_received':
    case 'payment_received_admin':
    case 'sale_fully_paid':
      return CreditCard;
    case 'debt_warning_2days':
    case 'debt_warning_admin_2days':
    case 'debt_overdue':
    case 'debt_overdue_admin':
      return AlertTriangle;
    case 'low_stock_alert':
      return Package;
    case 'refund_processed':
      return CreditCard;
    case 'new_product_available':
      return Package;
    default:
      return Bell;
  }
};

// Get icon color for notification type
const getNotificationIconColor = (type: string, currentTheme: any) => {
  switch (type) {
    case 'order_placed':
    case 'order_confirmed':
      return currentTheme.success;
    case 'order_cancelled':
    case 'debt_overdue':
    case 'debt_overdue_admin':
      return currentTheme.error;
    case 'debt_warning_2days':
    case 'debt_warning_admin_2days':
      return currentTheme.warning;
    case 'payment_received':
    case 'payment_received_admin':
    case 'sale_fully_paid':
      return currentTheme.success;
    case 'low_stock_alert':
      return currentTheme.warning;
    case 'refund_processed':
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

  if (diffMins < 1) return 'Just now';
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
  const { user } = useAuth();
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const dynamicStyles = createDynamicStyles(currentTheme, themeName);

  // Group notifications
  const groupedNotifications = useMemo(() => {
    return groupNotifications(notifications);
  }, [notifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
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
        <View style={[dynamicStyles.notificationIcon, { backgroundColor: iconColor + '20' }]}>
          <IconComponent size={20} color={iconColor} />
        </View>
        
        <View style={dynamicStyles.notificationContent}>
          <Text style={[
            dynamicStyles.notificationTitle,
            isUnread && dynamicStyles.unreadTitle,
          ]}>
            {notification.title}
          </Text>
          <Text style={dynamicStyles.notificationMessage}>
            {notification.message}
          </Text>
          <Text style={dynamicStyles.notificationTime}>
            {formatTimeAgo(notification.created_at)}
          </Text>
          {notification.priority === 'high' && (
            <View style={[dynamicStyles.priorityBadge, { backgroundColor: currentTheme.error + '20' }]}>
              <Text style={[dynamicStyles.priorityText, { color: currentTheme.error }]}>
                High Priority
              </Text>
            </View>
          )}
        </View>

        <View style={dynamicStyles.notificationActions}>
          {isUnread && (
            <TouchableOpacity
              style={dynamicStyles.actionIcon}
              onPress={() => markAsRead(notification.id)}
            >
              <CheckCircle2 size={18} color={currentTheme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={dynamicStyles.actionIcon}
            onPress={() => deleteNotification(notification.id)}
          >
            <Trash2 size={18} color={currentTheme.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroup = (group: { type: string; title: string; notifications: Notification[]; timeWindow: string }) => {
    const groupKey = `${group.type}_${group.timeWindow}`;
    const isExpanded = expandedGroups.has(groupKey);
    const unreadInGroup = group.notifications.filter(n => !n.read_at).length;

    return (
      <View key={groupKey} style={dynamicStyles.notificationGroup}>
        <TouchableOpacity
          style={dynamicStyles.groupHeader}
          onPress={() => toggleGroup(groupKey)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={dynamicStyles.groupTitle}>{group.title}</Text>
            {unreadInGroup > 0 && (
              <View style={dynamicStyles.groupCount}>
                <Text style={{ color: currentTheme.primary, fontSize: 11, fontWeight: '700' }}>
                  {unreadInGroup}
                </Text>
              </View>
            )}
          </View>
          <ChevronRight
            size={16}
            color={currentTheme.textSecondary}
            style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View>
            {group.notifications.map(notification => (
              <View key={notification.id}>
                {renderNotificationItem(notification)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <StatusBar
          barStyle={themeName === 'dark' ? "light-content" : "dark-content"}
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
        barStyle={themeName === 'dark' ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.surface}
      />

      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        <View style={dynamicStyles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={dynamicStyles.actionButton}
              onPress={markAllAsRead}
            >
              <Check size={20} color={currentTheme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={dynamicStyles.actionButton}
            onPress={() => router.back()}
          >
            <X size={24} color={currentTheme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
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
            <Text style={dynamicStyles.emptyTitle}>No Notifications</Text>
            <Text style={dynamicStyles.emptySubtitle}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={groupedNotifications}
          renderItem={({ item }) => renderGroup(item)}
          keyExtractor={(item) => `${item.type}_${item.timeWindow}`}
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
