import React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { BottomSheet } from './BottomSheet';
import { Text } from './Text';
import { Button } from './Button';

type SheetStatusProps = {
  visible: boolean;
  onClose: () => void;
  status: 'processing' | 'success' | 'error';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const LOTTIE = {
  processing: require('../../assets/lottie/info.json'),
  success: require('../../assets/lottie/success.json'),
  error: require('../../assets/lottie/error.json'),
};

const DEFAULTS = {
  processing: { title: 'Processing...', message: 'Please wait a moment' },
  success: { title: 'Success!', message: 'Your action completed successfully' },
  error: { title: 'Something went wrong', message: 'Please try again' },
};

export function SheetStatus({
  visible,
  onClose,
  status,
  title,
  message,
  actionLabel,
  onAction,
}: SheetStatusProps) {
  const theme = useAppTheme();
  const defaults = DEFAULTS[status];

  return (
    <BottomSheet visible={visible} onClose={status === 'processing' ? () => {} : onClose} snap={0.42}>
      <View style={{ alignItems: 'center', gap: theme.spacing[4], paddingVertical: theme.spacing[4] }}>
        <LottieView
          source={LOTTIE[status]}
          autoPlay
          loop={status === 'processing'}
          style={{ width: 100, height: 100 }}
        />
        <Text variant="h3" style={{ textAlign: 'center' }}>
          {title ?? defaults.title}
        </Text>
        <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
          {message ?? defaults.message}
        </Text>
        {status !== 'processing' && (
          <Button
            title={actionLabel ?? (status === 'success' ? 'Nice one!' : 'Dismiss')}
            onPress={onAction ?? onClose}
            fullWidth
            variant={status === 'error' ? 'danger' : 'primary'}
          />
        )}
      </View>
    </BottomSheet>
  );
}
