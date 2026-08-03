/**
 * Jade Horizon — Semantic Themes
 * jadeLight / jadeDark map semantic tokens → primitives.
 * Components consume these — never raw hex.
 */

import {
  jade,
  neutral,
  softWhite,
  red,
  amber,
  blue,
  spacing,
  radius,
  opacity,
  blur,
  zIndex,
  iconSize,
  touchTarget,
  GlassLevel,
} from './tokens/primitives';
import { typography, fontFamily, TypographyRole } from './tokens/typography';
import { duration, easing, spring, pressScale } from './tokens/motion';
import { ElevationLevel, getElevationStyle } from './tokens/elevation';
import { ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Glass recipe params per level
// ---------------------------------------------------------------------------

export type GlassRecipe = {
  level: GlassLevel;
  blurIntensity: number;
  tint: string;
  borderColor: string;
  borderAlpha: number;
  highlightColor: string;
};

function makeGlassRecipes(mode: 'light' | 'dark'): Record<GlassLevel, GlassRecipe> {
  if (mode === 'light') {
    return {
      0: { level: 0, blurIntensity: blur.glass0, tint: 'transparent', borderColor: 'transparent', borderAlpha: 0, highlightColor: 'transparent' },
      1: { level: 1, blurIntensity: blur.glass1, tint: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.5)', borderAlpha: 0.5, highlightColor: 'rgba(255,255,255,0.4)' },
      2: { level: 2, blurIntensity: blur.glass2, tint: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.55)', borderAlpha: 0.55, highlightColor: 'rgba(255,255,255,0.5)' },
      3: { level: 3, blurIntensity: blur.glass3, tint: 'rgba(255,255,255,0.72)', borderColor: 'rgba(255,255,255,0.6)', borderAlpha: 0.6, highlightColor: 'rgba(255,255,255,0.55)' },
      4: { level: 4, blurIntensity: blur.glass4, tint: 'rgba(247,249,247,0.78)', borderColor: 'rgba(255,255,255,0.65)', borderAlpha: 0.65, highlightColor: 'rgba(255,255,255,0.6)' },
      5: { level: 5, blurIntensity: blur.glass5, tint: 'rgba(247,249,247,0.82)', borderColor: 'rgba(255,255,255,0.7)', borderAlpha: 0.7, highlightColor: 'rgba(255,255,255,0.65)' },
    };
  }
  // Dark: stronger glass, jade-tinted
  return {
    0: { level: 0, blurIntensity: blur.glass0, tint: 'transparent', borderColor: 'transparent', borderAlpha: 0, highlightColor: 'transparent' },
    1: { level: 1, blurIntensity: blur.glass1, tint: 'rgba(26,36,30,0.55)', borderColor: 'rgba(183,229,186,0.12)', borderAlpha: 0.12, highlightColor: 'rgba(255,255,255,0.06)' },
    2: { level: 2, blurIntensity: blur.glass2, tint: 'rgba(26,36,30,0.65)', borderColor: 'rgba(183,229,186,0.16)', borderAlpha: 0.16, highlightColor: 'rgba(255,255,255,0.08)' },
    3: { level: 3, blurIntensity: blur.glass3, tint: 'rgba(35,46,39,0.72)', borderColor: 'rgba(183,229,186,0.2)', borderAlpha: 0.2, highlightColor: 'rgba(255,255,255,0.1)' },
    4: { level: 4, blurIntensity: blur.glass4, tint: 'rgba(35,46,39,0.8)', borderColor: 'rgba(183,229,186,0.24)', borderAlpha: 0.24, highlightColor: 'rgba(255,255,255,0.12)' },
    5: { level: 5, blurIntensity: blur.glass5, tint: 'rgba(18,26,21,0.78)', borderColor: 'rgba(183,229,186,0.28)', borderAlpha: 0.28, highlightColor: 'rgba(255,255,255,0.14)' },
  };
}

// ---------------------------------------------------------------------------
// Semantic color surfaces
// ---------------------------------------------------------------------------

export type SemanticColors = {
  // Legacy flat aliases (for unmigrated admin/rider screens)
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;

  // Extended semantic
  backgroundSecondary: string;
  surfaceRaised: string;
  surfaceOverlay: string;
  textMuted: string;
  textInverse: string;
  textOnPrimary: string;
  borderSubtle: string;
  borderFocus: string;
  primaryHover: string;
  primaryPressed: string;
  primaryMuted: string;
  successMuted: string;
  warningMuted: string;
  dangerMuted: string;
  infoMuted: string;
  skeleton: string;
  skeletonHighlight: string;
  overlay: string;
  divider: string;
  /** Ambient horizon wash gradient stops */
  horizonStart: string;
  horizonEnd: string;
};

function buildLightColors(): SemanticColors {
  return {
    primary: jade[500],
    secondary: jade[700],
    accent: jade[400],
    background: neutral[50],
    surface: neutral[0],
    text: neutral[900],
    textSecondary: neutral[500],
    border: neutral[200],
    error: red[600],
    success: jade[500],
    warning: amber[600],
    info: blue[600],
    tint: jade[500],
    tabIconDefault: neutral[400],
    tabIconSelected: jade[500],

    backgroundSecondary: neutral[100],
    surfaceRaised: neutral[0],
    surfaceOverlay: 'rgba(11,20,17,0.4)',
    textMuted: neutral[400],
    textInverse: softWhite.primary,
    textOnPrimary: softWhite.primary,
    borderSubtle: neutral[100],
    borderFocus: jade[500],
    primaryHover: jade[600],
    primaryPressed: jade[700],
    primaryMuted: jade[100],
    successMuted: jade[50],
    warningMuted: amber[50],
    dangerMuted: red[50],
    infoMuted: blue[50],
    skeleton: neutral[200],
    skeletonHighlight: neutral[100],
    overlay: 'rgba(11,20,17,0.45)',
    divider: neutral[200],
    horizonStart: jade[50],
    horizonEnd: neutral[50],
  };
}

function buildDarkColors(): SemanticColors {
  return {
    primary: jade[400],
    secondary: jade[300],
    accent: jade[200],
    background: neutral[950],
    surface: neutral[900],
    text: softWhite.primary,
    textSecondary: softWhite.secondary,
    border: 'rgba(183,229,186,0.12)',
    error: red[400],
    success: jade[300],
    warning: amber[400],
    info: blue[400],
    tint: jade[400],
    tabIconDefault: softWhite.muted,
    tabIconSelected: jade[300],

    backgroundSecondary: neutral[900],
    surfaceRaised: neutral[850],
    surfaceOverlay: 'rgba(0,0,0,0.55)',
    textMuted: softWhite.muted,
    textInverse: neutral[950],
    textOnPrimary: neutral[950],
    borderSubtle: 'rgba(183,229,186,0.08)',
    borderFocus: jade[400],
    primaryHover: jade[300],
    primaryPressed: jade[500],
    primaryMuted: 'rgba(40,135,96,0.2)',
    successMuted: 'rgba(40,135,96,0.18)',
    warningMuted: 'rgba(245,158,11,0.18)',
    dangerMuted: 'rgba(239,68,68,0.18)',
    infoMuted: 'rgba(59,130,246,0.18)',
    skeleton: neutral[800],
    skeletonHighlight: neutral[700],
    overlay: 'rgba(0,0,0,0.6)',
    divider: 'rgba(183,229,186,0.1)',
    horizonStart: jade[950],
    horizonEnd: neutral[950],
  };
}

// ---------------------------------------------------------------------------
// Full theme object
// ---------------------------------------------------------------------------

export type ThemeMode = 'light' | 'dark';

export type AppTheme = {
  mode: ThemeMode;
  colors: SemanticColors;
  spacing: typeof spacing;
  radius: typeof radius;
  opacity: typeof opacity;
  blur: typeof blur;
  zIndex: typeof zIndex;
  iconSize: typeof iconSize;
  touchTarget: typeof touchTarget;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  duration: typeof duration;
  easing: typeof easing;
  spring: typeof spring;
  pressScale: typeof pressScale;
  glass: Record<GlassLevel, GlassRecipe>;
  getElevation: (level: ElevationLevel) => ViewStyle;
};

function buildTheme(mode: ThemeMode): AppTheme {
  return {
    mode,
    colors: mode === 'light' ? buildLightColors() : buildDarkColors(),
    spacing,
    radius,
    opacity,
    blur,
    zIndex,
    iconSize,
    touchTarget,
    typography,
    fontFamily,
    duration,
    easing,
    spring,
    pressScale,
    glass: makeGlassRecipes(mode),
    getElevation: (level) => getElevationStyle(level, mode),
  };
}

export const jadeLight = buildTheme('light');
export const jadeDark = buildTheme('dark');

export const Themes = {
  light: jadeLight,
  dark: jadeDark,
} as const;

export type ThemeName = keyof typeof Themes;

/** Flat color object for legacy consumers (admin/rider) */
export type LegacyTheme = SemanticColors;

export type { TypographyRole, ElevationLevel, GlassLevel };
