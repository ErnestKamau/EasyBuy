import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

export function ProgressDots({
  count,
  index,
}: {
  count: number;
  index: number;
}) {
  const theme = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing[2], justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === index;
        return (
          <View
            key={i}
            style={{
              width: active ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: active ? theme.colors.primary : theme.colors.border,
            }}
          />
        );
      })}
    </View>
  );
}
