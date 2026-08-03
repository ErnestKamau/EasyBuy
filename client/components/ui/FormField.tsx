import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

type FormFieldProps = {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function FormField({
  label,
  helper,
  error,
  required,
  children,
  style,
}: FormFieldProps) {
  const theme = useAppTheme();

  return (
    <View style={[{ gap: theme.spacing[2] }, style]}>
      {label && (
        <Text variant="label" color="secondary">
          {label}
          {required ? ' *' : ''}
        </Text>
      )}
      {children}
      {(error || helper) && (
        <Text variant="caption" color={error ? 'error' : 'muted'}>
          {error || helper}
        </Text>
      )}
    </View>
  );
}
