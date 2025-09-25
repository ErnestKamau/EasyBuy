// constants/Themes.ts
export const Themes = {
  // Light Mode Themes
  light: {
    primary: '#22C55E',
    secondary: '#3B82F6',
    accent: '#F59E0B',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
    tint: '#22C55E',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#22C55E',
  },
  
  // Dark Mode Themes
  dark: {
    primary: '#22C55E',
    secondary: '#60A5FA',
    accent: '#FBBF24',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    border: '#334155',
    error: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
    info: '#60A5FA',
    tint: '#22C55E',
    tabIconDefault: '#64748B',
    tabIconSelected: '#22C55E',
  },
  
  // Premium Theme (Luxe Noir & Soft Oat)
  luxe: {
    primary: '#D4AF37', // Gold
    secondary: '#8B5CF6',
    accent: '#EC4899',
    background: '#060D0C', // Luxe Noir
    surface: '#F0EDE5', // Soft Oat
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#1E293B',
    error: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
    info: '#60A5FA',
    tint: '#D4AF37',
    tabIconDefault: '#64748B',
    tabIconSelected: '#D4AF37',
  },
  
  // Nature Theme (Green focused)
  nature: {
    primary: '#16A34A',
    secondary: '#059669',
    accent: '#84CC16',
    background: '#F0FDF4',
    surface: '#FFFFFF',
    text: '#14532D',
    textSecondary: '#15803D',
    border: '#BBF7D0',
    error: '#DC2626',
    success: '#16A34A',
    warning: '#CA8A04',
    info: '#0284C7',
    tint: '#16A34A',
    tabIconDefault: '#86EFAC',
    tabIconSelected: '#16A34A',
  },
  
  // Ocean Theme (Blue focused)
  ocean: {
    primary: '#0EA5E9',
    secondary: '#0284C7',
    accent: '#06B6D4',
    background: '#F0F9FF',
    surface: '#FFFFFF',
    text: '#0C4A6E',
    textSecondary: '#0369A1',
    border: '#BAE6FD',
    error: '#DC2626',
    success: '#059669',
    warning: '#D97706',
    info: '#0EA5E9',
    tint: '#0EA5E9',
    tabIconDefault: '#7DD3FC',
    tabIconSelected: '#0EA5E9',
  },
  
  // Sunset Theme (Warm colors)
  sunset: {
    primary: '#EA580C',
    secondary: '#DC2626',
    accent: '#F59E0B',
    background: '#FFF7ED',
    surface: '#FFFFFF',
    text: '#9A3412',
    textSecondary: '#C2410C',
    border: '#FDBA74',
    error: '#DC2626',
    success: '#059669',
    warning: '#D97706',
    info: '#0284C7',
    tint: '#EA580C',
    tabIconDefault: '#FED7AA',
    tabIconSelected: '#EA580C',
  }
};

export type ThemeName = keyof typeof Themes;
export type Theme = typeof Themes.light;