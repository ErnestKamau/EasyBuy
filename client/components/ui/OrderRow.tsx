import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { StatusPill, OrderStatus } from './Badge';
import { Surface } from './Surface';
import { PriceText } from './PriceText';

type OrderRowProps = {
  id: string | number;
  title?: string;
  status: OrderStatus | string;
  total: number | string;
  date?: string;
  onPress?: () => void;
};

export function OrderRow({ id, title, status, total, date, onPress }: OrderRowProps) {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={onPress ?? (() => router.push(`/order/${id}` as any))}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
    >
      <Surface
        variant="elevated"
        style={{
          padding: theme.spacing[4],
          gap: theme.spacing[3],
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label" color="muted">
            #{id}
          </Text>
          <StatusPill status={status} />
        </View>
        {title && (
          <Text variant="body" numberOfLines={1}>
            {title}
          </Text>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
            <PriceText amount={total} size="sm" />
            {date && (
              <Text variant="caption" color="muted">
                {date}
              </Text>
            )}
          </View>
          <ChevronRight size={18} color={theme.colors.textMuted} />
        </View>
      </Surface>
    </Pressable>
  );
}
