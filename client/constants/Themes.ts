// constants/Themes.ts
export const Themes = {
  // Light Mode Themes - Mature & Masculine
  light: {
    primary: '#1E3A5F', // Deep Navy - mature, professional
    secondary: '#4A6FA5', // Steel Blue
    accent: '#D97706', // Burnt Orange - warm but strong
    background: '#FAFAFA', // Off-white
    surface: '#FFFFFF', // Pure white
    text: '#1A1A1A', // Charcoal
    textSecondary: '#64748B', // Slate grey
    border: '#E2E8F0', // Light grey border
    error: '#DC2626', // Strong red
    success: '#059669', // Deep green
    warning: '#D97706', // Burnt orange
    info: '#2563EB', // Deep blue
    tint: '#1E3A5F',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#1E3A5F',
  },
  
  // Dark Mode Themes - Mature & Masculine
  dark: {
    primary: '#5B8FC7', // Bright Steel Blue
    secondary: '#7C9BC4', // Soft Blue
    accent: '#F59E0B', // Amber
    background: '#0F172A', // Deep Charcoal
    surface: '#1E293B', // Dark Slate
    text: '#F8FAFC', // Off-white
    textSecondary: '#CBD5E1', // Light Grey
    border: '#334155', // Medium grey border
    error: '#F87171', // Soft red
    success: '#4ADE80', // Bright green
    warning: '#FBBF24', // Amber
    info: '#60A5FA', // Light blue
    tint: '#5B8FC7',
    tabIconDefault: '#64748B',
    tabIconSelected: '#5B8FC7',
  },

  // Premium Theme (Luxe Noir & Soft Oat)
  luxe: {
    primary: '#D4AF37', // Gold
    secondary: '#8B5CF6',
    accent: '#EC4899',
    background: '#7d7d7dff', // Luxe Noir
    surface: '#ffffffff', // Soft Oat
    text: '#000000ff',
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
export type Theme = typeof Themes.light