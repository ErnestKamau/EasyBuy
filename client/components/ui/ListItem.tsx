import React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { Switch } from './Switch';

type ListItemProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
};

export function ListItem({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  showChevron = true,
}: ListItemProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        minHeight: theme.touchTarget + 8,
        backgroundColor: pressed ? theme.colors.primaryMuted : 'transparent',
        borderRadius: theme.radius.md,
      })}
    >
      {icon && (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.backgroundSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body">{title}</Text>
        {subtitle && (
          <Text variant="caption" color="muted">
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {showChevron && onPress && !trailing && (
        <ChevronRight size={18} color={theme.colors.textMuted} />
      )}
    </Pressable>
  );
}

type SettingsRowProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  onPress?: () => void;
  trailingLabel?: string;
};

export function SettingsRow({
  title,
  subtitle,
  icon,
  value,
  onValueChange,
  onPress,
  trailingLabel,
}: SettingsRowProps) {
  const theme = useAppTheme();

  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      icon={icon}
      onPress={onValueChange ? undefined : onPress}
      showChevron={!onValueChange && !trailingLabel}
      trailing={
        onValueChange != null && value != null ? (
          <Switch value={value} onValueChange={onValueChange} />
        ) : trailingLabel ? (
          <Text variant="body" color="muted">
            {trailingLabel}
          </Text>
        ) : undefined
      }
    />
  );
}
