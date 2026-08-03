import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  LucideIcon,
} from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

type BadgeProps = {
  count?: number;
  dot?: boolean;
  color?: string;
};

/** Notification count / dot badge */
export function Badge({ count, dot, color }: BadgeProps) {
  const theme = useAppTheme();
  const bg = color ?? theme.colors.error;

  if (dot) {
    return (
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: bg,
        }}
      />
    );
  }

  if (count == null || count <= 0) return null;

  return (
    <View
      style={{
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
      }}
    >
      <Text variant="caption" color="onPrimary" style={{ fontSize: 10, lineHeight: 12 }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'processing'
  | 'ready'
  | 'picked_up';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; Icon: LucideIcon; tone: 'warning' | 'brand' | 'info' | 'success' | 'error' }
> = {
  pending: { label: 'Pending', Icon: Clock, tone: 'warning' },
  processing: { label: 'Processing', Icon: Clock, tone: 'warning' },
  preparing: { label: 'Preparing', Icon: Package, tone: 'brand' },
  ready: { label: 'Ready', Icon: CheckCircle2, tone: 'brand' },
  delivering: { label: 'On the way', Icon: Truck, tone: 'info' },
  picked_up: { label: 'Picked up', Icon: Truck, tone: 'info' },
  delivered: { label: 'Delivered', Icon: CheckCircle2, tone: 'success' },
  cancelled: { label: 'Cancelled', Icon: XCircle, tone: 'error' },
};

/** Status never by color alone — icon + label + tint */
export function StatusPill({
  status,
  label: overrideLabel,
}: {
  status: OrderStatus | string;
  label?: string;
}) {
  const theme = useAppTheme();
  const key = (status?.toLowerCase?.() ?? 'pending') as OrderStatus;
  const config = STATUS_CONFIG[key] ?? {
    label: status,
    Icon: Clock,
    tone: 'brand' as const,
  };

  const toneColors = {
    warning: { bg: theme.colors.warningMuted, fg: theme.colors.warning },
    brand: { bg: theme.colors.primaryMuted, fg: theme.colors.primary },
    info: { bg: theme.colors.infoMuted, fg: theme.colors.info },
    success: { bg: theme.colors.successMuted, fg: theme.colors.success },
    error: { bg: theme.colors.dangerMuted, fg: theme.colors.error },
  };
  const { bg, fg } = toneColors[config.tone];
  const Icon = config.Icon;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.radius.pill,
        backgroundColor: bg,
        alignSelf: 'flex-start',
      }}
    >
      <Icon size={12} color={fg} />
      <Text variant="caption" style={{ color: fg, fontFamily: theme.fontFamily.body.medium }}>
        {overrideLabel ?? config.label}
      </Text>
    </View>
  );
}
