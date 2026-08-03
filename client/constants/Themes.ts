/**
 * @deprecated Import from `@/design` instead.
 * Kept for backward compatibility — re-exports Jade Horizon themes
 * with flat color aliases for unmigrated screens (admin, rider).
 */
import { Themes as DesignThemes, ThemeName as DesignThemeName, AppTheme } from '@/design';

/** Flat color object matching the old Theme shape */
export type Theme = AppTheme['colors'];
export type ThemeName = DesignThemeName;

export const Themes: Record<ThemeName, Theme> = {
  light: DesignThemes.light.colors,
  dark: DesignThemes.dark.colors,
};
