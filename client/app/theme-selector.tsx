// app/theme-selector.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeName } from '@/constants/Themes';
import { 
  ArrowLeft, 
  Palette, 
  Check, 
  Smartphone,
  Sun,
  Moon,
  Leaf,
  Waves,
  Sunset,
  Crown
} from 'lucide-react-native';

// Theme metadata for display
const themeMetadata: Record<ThemeName, {
  displayName: string;
  description: string;
  icon: any;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}> = {
  light: {
    displayName: 'Light',
    description: 'Clean and bright interface',
    icon: Sun,
    preview: { primary: '#22C55E', secondary: '#3B82F6', accent: '#F59E0B' },
  },
  dark: {
    displayName: 'Dark',
    description: 'Easy on the eyes in low light',
    icon: Moon,
    preview: { primary: '#22C55E', secondary: '#60A5FA', accent: '#FBBF24' },
  },
  luxe: {
    displayName: 'Luxe',
    description: 'Premium gold and black aesthetic',
    icon: Crown,
    preview: { primary: '#D4AF37', secondary: '#8B5CF6', accent: '#EC4899' },
  },
  nature: {
    displayName: 'Nature',
    description: 'Fresh green and earth tones',
    icon: Leaf,
    preview: { primary: '#16A34A', secondary: '#059669', accent: '#84CC16' },
  },
  ocean: {
    displayName: 'Ocean',
    description: 'Calm blues and water inspired',
    icon: Waves,
    preview: { primary: '#0EA5E9', secondary: '#0284C7', accent: '#06B6D4' },
  },
  sunset: {
    displayName: 'Sunset',
    description: 'Warm oranges and reds',
    icon: Sunset,
    preview: { primary: '#EA580C', secondary: '#DC2626', accent: '#F59E0B' },
  },
};

export default function ThemeSelectorScreen() {
  const { 
    currentTheme, 
    themeName, 
    isSystemTheme, 
    changeTheme, 
    toggleSystemTheme, 
    availableThemes 
  } = useTheme();

  const handleThemeSelect = (selectedTheme: ThemeName) => {
    changeTheme(selectedTheme);
  };

  const renderThemePreview = (theme: ThemeName) => {
    const metadata = themeMetadata[theme];
    const IconComponent = metadata.icon;
    const isSelected = !isSystemTheme && themeName === theme;

    return (
      <TouchableOpacity
        key={theme}
        style={[
          styles.themeCard,
          { backgroundColor: currentTheme.surface },
          isSelected && {
            borderColor: currentTheme.primary,
            borderWidth: 2,
          },
        ]}
        onPress={() => handleThemeSelect(theme)}
      >
        <View style={styles.themeHeader}>
          <View style={styles.themeIconContainer}>
            <IconComponent size={24} color={metadata.preview.primary} />
          </View>
          {isSelected && (
            <View style={[styles.checkIcon, { backgroundColor: currentTheme.primary }]}>
              <Check size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.themeInfo}>
          <Text style={[styles.themeName, { color: currentTheme.text }]}>
            {metadata.displayName}
          </Text>
          <Text style={[styles.themeDescription, { color: currentTheme.textSecondary }]}>
            {metadata.description}
          </Text>
        </View>

        <View style={styles.colorPreview}>
          <View style={[styles.colorDot, { backgroundColor: metadata.preview.primary }]} />
          <View style={[styles.colorDot, { backgroundColor: metadata.preview.secondary }]} />
          <View style={[styles.colorDot, { backgroundColor: metadata.preview.accent }]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar 
        barStyle={themeName === 'dark' || themeName === 'luxe' ? 'light-content' : 'dark-content'}
        backgroundColor={currentTheme.background}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          Choose Theme
        </Text>
        <View style={styles.headerRight}>
          <Palette size={24} color={currentTheme.primary} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* System Theme Toggle */}
        <View style={[styles.systemThemeCard, { backgroundColor: currentTheme.surface }]}>
          <View style={styles.systemThemeContent}>
            <View style={styles.systemThemeIcon}>
              <Smartphone size={24} color={currentTheme.primary} />
            </View>
            <View style={styles.systemThemeInfo}>
              <Text style={[styles.systemThemeTitle, { color: currentTheme.text }]}>
                Use System Theme
              </Text>
              <Text style={[styles.systemThemeDescription, { color: currentTheme.textSecondary }]}>
                {isSystemTheme 
                  ? 'Following your device settings (Light/Dark)'
                  : 'Match your device light/dark mode setting'
                }
              </Text>
            </View>
          </View>
          <Switch
            value={isSystemTheme}
            onValueChange={toggleSystemTheme}
            trackColor={{ false: currentTheme.border, true: `${currentTheme.primary}40` }}
            thumbColor={isSystemTheme ? currentTheme.primary : currentTheme.textSecondary}
            ios_backgroundColor={currentTheme.border}
          />
        </View>

        {/* Theme Selection */}
        <View style={styles.themesSection}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            Available Themes
          </Text>
          <Text style={[styles.sectionSubtitle, { color: currentTheme.textSecondary }]}>
            {isSystemTheme 
              ? 'System theme is enabled. Disable to choose custom themes.'
              : 'Choose your preferred app appearance'
            }
          </Text>
          
          <View style={[styles.themesGrid, { opacity: isSystemTheme ? 0.5 : 1 }]}>
            {availableThemes.map(renderThemePreview)}
          </View>
        </View>

        {/* Theme Info */}
        <View style={[styles.infoCard, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.infoTitle, { color: currentTheme.text }]}>
            About Themes
          </Text>
          <Text style={[styles.infoDescription, { color: currentTheme.textSecondary }]}>
            Your theme preference is automatically saved and will be restored when you restart the app. 
            The system theme option will automatically switch between light and dark themes based on your device settings.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    width: 32, // Match back button width for centering
  },

  // Content
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // System Theme Card
  systemThemeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  systemThemeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  systemThemeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  systemThemeInfo: {
    flex: 1,
  },
  systemThemeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  systemThemeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Themes Section
  themesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  themesGrid: {
    gap: 16,
  },

  // Theme Cards
  themeCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeInfo: {
    marginBottom: 16,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 8,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  // Info Card
  infoCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 22,
  },

  bottomSpacing: {
    height: 40,
  },
});