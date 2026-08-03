/**
 * Jade Horizon — Elevation Tokens
 * Dark mode elevates via surface contrast + border, not heavier shadows.
 */

import { ViewStyle } from 'react-native';

export type ElevationLevel =
  | 'elv000'
  | 'elv100'
  | 'elv200'
  | 'elv300'
  | 'elv400'
  | 'elv500'
  | 'elv600'
  | 'elv700'
  | 'elv800'
  | 'elv900';

type ElevationRecipe = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android
};

/** Soft, layered, low-opacity shadows — light mode */
const lightShadows: Record<ElevationLevel, ElevationRecipe> = {
  elv000: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  elv100: {
    shadowColor: '#0B1411',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  elv200: {
    shadowColor: '#0B1411',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  elv300: {
    shadowColor: '#0B1411',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  elv400: {
    shadowColor: '#0B1411',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  elv500: {
    shadowColor: '#0B1411',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  elv600: {
    shadowColor: '#0B1411',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 12,
  },
  elv700: {
    shadowColor: '#0B1411',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  elv800: {
    shadowColor: '#0B1411',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  elv900: {
    shadowColor: '#0B1411',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 16,
  },
};

/** Dark mode: softer / lower opacity — depth comes from surface contrast */
const darkShadows: Record<ElevationLevel, ElevationRecipe> = {
  elv000: lightShadows.elv000,
  elv100: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  elv200: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  elv300: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  elv400: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
  elv500: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  elv600: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  elv700: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  elv800: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  elv900: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 16,
  },
};

export function getElevationStyle(
  level: ElevationLevel,
  mode: 'light' | 'dark',
): ViewStyle {
  const recipe = mode === 'dark' ? darkShadows[level] : lightShadows[level];
  return {
    shadowColor: recipe.shadowColor,
    shadowOffset: recipe.shadowOffset,
    shadowOpacity: recipe.shadowOpacity,
    shadowRadius: recipe.shadowRadius,
    elevation: recipe.elevation,
  };
}
