import React from 'react';
import { Pressable, View } from 'react-native';
import { CheckCircle2, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Notification } from '@/services/api';
import {
  getIntentColors,
  getNotificationIcon,
  getNotificationIntent,
} from '@/design';
import { Text } from './Text';
import { Surface } from './Surface';
import { IconButton } from './Button';

type Props = {
  notification: Notification;
  onPress: () => void;
  onMarkRead?: () => void;
  onDelete?: () => void;
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationCard({
  notification,
  onPress,
  onMarkRead,
  onDelete,
}: Props) {
  const theme = useAppTheme();
  const unread = !notification.read_at;
  const intent = getNotificationIntent(notification.type);
  const { accent, muted } = getIntentColors(theme, intent);
  const Icon = getNotificationIcon(notification.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? theme.pressScale : 1 }],
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Surface
        variant={unread ? 'elevated' : 'filled'}
        padding={5}
        radius="lg"
        style={{
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: unread ? accent : theme.colors.borderSubtle,
          backgroundColor: unread ? muted : theme.colors.surface,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: unread ? accent : theme.colors.borderSubtle,
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: theme.spacing[4],
            paddingLeft: theme.spacing[2],
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} color={accent} />
          </View>

          <View style={{ flex: 1, gap: theme.spacing[1] }}>
            <Text
              variant="title"
              style={{
                fontFamily: unread
                  ? theme.fontFamily.display.bold
                  : theme.fontFamily.display.semiBold,
              }}
            >
              {notification.title}
            </Text>
            <Text variant="bodySmall" color="secondary">
              {notification.message}
            </Text>
            <Text variant="caption" color="muted">
              {formatTimeAgo(notification.created_at)}
            </Text>
            {notification.priority === 'high' && (
              <View
                style={{
                  alignSelf: 'flex-start',
                  marginTop: theme.spacing[1],
                  paddingHorizontal: theme.spacing[3],
                  paddingVertical: theme.spacing[1],
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.dangerMuted,
                }}
              >
                <Text variant="caption" color="error">
                  High priority
                </Text>
              </View>
            )}
          </View>

          <View style={{ gap: theme.spacing[1] }}>
            {unread && onMarkRead && (
              <IconButton
                accessibilityLabel="Mark as read"
                icon={<CheckCircle2 size={18} color={theme.colors.primary} />}
                onPress={onMarkRead}
                size={36}
              />
            )}
            {onDelete && (
              <IconButton
                accessibilityLabel="Delete notification"
                icon={<Trash2 size={18} color={theme.colors.error} />}
                onPress={onDelete}
                size={36}
              />
            )}
          </View>
        </View>
      </Surface>
    </Pressable>
  );
}
