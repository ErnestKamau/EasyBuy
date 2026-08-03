import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/contexts/ThemeContext';
import { GlassLevel } from '@/design';

type Props = ViewProps & {
  level?: GlassLevel;
  children: React.ReactNode;
  borderRadius?: number;
};

/**
 * Glass anatomy: backdrop blur + surface tint + 1px hairline + top inner highlight.
 * Content inside is never blurred.
 */
export function GlassSurface({
  level = 2,
  children,
  borderRadius,
  style,
  ...rest
}: Props) {
  const theme = useAppTheme();
  const recipe = theme.glass[level];
  const radius = borderRadius ?? theme.radius.lg;
  const isDark = theme.mode === 'dark';

  if (level === 0) {
    return (
      <View style={[{ borderRadius, overflow: 'hidden' }, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: recipe.borderColor,
        },
        theme.getElevation(level >= 4 ? 'elv600' : level >= 3 ? 'elv400' : 'elv300'),
        style,
      ]}
      {...rest}
    >
      {Platform.OS !== 'web' ? (
        <BlurView
          intensity={recipe.blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: recipe.tint }]}
        pointerEvents="none"
      />
      {/* Top inner highlight */}
      <LinearGradient
        colors={[recipe.highlightColor, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.highlight, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]}
        pointerEvents="none"
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  content: {
    zIndex: 1,
  },
});
