import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, SectionList, RefreshControl, Pressable, ScrollView } from 'react-native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  CreditCard,
  Smartphone,
} from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import {
  paymentsApi,
  Payment,
  PaymentHistorySummary,
} from '@/services/api';
import { ToastService } from '@/utils/toastService';
import { getReducedMotion, subscribeReducedMotion } from '@/design/tokens/motion';
import {
  Screen,
  AppHeader,
  Text,
  Chip,
  SearchBar,
  EmptyState,
  SkeletonList,
  Spinner,
  GlassSurface,
  Card,
} from '@/components/ui';

type FilterKey = 'all' | 'completed' | 'refunded' | 'failed';

type Section = {
  title: string;
  data: Payment[];
};

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<Payment, Section>,
);

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: 'completed', label: 'Payments' },
  { key: 'refunded', label: 'Refunds' },
  { key: 'failed', label: 'Failed' },
];

function formatKes(amount: number) {
  return `KES ${Number(amount || 0).toLocaleString()}`;
}

function paymentOrderId(payment: Payment): number | null {
  return payment.sale?.order?.id ?? payment.order?.id ?? payment.order_id ?? null;
}

function paymentOrderNumber(payment: Payment): string {
  return (
    payment.sale?.order?.order_number ??
    payment.order?.order_number ??
    payment.payment_number
  );
}

function dateLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const rest = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  if (sameDay(date, today)) return `Today, ${rest}`;
  if (sameDay(date, yesterday)) return `Yesterday, ${rest}`;
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function groupByDate(items: Payment[]): Section[] {
  const map = new Map<string, Payment[]>();
  for (const item of items) {
    const key = dateLabel(item.paid_at || item.created_at);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function TransactionHistoryScreen() {
  const theme = useAppTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentHistorySummary>({
    spent: 0,
    refunded: 0,
    pending: 0,
    count: 0,
  });
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    getReducedMotion().then(setReduceMotion);
    return subscribeReducedMotion(setReduceMotion);
  }, []);

  const load = useCallback(async (pageNum: number, reset: boolean) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params: Parameters<typeof paymentsApi.getHistory>[0] = {
        page: pageNum,
        per_page: 30,
      };
      if (filter !== 'all') params.status = filter;

      const result = await paymentsApi.getHistory(params);
      setSummary(result.summary);
      setPayments((prev) => (reset ? result.data : [...prev, ...result.data]));
      setHasMore(result.current_page < result.last_page);
      setPage(pageNum);
    } catch {
      ToastService.showError('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    load(1, true);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => {
      const hay = [
        p.payment_number,
        p.payment_method,
        p.status,
        p.reference,
        paymentOrderNumber(p),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [payments, query]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  const onRefresh = () => {
    setRefreshing(true);
    load(1, true);
  };

  return (
    <Screen>
      <AppHeader title="History" showBack glass />

      {loading && payments.length === 0 ? (
        <View style={{ padding: theme.spacing[6], paddingTop: theme.spacing[5] }}>
          <SkeletonList count={6} />
        </View>
      ) : (
        <AnimatedSectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing[5],
            paddingTop: theme.spacing[5],
            paddingBottom: theme.spacing[12],
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          onEndReached={() => {
            if (hasMore && !loading && !loadingMore) load(page + 1, false);
          }}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View style={{ gap: theme.spacing[5], marginBottom: theme.spacing[4] }}>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: theme.spacing[3], paddingRight: theme.spacing[2] }}
              >
                {FILTERS.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    selected={filter === chip.key}
                    onPress={() => setFilter(chip.key)}
                    onClear={chip.key !== 'all' && filter === chip.key ? () => setFilter('all') : undefined}
                  />
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                <SummaryTile
                  label="Refunds"
                  amount={summary.refunded}
                  incoming
                  onPress={() => setFilter('refunded')}
                />
                <SummaryTile
                  label="Spent"
                  amount={summary.spent}
                  incoming={false}
                  onPress={() => setFilter('completed')}
                />
              </View>

              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Search payments, orders..."
              />
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Text
              variant="title"
              style={{ marginTop: theme.spacing[4], marginBottom: theme.spacing[3] }}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={
                reduceMotion
                  ? undefined
                  : FadeInDown.delay(Math.min(index, 6) * 40).duration(theme.duration.slow)
              }
              style={{ marginBottom: theme.spacing[3] }}
            >
              <TransactionRow payment={item} />
            </Animated.View>
          )}
          ListEmptyComponent={
            <EmptyState
              illustration="inbox"
              title="No transactions yet"
              message="Payments and refunds will land here as you shop."
              onRefresh={onRefresh}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: theme.spacing[6] }}>
                <Spinner />
              </View>
            ) : (
              <View style={{ height: theme.spacing[6] }} />
            )
          }
        />
      )}
    </Screen>
  );
}

function SummaryTile({
  label,
  amount,
  incoming,
  onPress,
}: {
  label: string;
  amount: number;
  incoming: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const accent = incoming ? theme.colors.success : theme.colors.text;

  return (
    <Card onPress={onPress} style={{ flex: 1 }} padding={5} radius="lg">
      <View style={{ gap: theme.spacing[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {label}
          </Text>
          <ChevronRight size={16} color={theme.colors.textMuted} />
        </View>
        <Text
          variant="title"
          style={{ color: accent, fontFamily: theme.fontFamily.display.semiBold }}
        >
          {incoming ? '+' : '−'} {formatKes(amount)}
        </Text>
      </View>
    </Card>
  );
}

function TransactionRow({ payment }: { payment: Payment }) {
  const theme = useAppTheme();
  const incoming = payment.status === 'refunded';
  const failed = payment.status === 'failed';
  const pending = payment.status === 'pending';
  const orderId = paymentOrderId(payment);
  const method = (payment.payment_method || 'payment').toUpperCase();
  const when = new Date(payment.paid_at || payment.created_at);

  const Icon = incoming
    ? ArrowDownLeft
    : payment.payment_method === 'card'
      ? CreditCard
      : payment.payment_method === 'cash'
        ? Banknote
        : payment.payment_method === 'mpesa'
          ? Smartphone
          : ArrowUpRight;

  const iconBg = incoming
    ? theme.colors.successMuted
    : failed
      ? theme.colors.dangerMuted
      : theme.colors.primaryMuted;
  const iconFg = incoming
    ? theme.colors.success
    : failed
      ? theme.colors.error
      : theme.colors.primary;

  return (
    <Pressable
      onPress={() => {
        if (orderId) router.push(`/order/${orderId}` as any);
      }}
      disabled={!orderId}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? theme.pressScale : 1 }],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <GlassSurface level={1} borderRadius={theme.radius.lg}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing[4],
            gap: theme.spacing[4],
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} color={iconFg} />
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="body" numberOfLines={1} style={{ fontFamily: theme.fontFamily.body.semiBold }}>
              {paymentOrderNumber(payment)}
            </Text>
            <Text variant="caption" color="muted" numberOfLines={1}>
              {method}
              {pending ? ' · Pending' : failed ? ' · Failed' : incoming ? ' · Refund' : ''}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text
              variant="label"
              style={{
                color: incoming
                  ? theme.colors.success
                  : failed
                    ? theme.colors.textMuted
                    : theme.colors.text,
                textDecorationLine: failed ? 'line-through' : 'none',
              }}
            >
              {incoming ? '+' : '−'} {formatKes(Number(payment.amount))}
            </Text>
            <Text variant="caption" color="muted">
              {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </GlassSurface>
    </Pressable>
  );
}
