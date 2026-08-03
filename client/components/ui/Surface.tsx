import React from 'react';
import { View, StyleSheet, ViewProps, Pressable, PressableProps } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { GlassSurface } from './GlassSurface';
import { GlassLevel, ElevationLevel } from '@/design';

type Variant = 'filled' | 'outlined' | 'elevated' | 'glass';

type SurfaceProps = ViewProps & {
  variant?: Variant;
  glassLevel?: GlassLevel;
  elevation?: ElevationLevel;
  padding?: number | keyof typeof import('@/design').spacing;
  radius?: number | keyof typeof import('@/design').radius;
  children: React.ReactNode;
};

function resolvePadding(
  padding: SurfaceProps['padding'],
  spacing: Record<string | number, number>,
): number | undefined {
  if (padding === undefined) return undefined;
  if (typeof padding === 'number') return typeof spacing[padding] === 'number' ? spacing[padding] : padding;
  return spacing[padding as number];
}

function resolveRadius(
  r: SurfaceProps['radius'],
  radiusTokens: Record<string, number>,
): number {
  if (r === undefined) return radiusTokens.lg;
  if (typeof r === 'number') return r;
  return radiusTokens[r] ?? radiusTokens.lg;
}

export function Surface({
  variant = 'filled',
  glassLevel = 2,
  elevation = 'elv200',
  padding,
  radius,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const theme = useAppTheme();
  const pad = resolvePadding(padding, theme.spacing);
  const rad = resolveRadius(radius, theme.radius);

  if (variant === 'glass') {
    return (
      <GlassSurface level={glassLevel} borderRadius={rad} style={style} {...rest}>
        <View style={pad != null ? { padding: pad } : undefined}>{children}</View>
      </GlassSurface>
    );
  }

  const bg =
    variant === 'outlined'
      ? 'transparent'
      : variant === 'elevated'
        ? theme.colors.surfaceRaised
        : theme.colors.surface;

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: rad,
          padding: pad,
          borderWidth: variant === 'outlined' ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: theme.colors.border,
        },
        variant === 'elevated' ? theme.getElevation(elevation) : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

type CardProps = SurfaceProps & {
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
};

export function Card({ onPress, disabled, children, ...rest }: CardProps) {
  const theme = useAppTheme();

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [{ opacity: pressed || disabled ? 0.9 : 1, transform: [{ scale: pressed ? theme.pressScale : 1 }] }]}
      >
        <Surface variant="elevated" padding={5} {...rest}>
          {children}
        </Surface>
      </Pressable>
    );
  }

  return (
    <Surface variant="elevated" padding={5} {...rest}>
      {children}
    </Surface>
  );
}
