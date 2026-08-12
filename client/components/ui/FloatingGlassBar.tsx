import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/contexts/ThemeContext';
import { GlassLevel } from '@/design';
import { GlassSurface } from './GlassSurface';

type Props = {
  children: React.ReactNode;
  level?: GlassLevel;
  style?: StyleProp<ViewStyle>;
};

/**
 * Floating glass action bar — same position as the homepage tab bar:
 * inset from the sides, sitting above the home indicator.
 */
export function FloatingGlassBar({ children, level = 2, style }: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          left: theme.spacing[4],
          right: theme.spacing[4],
          bottom: Math.max(insets.bottom, theme.spacing[3]),
        },
        style,
      ]}
    >
      <GlassSurface level={level} borderRadius={theme.radius.xl}>
        {children}
      </GlassSurface>
    </View>
  );
}
