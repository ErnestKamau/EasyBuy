import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';

type SwitchProps = {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
};

export function Switch({ value, onValueChange, disabled }: SwitchProps) {
  const theme = useAppTheme();
  const offset = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    offset.value = withTiming(value ? 1 : 0, { duration: theme.duration.normal });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: offset.value > 0.5 ? theme.colors.primary : theme.colors.border,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value * 20 }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onValueChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={[
          {
            width: 48,
            height: 28,
            borderRadius: 14,
            padding: 2,
            justifyContent: 'center',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
              ...theme.getElevation('elv200'),
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
