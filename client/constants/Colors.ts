/**
 * @deprecated Use `@/design` or `useAppTheme()` instead.
 * Kept so Expo template Themed.tsx still compiles.
 */
import { Themes } from '@/design';

export default {
  light: {
    text: Themes.light.colors.text,
    background: Themes.light.colors.background,
    tint: Themes.light.colors.tint,
    tabIconDefault: Themes.light.colors.tabIconDefault,
    tabIconSelected: Themes.light.colors.tabIconSelected,
  },
  dark: {
    text: Themes.dark.colors.text,
    background: Themes.dark.colors.background,
    tint: Themes.dark.colors.tint,
    tabIconDefault: Themes.dark.colors.tabIconDefault,
    tabIconSelected: Themes.dark.colors.tabIconSelected,
  },
};
