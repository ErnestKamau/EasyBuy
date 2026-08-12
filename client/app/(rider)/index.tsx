import React, { useCallback, useEffect, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { RefreshCw, Power } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useRider } from '@/contexts/RiderContext';
import { Order, deliveryApi } from '@/services/api';
import { websocketService } from '@/services/websocket';
import { ToastService } from '@/utils/toastService';
import {
  Text,
  Button,
  IconButton,
  GlassSurface,
  Spinner,
  EmptyState,
  OrderCard,
} from '@/components/ui';
import { ScrollView } from 'react-native';

export default function RiderAssignedScreen() {
  const theme = useAppTheme();
  const { isOnline, toggleOnline, setActiveOrderId } = useRider();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const list = await deliveryApi.getAssignedDeliveries();
      setOrders(list);
      const active = list.find((o) =>
        ['assigned', 'driver_accepted', 'en_route', 'arrived'].includes(o.fulfillment_status)
      );
      setActiveOrderId(active?.id ?? null);
    } catch {
      ToastService.showError('Error', 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  }, [setActiveOrderId]);

  useEffect(() => {
    fetchAssignments();
    const refresh = () => fetchAssignments();
    websocketService.on('order.status.updated', refresh);
    websocketService.on('order.assigned', refresh);
    return () => {
      websocketService.off('order.status.updated', refresh);
      websocketService.off('order.assigned', refresh);
    };
  }, [fetchAssignments]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing[5], paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchAssignments} />
        }
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing[5],
          }}
        >
          <Text variant="title">Assigned ({orders.length})</Text>
          <IconButton
            icon={<RefreshCw size={18} color={theme.colors.primary} />}
            onPress={fetchAssignments}
            accessibilityLabel="Refresh assignments"
          />
        </View>

        {!isOnline && orders.length > 0 && (
          <GlassSurface level={2} borderRadius={theme.radius.lg} style={{ marginBottom: theme.spacing[4] }}>
            <View
              style={{
                padding: theme.spacing[4],
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: theme.spacing[3],
              }}
            >
              <Text variant="bodySmall" color="secondary" style={{ flex: 1 }}>
                You are offline. Go online to share live location.
              </Text>
              <Button title="Go online" onPress={() => toggleOnline(true)} />
            </View>
          </GlassSurface>
        )}

        {loading && orders.length === 0 ? (
          <Spinner size="large" />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No assigned deliveries"
            message={
              isOnline
                ? 'New jobs will appear here when an admin assigns you.'
                : 'Go online from your profile to receive assignments.'
            }
          />
        ) : (
          orders.map((order) => (
            <View key={order.id} style={{ marginBottom: theme.spacing[4] }}>
              <OrderCard
                order={order}
                onPress={() => router.push(`/(rider)/job/${order.id}` as any)}
              />
            </View>
          ))
        )}
      </ScrollView>

      {!isOnline && orders.length === 0 && (
        <GlassSurface
          level={2}
          borderRadius={0}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View style={{ alignItems: 'center', padding: theme.spacing[8] }}>
            <Power size={48} color={theme.colors.textSecondary} />
            <Text variant="title" style={{ marginTop: theme.spacing[4], marginBottom: theme.spacing[6] }}>
              You are currently offline
            </Text>
            <Button title="Go Online" onPress={() => toggleOnline(true)} />
          </View>
        </GlassSurface>
      )}
    </View>
  );
}
