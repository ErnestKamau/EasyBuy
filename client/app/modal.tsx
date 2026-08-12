import React, { useMemo, useState } from 'react';
import { View, FlatList, RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Check, RefreshCw } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/services/api';
import {
  Screen,
  AppHeader,
  SegmentedControl,
  EmptyState,
  NotificationCard,
  SkeletonList,
  IconButton,
  FAB,
} from '@/components/ui';

const handleNotificationTap = (notification: Notification) => {
  const data = notification.data || {};
  if (data.order_id) {
    router.push(`/order/${data.order_id}` as any);
  }
};

export default function NotificationInbox() {
  const theme = useAppTheme();
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
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') return notifications.filter((n) => !n.read_at);
    return notifications.filter((n) => n.read_at);
  }, [notifications, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handlePress = async (notification: Notification) => {
    if (!notification.read_at) await markAsRead(notification.id);
    handleNotificationTap(notification);
  };

  const padH = theme.spacing[5];
  const padBottom = theme.spacing[11];

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <AppHeader
        title="Inbox"
        showBack
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        glass={false}
        right={
          unreadCount > 0 ? (
            <IconButton
              accessibilityLabel="Mark all as read"
              icon={<Check size={20} color={theme.colors.primary} />}
              onPress={markAllAsRead}
            />
          ) : undefined
        }
      />

      <View
        style={{
          paddingHorizontal: padH,
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[5],
        }}
      >
        <SegmentedControl
          options={[
            {
              value: 'unread',
              label: `Unread (${notifications.filter((n) => !n.read_at).length})`,
            },
            { value: 'read', label: 'Read' },
          ]}
          value={activeTab}
          onChange={(v) => setActiveTab(v as 'unread' | 'read')}
        />
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: padH, paddingTop: theme.spacing[2] }}>
          <SkeletonList count={5} />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          <EmptyState
            illustration="inbox"
            title={
              activeTab === 'unread'
                ? 'You have no messages yet'
                : 'No read messages yet'
            }
            message={
              activeTab === 'unread'
                ? 'When messages appear, you will see them here.'
                : 'Notifications you have already opened will live here.'
            }
            onRefresh={onRefresh}
          />
        </ScrollView>
      ) : (
        <>
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                onPress={() => handlePress(item)}
                onMarkRead={
                  !item.read_at ? () => markAsRead(item.id) : undefined
                }
                onDelete={() => deleteNotification(item.id)}
              />
            )}
            ItemSeparatorComponent={() => (
              <View style={{ height: theme.spacing[3] }} />
            )}
            contentContainerStyle={{
              paddingHorizontal: padH,
              paddingTop: theme.spacing[2],
              paddingBottom: padBottom,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
          />
          <FAB
            accessibilityLabel="Refresh inbox"
            icon={<RefreshCw size={22} color={theme.colors.text} />}
            onPress={onRefresh}
          />
        </>
      )}
    </Screen>
  );
}
