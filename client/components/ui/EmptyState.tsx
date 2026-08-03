import React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  lottie?: any;
};

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  lottie,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing[8],
        gap: theme.spacing[4],
      }}
    >
      {lottie && (
        <LottieView source={lottie} autoPlay loop style={{ width: 160, height: 160 }} />
      )}
      <Text variant="h3" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {message && (
        <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: theme.spacing[3] }} />
      )}
    </View>
  );
}
