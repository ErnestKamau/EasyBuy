import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

type AvatarProps = {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

const SIZES = { sm: 32, md: 40, lg: 56, xl: 80 };

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const theme = useAppTheme();
  const dim = SIZES[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: theme.colors.skeleton,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: theme.colors.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        variant={size === 'xl' || size === 'lg' ? 'title' : 'caption'}
        color="brand"
        style={{ fontFamily: theme.fontFamily.display.semiBold }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
