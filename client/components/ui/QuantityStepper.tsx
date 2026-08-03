import React from 'react';
import { Pressable, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

type QuantityStepperProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: QuantityStepperProps) {
  const theme = useAppTheme();

  const bump = (delta: number) => {
    const next = Math.max(min, Math.min(max, value + delta));
    if (next !== value) {
      Haptics.selectionAsync().catch(() => {});
      onChange(next);
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.pill,
        padding: 2,
      }}
    >
      <Pressable
        onPress={() => bump(-1)}
        disabled={value <= min}
        accessibilityLabel="Decrease quantity"
        style={{
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: value <= min ? 0.4 : 1,
        }}
      >
        <Minus size={16} color={theme.colors.text} />
      </Pressable>
      <Text
        variant="label"
        style={{ minWidth: 28, textAlign: 'center', fontFamily: theme.fontFamily.body.semiBold }}
      >
        {value}
      </Text>
      <Pressable
        onPress={() => bump(1)}
        disabled={value >= max}
        accessibilityLabel="Increase quantity"
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.primary,
          opacity: value >= max ? 0.4 : 1,
        }}
      >
        <Plus size={16} color={theme.colors.textOnPrimary} />
      </Pressable>
    </View>
  );
}
