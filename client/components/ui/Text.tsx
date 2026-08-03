import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { TypographyRole } from '@/design';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'inverse'
  | 'onPrimary'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'brand';

type Props = RNTextProps & {
  variant?: TypographyRole;
  color?: TextColor;
};

export function Text({
  variant = 'body',
  color = 'primary',
  style,
  children,
  ...rest
}: Props) {
  const theme = useAppTheme();
  const roleStyle = theme.typography[variant];

  const colorMap: Record<TextColor, string> = {
    primary: theme.colors.text,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    inverse: theme.colors.textInverse,
    onPrimary: theme.colors.textOnPrimary,
    error: theme.colors.error,
    success: theme.colors.success,
    warning: theme.colors.warning,
    info: theme.colors.info,
    brand: theme.colors.primary,
  };

  return (
    <RNText
      style={[roleStyle, { color: colorMap[color] }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
