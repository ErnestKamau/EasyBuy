import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Calendar, CreditCard } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { GlassSurface } from './GlassSurface';
import { ProgressBar } from './Progress';
import { PriceText } from './PriceText';
import { Order } from '@/services/api';

const FULFILLMENT_PROGRESS: Record<string, number> = {
  pending: 0.15,
  preparing: 0.3,
  assigned: 0.4,
  driver_accepted: 0.5,
  ready: 0.5,
  en_route: 0.7,
  arrived: 0.85,
  delivered: 1,
  picked_up: 1,
  cancelled: 0,
};

const FULFILLMENT_LABEL: Record<string, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  assigned: 'Assigned',
  driver_accepted: 'Accepted',
  ready: 'Ready for pickup',
  en_route: 'On the way',
  arrived: 'Driver arrived',
  delivered: 'Delivered',
  picked_up: 'Picked up',
  cancelled: 'Cancelled',
};

function headlineFor(order: Order): string {
  const first = order.items?.[0]?.product?.name;
  if (first) {
    const extra = (order.items?.length ?? 1) - 1;
    return extra > 0 ? `${first} +${extra}` : first;
  }
  return FULFILLMENT_LABEL[order.fulfillment_status] ?? order.fulfillment_status;
}

type OrderCardProps = {
  order: Order;
  onPress?: () => void;
  pressable?: boolean;
  children?: React.ReactNode;
};

export function OrderCard({ order, onPress, pressable = true, children }: OrderCardProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const progress = FULFILLMENT_PROGRESS[order.fulfillment_status] ?? 0.2;
  const statusLabel = FULFILLMENT_LABEL[order.fulfillment_status] ?? order.fulfillment_status;
  const itemCount = order.items?.length ?? 0;
  const dateLabel = order.order_date
    ? new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const payment = order.payment_method?.toUpperCase() || order.payment_status?.replace('-', ' ');
  const isUrgent =
    order.fulfillment_status === 'en_route' || order.fulfillment_status === 'arrived';

  const handlePress = () => {
    if (onPress) onPress();
    else router.push(`/order/${order.id}` as any);
  };

  const inner = (
      <GlassSurface level={2} borderRadius={theme.radius.lg}>
        <View style={{ padding: theme.spacing[4], gap: theme.spacing[3] }}>
          <Text variant="overline" color="muted">
            #{order.order_number}
          </Text>
          <Text
            variant="h3"
            numberOfLines={1}
            style={{ fontSize: 24, lineHeight: 30 }}
          >
            {headlineFor(order)}
          </Text>
          <Text variant="subtitle" color="secondary" style={{ fontSize: 16, lineHeight: 22 }}>
            {statusLabel}
            {itemCount > 0 ? `  ·  ${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : ''}
          </Text>

          <View style={{ gap: theme.spacing[2], marginTop: theme.spacing[1] }}>
            <ProgressBar progress={progress} height={4} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="caption" color="muted">
                {Math.round(progress * 100)} of 100% done
              </Text>
              <PriceText amount={order.total_amount} size="sm" />
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing[4],
              marginTop: theme.spacing[1],
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Package size={14} color={theme.colors.textMuted} />
              <Text variant="caption" color="muted" style={{ fontSize: 14 }}>
                {itemCount || '—'} items
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CreditCard size={14} color={theme.colors.textMuted} />
              <Text variant="caption" color="muted" style={{ fontSize: 14 }}>
                {payment || 'Unpaid'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Calendar
                size={14}
                color={isUrgent ? theme.colors.warning : theme.colors.textMuted}
              />
              <Text
                variant="caption"
                style={{
                  fontSize: 14,
                  color: isUrgent ? theme.colors.warning : theme.colors.textMuted,
                }}
              >
                {isUrgent ? statusLabel : dateLabel || '—'}
              </Text>
            </View>
          </View>
          {children}
        </View>
      </GlassSurface>
  );

  if (!pressable) {
    return inner;
  }

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
      {inner}
    </Pressable>
  );
}

export { FULFILLMENT_LABEL, FULFILLMENT_PROGRESS };
