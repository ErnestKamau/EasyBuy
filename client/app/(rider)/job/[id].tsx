import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Phone,
  Navigation,
  MapPin,
  Package,
  CheckCircle2,
} from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useRider } from '@/contexts/RiderContext';
import { Order, deliveryApi } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import {
  Text,
  Button,
  IconButton,
  Surface,
  Spinner,
  KeyValueRow,
  Divider,
  MediaContainer,
} from '@/components/ui';

export default function RiderJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const { setActiveOrderId } = useRider();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await deliveryApi.getDelivery(Number(id));
      setOrder(data);
      setActiveOrderId(data.id);
    } catch {
      ToastService.showError('Error', 'Failed to load delivery');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, setActiveOrderId]);

  useEffect(() => {
    load();
  }, [load]);

  const arrived = order?.fulfillment_status === 'arrived';
  const phone = arrived ? order?.user?.phone_number : undefined;
  const lat = Number(order?.delivery_lat);
  const lng = Number(order?.delivery_lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const runAction = async (fn: () => Promise<any>, ok: string) => {
    try {
      setActing(true);
      await fn();
      ToastService.showSuccess('Success', ok);
      await load();
    } catch (e) {
      ToastService.showApiError(e, 'Action failed');
    } finally {
      setActing(false);
    }
  };

  const openDirections = () => {
    if (!hasCoords) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (loading || !order) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {hasCoords && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ height: 220 }}
          initialRegion={{
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{ latitude: lat, longitude: lng }}
            title="Deliver here"
            description={order.delivery_address}
          />
        </MapView>
      )}

      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingBottom: 48 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="muted">
              Deliver to
            </Text>
            <Text variant="h3">
              {arrived
                ? `${order.user?.first_name ?? ''} ${order.user?.last_name ?? ''}`.trim() || 'Customer'
                : 'Customer'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: theme.spacing[2] }}>
              <MapPin size={16} color={theme.colors.primary} />
              <Text variant="body" color="secondary" style={{ flex: 1 }}>
                {order.delivery_address || 'Address unavailable'}
              </Text>
            </View>
          </View>
          {arrived && phone && (
            <IconButton
              icon={<Phone size={20} color={theme.colors.primary} />}
              onPress={() => Linking.openURL(`tel:${phone}`)}
              accessibilityLabel="Call customer"
            />
          )}
        </View>

        <Button
          title="Directions"
          onPress={openDirections}
          leftIcon={<Navigation size={18} color={theme.colors.textOnPrimary} />}
          style={{ marginTop: theme.spacing[4] }}
          disabled={!hasCoords}
        />

        <Surface variant="elevated" padding={4} radius="lg" style={{ marginTop: theme.spacing[5] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing[3] }}>
            <Package size={16} color={theme.colors.primary} />
            <Text variant="label">{order.items?.length ?? 0} items</Text>
          </View>
          {(order.items ?? []).map((item) => (
            <View
              key={item.id}
              style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[3] }}
            >
              <View style={{ width: 44 }}>
                <MediaContainer
                  uri={item.product?.image_url}
                  aspectRatio="1:1"
                  borderRadius={8}
                  style={{ width: 44 }}
                />
              </View>
              <Text variant="body" style={{ flex: 1 }}>
                {item.quantity}x {item.product?.name ?? 'Item'}
              </Text>
            </View>
          ))}
        </Surface>

        {order.fulfillment_status === 'assigned' && (
          <Button
            title="Accept assignment"
            loading={acting}
            onPress={() => runAction(() => deliveryApi.acceptDelivery(order.id), 'Assignment accepted')}
            leftIcon={<CheckCircle2 size={18} color={theme.colors.textOnPrimary} />}
            style={{ marginTop: theme.spacing[5] }}
            fullWidth
          />
        )}
        {order.fulfillment_status === 'driver_accepted' && (
          <Button
            title="Start trip"
            loading={acting}
            onPress={() => runAction(() => deliveryApi.startDelivery(order.id), 'Trip started')}
            style={{ marginTop: theme.spacing[5] }}
            fullWidth
          />
        )}
        {order.fulfillment_status === 'en_route' && (
          <Button
            title="I've arrived"
            loading={acting}
            onPress={() => runAction(() => deliveryApi.arriveDelivery(order.id), 'Arrival declared')}
            style={{ marginTop: theme.spacing[5] }}
            fullWidth
          />
        )}

        {arrived && order.payment_timing === 'on_delivery' && order.payment_status !== 'fully-paid' && (
          <Surface variant="elevated" padding={4} radius="lg" style={{ marginTop: theme.spacing[5] }}>
            <Text variant="label">Collect payment first</Text>
            <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.spacing[2] }}>
              {order.payment_method === 'cash'
                ? 'Confirm cash before showing the handover QR.'
                : `Waiting for the customer to pay by ${order.payment_method === 'mpesa' ? 'M-Pesa' : 'card'}.`}
            </Text>
            {order.payment_method === 'cash' && (
              <Button
                title="Confirm cash received"
                loading={acting}
                onPress={() => runAction(() => deliveryApi.collectCash(order.id), 'Cash recorded')}
                style={{ marginTop: theme.spacing[4] }}
                fullWidth
              />
            )}
          </Surface>
        )}

        {arrived && (order.payment_timing !== 'on_delivery' || order.payment_status === 'fully-paid') && (
          <Surface variant="elevated" padding={4} radius="lg" style={{ marginTop: theme.spacing[5], alignItems: 'center' }}>
            <Text variant="label" style={{ marginBottom: theme.spacing[3] }}>
              Show this QR to the customer
            </Text>
            {order.delivery_qr_code ? (
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(order.delivery_qr_code)}`,
                }}
                style={{ width: 240, height: 240, backgroundColor: '#fff', borderRadius: 12 }}
              />
            ) : (
              <Text variant="body" color="secondary">Generating code…</Text>
            )}
            <Text variant="caption" color="muted" style={{ marginTop: theme.spacing[3], textAlign: 'center' }}>
              {order.delivery_qr_code}
            </Text>
            <Text variant="caption" color="muted" style={{ marginTop: theme.spacing[2], textAlign: 'center' }}>
              Customer scans this code in the app to confirm receipt.
            </Text>
            {phone && (
              <>
                <Divider style={{ marginVertical: theme.spacing[4], alignSelf: 'stretch' }} />
                <KeyValueRow label="Customer phone" value={phone} />
              </>
            )}
          </Surface>
        )}
      </ScrollView>
    </View>
  );
}
