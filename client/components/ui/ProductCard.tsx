import React from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { MediaContainer } from './MediaContainer';
import { PriceText } from './PriceText';
import { Surface } from './Surface';

type ProductCardProps = {
  id: string | number;
  name: string;
  price: number | string;
  compareAt?: number | string;
  imageUri?: string | null;
  variant?: 'grid' | 'horizontal';
  onPress?: () => void;
};

export function ProductCard({
  id,
  name,
  price,
  compareAt,
  imageUri,
  variant = 'grid',
  onPress,
}: ProductCardProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const handlePress = () => {
    if (onPress) onPress();
    else router.push(`/product/${id}` as any);
  };

  if (variant === 'horizontal') {
    return (
      <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        <Surface
          variant="elevated"
          style={{
            flexDirection: 'row',
            padding: theme.spacing[3],
            gap: theme.spacing[4],
            alignItems: 'center',
          }}
        >
          <MediaContainer
            uri={imageUri}
            aspectRatio="1:1"
            style={{ width: 72, height: 72 }}
          />
          <View style={{ flex: 1, gap: theme.spacing[1] }}>
            <Text variant="body" numberOfLines={2}>
              {name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PriceText amount={price} compareAt={compareAt} size="sm" />
            </View>
          </View>
        </Surface>
      </Pressable>
    );
  }

  const cardWidth = (width - theme.spacing[5] * 2 - theme.spacing[3]) / 2;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        { width: cardWidth, opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? theme.pressScale : 1 }] },
      ]}
    >
      <Surface variant="elevated" style={{ overflow: 'hidden', padding: 0 }}>
        <MediaContainer uri={imageUri} aspectRatio="1:1" borderRadius={0} />
        <View style={{ padding: theme.spacing[3], gap: theme.spacing[1] }}>
          <Text variant="label" numberOfLines={2}>
            {name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <PriceText amount={price} compareAt={compareAt} size="sm" />
          </View>
        </View>
      </Surface>
    </Pressable>
  );
}
