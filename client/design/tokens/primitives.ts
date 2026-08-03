/**
 * Jade Horizon — Primitive Tokens
 * Raw values with no semantic meaning. Components never reference these directly.
 */

// ---------------------------------------------------------------------------
// Color ramps (50–950)
// ---------------------------------------------------------------------------

/** Brand jade ramp — anchors: 200 #B7E5BA, 400 #5CA87C, 500 #288760, 700 #1A5140 */
export const jade = {
  50: '#F2F9F4',
  100: '#E0F2E4',
  200: '#B7E5BA',
  300: '#8DD4A0',
  400: '#5CA87C',
  500: '#288760',
  600: '#227352',
  700: '#1A5140',
  800: '#143D31',
  900: '#0E2B22',
  950: '#081A15',
} as const;

/** Green-tinted neutrals — never pure black/white */
export const neutral = {
  0: '#FFFFFF',
  50: '#F7F9F7',
  100: '#EEF2EF',
  200: '#DCE4DE',
  300: '#C0CCC4',
  400: '#8FA094',
  500: '#667A6C',
  600: '#4A5C50',
  700: '#35433A',
  800: '#232E27',
  850: '#1A241E',
  900: '#121A15',
  950: '#0B1411',
  1000: '#060D0A',
} as const;

/** Soft white for dark-mode text (never pure #FFFFFF on dark) */
export const softWhite = {
  primary: '#F2F7F4',
  secondary: '#C5D4CB',
  muted: '#8A9E92',
  disabled: '#5A6B60',
} as const;

export const red = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#EF4444',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  900: '#7F1D1D',
  950: '#450A0A',
} as const;

export const amber = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
  950: '#451A03',
} as const;

export const blue = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
  950: '#172554',
} as const;

// ---------------------------------------------------------------------------
// Spacing (2/4/8-based scale)
// ---------------------------------------------------------------------------

export const spacing = {
  0: 0,
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16,
  6: 20,
  7: 24,
  8: 32,
  9: 40,
  10: 48,
  11: 64,
  12: 80,
  13: 96,
} as const;

export type SpacingKey = keyof typeof spacing;

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

export const radius = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 36,
  pill: 9999,
  circle: 9999,
} as const;

export type RadiusKey = keyof typeof radius;

// ---------------------------------------------------------------------------
// Opacity
// ---------------------------------------------------------------------------

export const opacity = {
  0: 0,
  5: 0.05,
  8: 0.08,
  10: 0.1,
  12: 0.12,
  16: 0.16,
  20: 0.2,
  24: 0.24,
  30: 0.3,
  40: 0.4,
  50: 0.5,
  60: 0.6,
  70: 0.7,
  80: 0.8,
  90: 0.9,
  100: 1,
} as const;

// ---------------------------------------------------------------------------
// Blur intensities (expo-blur intensity 0–100)
// ---------------------------------------------------------------------------

export const blur = {
  glass0: 0,
  glass1: 12,
  glass2: 24,
  glass3: 36,
  glass4: 48,
  glass5: 64,
} as const;

export type GlassLevel = 0 | 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Z-index
// ---------------------------------------------------------------------------

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  drawer: 450,
  toast: 500,
  tooltip: 600,
  critical: 900,
} as const;

// ---------------------------------------------------------------------------
// Icon sizes
// ---------------------------------------------------------------------------

export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
} as const;

/** Minimum touch target (a11y) */
export const touchTarget = 44;
