import React, { useCallback, useEffect, useState } from 'react';
import { View, Linking, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import {
  MapPin,
  Phone,
  Mail,
  Truck,
  Store,
  Package,
  ChefHat,
  Home,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  LucideIcon,
} from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { ordersApi, Order, Payment } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import { getReducedMotion, subscribeReducedMotion } from '@/design/tokens/motion';
import {
  Screen,
  AppHeader,
  Text,
  TrackStepper,
  TrackStep,
  StatusPill,
  MediaContainer,
  SummaryCard,
  KeyValueRow,
  Button,
  FloatingGlassBar,
  ActionSheet,
  EmptyState,
  SkeletonList,
  GlassSurface,
  Divider,
} from '@/components/ui';

type HeroKey = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

const HERO_ICON: Record<HeroKey, LucideIcon> = {
  pending: Package,
  preparing: ChefHat,
  delivering: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

function formatKes(amount: number) {
  return `KES ${Number(amount || 0).toLocaleString()}`;
}

function formatWeight(weight: number | null | undefined): string {
  if (!weight) return '';
  const whole = Math.floor(weight);
  const decimal = weight - whole;
  if (decimal === 0) return `${whole}KG`;
  if (decimal === 0.5) return whole === 0 ? '1/2KG' : `${whole} 1/2KG`;
  return `${weight}KG`;
}

function itemSubtotal(item: NonNullable<Order['items']>[number]): number {
  if (item.subtotal && item.subtotal > 0) return item.subtotal;
  const unit = item.unit_price || 0;
  if (item.kilogram && item.kilogram > 0) return unit * item.kilogram;
  if (item.quantity && item.quantity > 0) return unit * item.quantity;
  return 0;
}

function orderSubtotal(order: Order): number {
  if (order.total_amount && order.total_amount > 0) return order.total_amount;
  return (order.items ?? []).reduce((sum, item) => sum + itemSubtotal(item), 0);
}

function uniquePayments(order: Order): Payment[] {
  const all = [...(order.sale?.payments ?? []), ...(order.payments ?? [])];
  const seen = new Set<number>();
  return all.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function heroFor(order: Order): {
  key: HeroKey;
  title: string;
  body: string;
  step: number;
  steps: TrackStep[];
} {
  const deliverySteps: TrackStep[] = [
    { key: 'placed', label: 'Placed', Icon: Package },
    { key: 'preparing', label: 'Preparing', Icon: ChefHat },
    { key: 'delivering', label: 'On the way', Icon: Truck },
    { key: 'delivered', label: 'Delivered', Icon: Home },
  ];
  const pickupSteps: TrackStep[] = [
    { key: 'placed', label: 'Placed', Icon: Package },
    { key: 'preparing', label: 'Preparing', Icon: ChefHat },
    { key: 'ready', label: 'Ready', Icon: ShoppingBag },
    { key: 'picked', label: 'Picked up', Icon: Store },
  ];
  const steps = order.type === 'delivery' ? deliverySteps : pickupSteps;

  if (order.order_status === 'cancelled') {
    return {
      key: 'cancelled',
      title: 'Cancelled',
      body: 'This order was cancelled. Need a hand? Support is a tap away.',
      step: 0,
      steps,
    };
  }

  const f = order.fulfillment_status;
  if (f === 'delivered' || f === 'picked_up') {
    return {
      key: 'delivered',
      title: f === 'picked_up' ? 'Picked up' : 'Delivered',
      body: 'All done — thanks for shopping with EasyBuy.',
      step: 4,
      steps,
    };
  }
  if (f === 'assigned' || f === 'driver_accepted' || f === 'en_route' || f === 'arrived') {
    return {
      key: 'delivering',
      title: f === 'arrived' ? 'Driver arrived' : 'On the way',
      body:
        f === 'arrived'
          ? 'Your rider is at the door. Have your code ready.'
          : 'Your order is heading to you right now.',
      step: 2,
      steps,
    };
  }
  if (f === 'ready') {
    return {
      key: 'preparing',
      title: 'Ready for pickup',
      body: 'Your order is waiting at the shop.',
      step: 2,
      steps,
    };
  }
  if (f === 'preparing' || order.order_status === 'confirmed') {
    return {
      key: 'preparing',
      title: 'Preparing',
      body: 'We are packing your items with care.',
      step: 1,
      steps,
    };
  }
  return {
    key: 'pending',
    title: 'Order placed',
    body: 'Hang tight — we will confirm this shortly.',
    step: 0,
    steps,
  };
}

function canTrack(order: Order) {
  if (order.type !== 'delivery') return false;
  if (order.order_status === 'pending' || order.order_status === 'cancelled') return false;
  const f = order.fulfillment_status;
  return f !== 'delivered' && f !== 'picked_up';
}

export default function OrderDetailScreen(): React.ReactNode {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const { markOrderNotificationsAsRead } = useNotifications();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    getReducedMotion().then(setReduceMotion);
    return subscribeReducedMotion(setReduceMotion);
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await ordersApi.getOrderDetails(Number.parseInt(id, 10));
      setOrder(data);
      await markOrderNotificationsAsRead(data.id);
    } catch {
      ToastService.showError('Error', 'Failed to load order details');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, markOrderNotificationsAsRead]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancel = async () => {
    if (!order) return;
    try {
      setCancelling(true);
      await ordersApi.cancelOrder(order.id);
      ToastService.showSuccess('Order cancelled', 'Your order has been cancelled');
      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel order';
      ToastService.showError('Error', message);
    } finally {
      setCancelling(false);
    }
  };

  const enter = (delay: number) =>
    reduceMotion ? undefined : FadeInDown.delay(delay).duration(theme.duration.slow);

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Order" showBack />
        <View style={{ padding: theme.spacing[6] }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <AppHeader title="Order" showBack />
        <EmptyState
          illustration="error"
          title="Order not found"
          message="This order may have been removed."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const hero = heroFor(order);
  const subtotal = orderSubtotal(order);
  const deliveryFee = order.type === 'delivery' ? Number(order.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;
  const payments = uniquePayments(order);
  const showTrack = canTrack(order);
  const showCancelBtn = order.order_status === 'pending';
  const bottomInset = showTrack || showCancelBtn ? 108 : theme.spacing[8];

  return (
    <Screen>
      <AppHeader title={order.order_number} subtitle="Order details" showBack glass />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing[5],
          paddingTop: theme.spacing[5],
          paddingBottom: bottomInset,
          gap: theme.spacing[5],
        }}
      >
        <Animated.View entering={enter(40)}>
          <StatusHero order={order} hero={hero} />
        </Animated.View>

        {order.items && order.items.length > 0 && (
          <Animated.View entering={enter(80)}>
            <GlassSurface level={1} borderRadius={theme.radius.lg}>
              <View style={{ padding: theme.spacing[5], gap: theme.spacing[4] }}>
                <Text variant="title">Items</Text>
                {order.items.map((item, i) => (
                  <View key={item.id}>
                    {i > 0 && <Divider style={{ marginBottom: theme.spacing[4] }} />}
                    <View style={{ flexDirection: 'row', gap: theme.spacing[4] }}>
                      <MediaContainer
                        uri={item.product?.image_url}
                        aspectRatio="1:1"
                        style={{ width: 64, height: 64 }}
                        borderRadius={theme.radius.md}
                      />
                      <View style={{ flex: 1, gap: 2, justifyContent: 'center' }}>
                        <Text variant="body" numberOfLines={2} style={{ fontFamily: theme.fontFamily.body.semiBold }}>
                          {item.product?.name || 'Product'}
                        </Text>
                        <Text variant="caption" color="muted">
                          {item.kilogram
                            ? `${formatWeight(item.kilogram)} · ${formatKes(item.unit_price)}/kg`
                            : `Qty ${item.quantity} · ${formatKes(item.unit_price)}`}
                        </Text>
                      </View>
                      <Text variant="label">{formatKes(itemSubtotal(item))}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </GlassSurface>
          </Animated.View>
        )}

        <Animated.View entering={enter(120)}>
          <SummaryCard
            title="Summary"
            rows={[
              { label: 'Subtotal', value: formatKes(subtotal) },
              ...(order.type === 'delivery'
                ? [{ label: 'Delivery', value: formatKes(deliveryFee) }]
                : []),
            ]}
            total={{ label: 'Total', value: formatKes(total) }}
          />
        </Animated.View>

        {order.sale && (
          <Animated.View entering={enter(160)}>
            <GlassSurface level={1} borderRadius={theme.radius.lg}>
              <View style={{ padding: theme.spacing[5], gap: theme.spacing[2] }}>
                <Text variant="title" style={{ marginBottom: theme.spacing[2] }}>
                  Payment
                </Text>
                <KeyValueRow label="Sale" value={order.sale.sale_number} />
                <KeyValueRow
                  label="Status"
                  value={(order.sale.payment_status || order.payment_status).replace(/-/g, ' ')}
                />
                {order.sale.total_paid > 0 && (
                  <KeyValueRow label="Paid" value={formatKes(order.sale.total_paid)} />
                )}
                {order.sale.balance > 0 && (
                  <KeyValueRow label="Balance" value={formatKes(order.sale.balance)} />
                )}
              </View>
            </GlassSurface>
          </Animated.View>
        )}

        {payments.length > 0 && (
          <Animated.View entering={enter(200)}>
            <GlassSurface level={1} borderRadius={theme.radius.lg}>
              <View style={{ padding: theme.spacing[5], gap: theme.spacing[3] }}>
                <Text variant="title">Transactions</Text>
                {payments.map((payment, i) => (
                  <View key={payment.id}>
                    {i > 0 && <Divider style={{ marginBottom: theme.spacing[3] }} />}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="body" style={{ fontFamily: theme.fontFamily.body.semiBold }}>
                          {(payment.payment_method || 'payment').toUpperCase()}
                        </Text>
                        <Text variant="caption" color="muted">
                          {new Date(payment.paid_at).toLocaleDateString()} · {payment.status}
                        </Text>
                      </View>
                      <Text
                        variant="label"
                        color={payment.status === 'refunded' ? 'success' : 'primary'}
                      >
                        {payment.status === 'refunded' ? '+' : ''}
                        {formatKes(Number(payment.amount))}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </GlassSurface>
          </Animated.View>
        )}

        <Animated.View entering={enter(240)}>
          <GlassSurface level={1} borderRadius={theme.radius.lg}>
            <View style={{ padding: theme.spacing[5], gap: theme.spacing[3] }}>
              <Text variant="title">
                {order.type === 'delivery' ? 'Delivery' : 'Pickup'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[3] }}>
                {order.type === 'delivery' ? (
                  <MapPin size={18} color={theme.colors.primary} />
                ) : (
                  <Store size={18} color={theme.colors.primary} />
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="body" style={{ fontFamily: theme.fontFamily.body.semiBold }}>
                    {order.type === 'delivery' ? 'Home delivery' : 'Pickup at shop'}
                  </Text>
                  {order.type === 'delivery' && order.delivery_address ? (
                    <Text variant="caption" color="muted">
                      {order.delivery_address}
                    </Text>
                  ) : null}
                  {order.pickup_time ? (
                    <Text variant="caption" color="muted">
                      Slot {new Date(order.pickup_time).toLocaleString()}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </GlassSurface>
        </Animated.View>

        {order.notes ? (
          <Animated.View entering={enter(260)}>
            <GlassSurface level={1} borderRadius={theme.radius.lg}>
              <View style={{ padding: theme.spacing[5], gap: theme.spacing[2] }}>
                <Text variant="title">Notes</Text>
                <Text variant="body" color="secondary">
                  {order.notes}
                </Text>
              </View>
            </GlassSurface>
          </Animated.View>
        ) : null}

        <Animated.View entering={enter(280)}>
          <GlassSurface level={1} borderRadius={theme.radius.lg}>
            <View style={{ padding: theme.spacing[5], gap: theme.spacing[3] }}>
              <Text variant="title">Need help?</Text>
              <Pressable
                onPress={() => Linking.openURL('tel:+254700000000')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4], minHeight: theme.touchTarget }}
              >
                <Phone size={18} color={theme.colors.primary} />
                <View>
                  <Text variant="caption" color="muted">
                    Phone
                  </Text>
                  <Text variant="body">+254 700 000 000</Text>
                </View>
              </Pressable>
              <Divider />
              <Pressable
                onPress={() =>
                  Linking.openURL(
                    `mailto:support@easybuy.com?subject=Order Inquiry - ${order.order_number}`,
                  )
                }
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4], minHeight: theme.touchTarget }}
              >
                <Mail size={18} color={theme.colors.primary} />
                <View>
                  <Text variant="caption" color="muted">
                    Email
                  </Text>
                  <Text variant="body">support@easybuy.com</Text>
                </View>
              </Pressable>
            </View>
          </GlassSurface>
        </Animated.View>
      </Animated.ScrollView>

      {(showTrack || showCancelBtn) && (
        <FloatingGlassBar>
          <View
            style={{
              padding: theme.spacing[3],
              gap: theme.spacing[2],
            }}
          >
            {showTrack && (
              <Button
                title="Track live delivery"
                fullWidth
                leftIcon={<MapPin size={18} color={theme.colors.textOnPrimary} />}
                onPress={() => router.push(`/order/track?id=${order.id}` as any)}
              />
            )}
            {showCancelBtn && (
              <Button
                title="Cancel order"
                variant={showTrack ? 'ghost' : 'danger'}
                fullWidth
                loading={cancelling}
                onPress={() => setShowCancel(true)}
              />
            )}
          </View>
        </FloatingGlassBar>
      )}

      <ActionSheet
        visible={showCancel}
        onClose={() => setShowCancel(false)}
        title={`Cancel ${order.order_number}? This cannot be undone.`}
        actions={[
          {
            label: 'Yes, cancel order',
            destructive: true,
            onPress: handleCancel,
          },
        ]}
      />
    </Screen>
  );
}

function StatusHero({
  order,
  hero,
}: {
  order: Order;
  hero: ReturnType<typeof heroFor>;
}) {
  const theme = useAppTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const pulse = useSharedValue(1);
  const Icon = HERO_ICON[hero.key];

  const tone =
    hero.key === 'cancelled'
      ? { bg: theme.colors.dangerMuted, fg: theme.colors.error, ring: theme.colors.error }
      : hero.key === 'delivered'
        ? { bg: theme.colors.successMuted, fg: theme.colors.success, ring: theme.colors.success }
        : hero.key === 'delivering'
          ? { bg: theme.colors.infoMuted, fg: theme.colors.info, ring: theme.colors.info }
          : { bg: theme.colors.primaryMuted, fg: theme.colors.primary, ring: theme.colors.primary };

  useEffect(() => {
    getReducedMotion().then(setReduceMotion);
    return subscribeReducedMotion(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion || hero.key === 'delivered' || hero.key === 'cancelled') {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: theme.duration.slow }),
        withTiming(1, { duration: theme.duration.slow }),
      ),
      -1,
      false,
    );
  }, [reduceMotion, hero.key, pulse, theme.duration.slow]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <GlassSurface level={2} borderRadius={theme.radius.xl}>
      <View style={{ padding: theme.spacing[6], alignItems: 'center', gap: theme.spacing[4] }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing[2], alignSelf: 'stretch', justifyContent: 'center' }}>
          <StatusPill
            status={
              order.order_status === 'cancelled'
                ? 'cancelled'
                : hero.key === 'delivering'
                  ? 'delivering'
                  : hero.key === 'delivered'
                    ? 'delivered'
                    : hero.key === 'preparing'
                      ? 'preparing'
                      : 'pending'
            }
          />
          <StatusPill
            status={
              order.payment_status === 'fully-paid'
                ? 'delivered'
                : order.payment_status === 'failed'
                  ? 'cancelled'
                  : 'pending'
            }
            label={order.payment_status.replace(/-/g, ' ')}
          />
        </View>

        {hero.key !== 'cancelled' && (
          <View style={{ alignSelf: 'stretch' }}>
            <TrackStepper steps={hero.steps} current={hero.step} />
          </View>
        )}

        <Animated.View style={pulseStyle}>
          <View
            style={{
              width: 112,
              height: 112,
              borderRadius: 56,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tone.bg,
              borderWidth: 1.5,
              borderColor: tone.ring + '55',
            }}
          >
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: tone.ring + '33',
              }}
            >
              <Icon size={40} color={tone.fg} strokeWidth={1.75} />
            </View>
          </View>
        </Animated.View>

        <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
          <Text
            variant="h3"
            style={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}
          >
            {hero.title}
          </Text>
          <Text variant="body" color="secondary" style={{ textAlign: 'center', maxWidth: 280 }}>
            {hero.body}
          </Text>
          <Text variant="caption" color="muted">
            {new Date(order.order_date).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
            {order.order_time ? ` · ${String(order.order_time).slice(0, 5)}` : ''}
          </Text>
        </View>
      </View>
    </GlassSurface>
  );
}
