import React from 'react';
import { View, Pressable } from 'react-native';
import { Info, AlertTriangle, CheckCircle2, X, LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { GlassSurface } from './GlassSurface';

type Tone = 'info' | 'warning' | 'success' | 'error';

type BannerProps = {
  tone?: Tone;
  title: string;
  message?: string;
  onDismiss?: () => void;
  glass?: boolean;
};

const ICONS: Record<Tone, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: AlertTriangle,
};

export function Banner({ tone = 'info', title, message, onDismiss, glass = true }: BannerProps) {
  const theme = useAppTheme();
  const Icon = ICONS[tone];
  const colors = {
    info: { bg: theme.colors.infoMuted, fg: theme.colors.info },
    warning: { bg: theme.colors.warningMuted, fg: theme.colors.warning },
    success: { bg: theme.colors.successMuted, fg: theme.colors.success },
    error: { bg: theme.colors.dangerMuted, fg: theme.colors.error },
  };
  const { bg, fg } = colors[tone];

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[3],
        padding: theme.spacing[4],
        backgroundColor: glass ? 'transparent' : bg,
      }}
    >
      <Icon size={20} color={fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" style={{ color: fg }}>
          {title}
        </Text>
        {message && (
          <Text variant="caption" color="secondary">
            {message}
          </Text>
        )}
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Dismiss">
          <X size={16} color={theme.colors.textMuted} />
        </Pressable>
      )}
    </View>
  );

  if (glass) {
    return (
      <GlassSurface level={2} borderRadius={theme.radius.md}>
        {content}
      </GlassSurface>
    );
  }

  return (
    <View style={{ borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: bg }}>
      {content}
    </View>
  );
}

export function InlineAlert({
  tone = 'info',
  message,
}: {
  tone?: Tone;
  message: string;
}) {
  const theme = useAppTheme();
  const Icon = ICONS[tone];
  const fg =
    tone === 'info'
      ? theme.colors.info
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'success'
          ? theme.colors.success
          : theme.colors.error;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
      <Icon size={14} color={fg} />
      <Text variant="caption" style={{ color: fg, flex: 1 }}>
        {message}
      </Text>
    </View>
  );
}
