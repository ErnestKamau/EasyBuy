import React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
};

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onChange(!checked);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        opacity: disabled ? 0.5 : 1,
        minHeight: theme.touchTarget,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: theme.radius.xs,
          borderWidth: 1.5,
          borderColor: checked ? theme.colors.primary : theme.colors.border,
          backgroundColor: checked ? theme.colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Check size={14} color={theme.colors.textOnPrimary} strokeWidth={3} />}
      </View>
      {label && (
        <Text variant="body" color="primary">
          {label}
        </Text>
      )}
    </Pressable>
  );
}
