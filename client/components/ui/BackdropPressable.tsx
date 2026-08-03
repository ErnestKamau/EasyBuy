import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/contexts/ThemeContext';

type BackdropPressableProps = {
  visible: boolean;
  onPress: () => void;
  progress: SharedValue<number>;
};

export function BackdropPressable({ onPress, progress }: BackdropPressableProps) {
  const theme = useAppTheme();

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex: theme.zIndex.overlay }, style]}
    >
      <BlurView intensity={20} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <Pressable
        onPress={onPress}
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]}
        accessibilityLabel="Dismiss"
      />
    </Animated.View>
  );
}
