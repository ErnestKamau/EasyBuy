// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { Themes, ThemeName, Theme } from '@/constants/Themes';

interface ThemeContextType {
  currentTheme: Theme;
  themeName: ThemeName;
  isSystemTheme: boolean;
  changeTheme: (theme: ThemeName) => Promise<void>;
  toggleSystemTheme: () => Promise<void>;
  availableThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_preference';
const SYSTEM_THEME_KEY = '@app_use_system_theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('light');
  const [isSystemTheme, setIsSystemTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get current theme object
  const currentTheme = Themes[themeName];

  // Available theme names
  const availableThemes: ThemeName[] = Object.keys(Themes) as ThemeName[];

  // Load saved theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes when system theme is enabled
  useEffect(() => {
    if (!isSystemTheme) return;

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const systemTheme = getSystemTheme(colorScheme);
      setThemeName(systemTheme);
    });

    return () => subscription?.remove();
  }, [isSystemTheme]);

  const getSystemTheme = (colorScheme: ColorSchemeName): ThemeName => {
    return colorScheme === 'dark' ? 'dark' : 'light';
  };

  const loadThemePreference = async () => {
    try {
      const [savedTheme, savedSystemPreference] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(SYSTEM_THEME_KEY),
      ]);

      const useSystemTheme = savedSystemPreference === 'true';
      setIsSystemTheme(useSystemTheme);

      if (useSystemTheme) {
        // Use system theme
        const systemColorScheme = Appearance.getColorScheme();
        const systemTheme = getSystemTheme(systemColorScheme);
        setThemeName(systemTheme);
      } else if (savedTheme && availableThemes.includes(savedTheme as ThemeName)) {
        // Use saved custom theme
        setThemeName(savedTheme as ThemeName);
      } else {
        // Fallback to light theme
        setThemeName('light');
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      setThemeName('light');
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = async (newTheme: ThemeName) => {
    try {
      setThemeName(newTheme);
      setIsSystemTheme(false);
      
      await Promise.all([
        AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme),
        AsyncStorage.setItem(SYSTEM_THEME_KEY, 'false'),
      ]);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const toggleSystemTheme = async () => {
    try {
      const newSystemThemeState = !isSystemTheme;
      setIsSystemTheme(newSystemThemeState);

      if (newSystemThemeState) {
        // Switch to system theme
        const systemColorScheme = Appearance.getColorScheme();
        const systemTheme = getSystemTheme(systemColorScheme);
        setThemeName(systemTheme);
      }

      await AsyncStorage.setItem(SYSTEM_THEME_KEY, newSystemThemeState.toString());
    } catch (error) {
      console.warn('Failed to toggle system theme:', error);
    }
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  const contextValue: ThemeContextType = {
    currentTheme,
    themeName,
    isSystemTheme,
    changeTheme,
    toggleSystemTheme,
    availableThemes,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};