// constants/Fonts.ts - Font configuration
export const Fonts = {
  // Primary font - Inter (clean, professional)
  primary: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  // Secondary font - Space Grotesk (modern, geometric)
  secondary: {
    regular: 'SpaceGrotesk_400Regular',
    medium: 'SpaceGrotesk_500Medium',
    semiBold: 'SpaceGrotesk_600SemiBold',
    bold: 'SpaceGrotesk_700Bold',
  },
  // Accent font - Manrope (rounded, friendly)
  accent: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semiBold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
  },
};

// Default font family for the app
export const defaultFontFamily = Fonts.primary.regular;
export const headingFontFamily = Fonts.secondary.bold;
export const accentFontFamily = Fonts.accent.semiBold;

