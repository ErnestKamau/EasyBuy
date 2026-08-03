/**
 * Jade Horizon — Typography Tokens
 * Manrope (display/headings) + Inter (body/UI)
 */

import { TextStyle } from 'react-native';

export const fontFamily = {
  display: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semiBold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
  },
  body: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  mono: {
    regular: 'SpaceMono',
  },
} as const;

export type TypographyRole =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'subtitle'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button'
  | 'overline';

type RoleStyle = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontWeight' | 'textTransform'
>;

/**
 * Named type scale — modular progression, optical letter-spacing.
 * Display/headings: Manrope. Body/UI: Inter.
 */
export const typography: Record<TypographyRole, RoleStyle> = {
  display: {
    fontFamily: fontFamily.display.extraBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  h1: {
    fontFamily: fontFamily.display.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamily.display.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  h3: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: fontFamily.display.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontFamily: fontFamily.body.medium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontFamily: fontFamily.body.regular,
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamily.body.regular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamily.body.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fontFamily.body.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  label: {
    fontFamily: fontFamily.body.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  button: {
    fontFamily: fontFamily.body.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  overline: {
    fontFamily: fontFamily.body.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
};
