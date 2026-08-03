import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

export function ProgressBar({
  progress,
  height = 4,
}: {
  progress: number; // 0–1
  height?: number;
}) {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: theme.colors.primary,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

export function Spinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  const theme = useAppTheme();
  return <ActivityIndicator size={size} color={theme.colors.primary} />;
}
