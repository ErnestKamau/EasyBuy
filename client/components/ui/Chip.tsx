import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { GlassSurface } from './GlassSurface';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onClear?: () => void;
  icon?: React.ReactNode;
};

export function Chip({ label, selected, onPress, onClear, icon }: ChipProps) {
  const theme = useAppTheme();

  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        minHeight: 36,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[2],
          opacity: pressed ? 0.8 : 1,
        })}
      >
        {icon}
        <Text
          variant="label"
          color={selected ? 'brand' : 'secondary'}
          style={{ fontFamily: selected ? theme.fontFamily.body.semiBold : theme.fontFamily.body.medium }}
        >
          {label}
        </Text>
      </Pressable>
      {selected && onClear ? (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          accessibilityLabel={`Clear ${label}`}
        >
          <X size={14} color={theme.colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );

  if (selected) {
    return (
      <GlassSurface level={1} borderRadius={theme.radius.pill}>
        {inner}
      </GlassSurface>
    );
  }

  return (
    <View
      style={{
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.backgroundSecondary,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: theme.colors.border,
      }}
    >
      {inner}
    </View>
  );
}

export function Tag({
  label,
  tone = 'brand',
}: {
  label: string;
  tone?: 'brand' | 'success' | 'warning' | 'error' | 'info';
}) {
  const theme = useAppTheme();
  const map = {
    brand: { bg: theme.colors.primaryMuted, fg: theme.colors.primary },
    success: { bg: theme.colors.successMuted, fg: theme.colors.success },
    warning: { bg: theme.colors.warningMuted, fg: theme.colors.warning },
    error: { bg: theme.colors.dangerMuted, fg: theme.colors.error },
    info: { bg: theme.colors.infoMuted, fg: theme.colors.info },
  };
  const { bg, fg } = map[tone];

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[1],
        borderRadius: theme.radius.sm,
        backgroundColor: bg,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="caption" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}
