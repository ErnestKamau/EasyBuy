import React from 'react';
import { View, Pressable } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { MediaContainer } from './MediaContainer';
import { QuantityStepper } from './QuantityStepper';
import { PriceText } from './PriceText';
import { Surface } from './Surface';
import { IconButton } from './Button';

type CartItemRowProps = {
  name: string;
  price: number | string;
  quantity: number;
  imageUri?: string | null;
  onQuantityChange: (q: number) => void;
  onRemove?: () => void;
};

export function CartItemRow({
  name,
  price,
  quantity,
  imageUri,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const theme = useAppTheme();
  const unit = typeof price === 'string' ? parseFloat(price) : price;
  const line = (Number.isNaN(unit) ? 0 : unit) * quantity;

  return (
    <Surface
      variant="elevated"
      style={{
        flexDirection: 'row',
        padding: theme.spacing[3],
        gap: theme.spacing[4],
        alignItems: 'center',
      }}
    >
      <MediaContainer uri={imageUri} aspectRatio="1:1" style={{ width: 72, height: 72 }} />
      <View style={{ flex: 1, gap: theme.spacing[2] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text variant="body" numberOfLines={2} style={{ flex: 1, marginRight: theme.spacing[2] }}>
            {name}
          </Text>
          {onRemove && (
            <IconButton
              accessibilityLabel="Remove item"
              icon={<Trash2 size={16} color={theme.colors.error} />}
              onPress={onRemove}
              size={32}
            />
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PriceText amount={line} size="sm" />
        </View>
        <QuantityStepper value={quantity} onChange={onQuantityChange} />
      </View>
    </Surface>
  );
}
