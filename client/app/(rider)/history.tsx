import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Order, deliveryApi } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import { Text, Spinner, EmptyState, OrderCard } from '@/components/ui';

export default function RiderHistoryScreen() {
  const theme = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await deliveryApi.getDeliveryHistory();
      setOrders(list);
    } catch {
      ToastService.showError('Error', 'Failed to load delivery history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing[5], paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text variant="title" style={{ marginBottom: theme.spacing[5] }}>
          Past deliveries
        </Text>
        {loading && orders.length === 0 ? (
          <Spinner size="large" />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No deliveries yet"
            message="Completed jobs will show up here."
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
    </View>
  );
}
