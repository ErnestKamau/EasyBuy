import React from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

type Option = { value: string; label: string; description?: string };

type RadioGroupProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function RadioGroup({ options, value, onChange, disabled }: RadioGroupProps) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: theme.spacing[3] }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            disabled={disabled}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(opt.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing[3],
              minHeight: theme.touchTarget,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 1.5,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selected && (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: theme.colors.primary,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="body">{opt.label}</Text>
              {opt.description && (
                <Text variant="caption" color="muted">
                  {opt.description}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
