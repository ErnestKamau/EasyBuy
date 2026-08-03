import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/contexts/ThemeContext';

type HamburgerButtonProps = {
  open: boolean;
  onPress: () => void;
};

/** Animated hamburger → X */
export function HamburgerButton({ open, onPress }: HamburgerButtonProps) {
  const theme = useAppTheme();
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: theme.duration.normal });
  }, [open]);

  const line1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * 7 },
      { rotate: `${progress.value * 45}deg` },
    ],
  }));
  const line2 = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));
  const line3 = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * -7 },
      { rotate: `${progress.value * -45}deg` },
    ],
  }));

  const lineStyle = {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.text,
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={open ? 'Close menu' : 'Open menu'}
      accessibilityRole="button"
      style={{
        width: theme.touchTarget,
        height: theme.touchTarget,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
      }}
    >
      <Animated.View style={[lineStyle, line1]} />
      <Animated.View style={[lineStyle, line2]} />
      <Animated.View style={[lineStyle, line3]} />
    </Pressable>
  );
}
