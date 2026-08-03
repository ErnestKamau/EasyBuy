import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useAppTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius,
  style,
}: SkeletonProps) {
  const theme = useAppTheme();
  const progress = useSharedValue(0);
  const rad = borderRadius ?? theme.radius.sm;

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-80, 280]),
      },
    ],
  }));

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: rad,
          backgroundColor: theme.colors.skeleton,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            theme.colors.skeletonHighlight,
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: 80, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonProductCard() {
  const theme = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing[3],
        gap: theme.spacing[3],
        ...theme.getElevation('elv100'),
      }}
    >
      <Skeleton height={120} borderRadius={theme.radius.md} />
      <Skeleton height={14} width="70%" />
      <Skeleton height={12} width="40%" />
    </View>
  );
}

export function SkeletonOrderRow() {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        padding: theme.spacing[4],
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
      }}
    >
      <Skeleton width={48} height={48} borderRadius={theme.radius.md} />
      <View style={{ flex: 1, gap: theme.spacing[2] }}>
        <Skeleton height={14} width="60%" />
        <Skeleton height={12} width="40%" />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: theme.spacing[3] }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonOrderRow key={i} />
      ))}
    </View>
  );
}
