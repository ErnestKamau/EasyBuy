// app/theme-selector.tsx — Appearance (Light / Dark / System)
import React from 'react';
import { View, Pressable } from 'react-native';
import { Sun, Moon, Smartphone, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme, useAppTheme } from '@/contexts/ThemeContext';
import { Screen, Text, AppHeader, Surface } from '@/components/ui';

type Option = {
  key: 'light' | 'dark' | 'system';
  label: string;
  description: string;
  Icon: typeof Sun;
};

const OPTIONS: Option[] = [
  { key: 'light', label: 'Light', description: 'Calm jade surfaces, open and clear', Icon: Sun },
  { key: 'dark', label: 'Dark', description: 'Quiet forest charcoal, soft glass', Icon: Moon },
  { key: 'system', label: 'System', description: 'Match your device setting', Icon: Smartphone },
];

export default function AppearanceScreen() {
  const theme = useAppTheme();
  const { themeName, isSystemTheme, changeTheme, toggleSystemTheme } = useTheme();
  const router = useRouter();

  const selected: Option['key'] = isSystemTheme ? 'system' : themeName;

  const select = async (key: Option['key']) => {
    if (key === 'system') {
      if (!isSystemTheme) await toggleSystemTheme();
    } else {
      await changeTheme(key);
    }
  };

  return (
    <Screen>
      <AppHeader title="Appearance" showBack onBack={() => router.back()} glass={false} />
      <View style={{ padding: theme.spacing[5], gap: theme.spacing[3] }}>
        <Text variant="body" color="secondary" style={{ marginBottom: theme.spacing[3] }}>
          Jade Horizon uses a single brand language. Choose how light reaches your screen.
        </Text>
        {OPTIONS.map((opt) => {
          const active = selected === opt.key;
          const Icon = opt.Icon;
          return (
            <Pressable key={opt.key} onPress={() => select(opt.key)}>
              <Surface
                variant={active ? 'elevated' : 'outlined'}
                padding={5}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[4],
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  borderWidth: active ? 1.5 : 1,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: active ? theme.colors.primaryMuted : theme.colors.backgroundSecondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={active ? theme.colors.primary : theme.colors.textSecondary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="title">{opt.label}</Text>
                  <Text variant="caption" color="muted">
                    {opt.description}
                  </Text>
                </View>
                {active && <Check size={20} color={theme.colors.primary} />}
              </Surface>
            </Pressable>
          );
        })}

        {/* Live preview swatches */}
        <View style={{ marginTop: theme.spacing[6], gap: theme.spacing[3] }}>
          <Text variant="label" color="muted">
            LIVE PREVIEW
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
            {[theme.colors.primary, theme.colors.accent, theme.colors.surface, theme.colors.background].map(
              (c, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: theme.radius.md,
                    backgroundColor: c,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                />
              ),
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}
