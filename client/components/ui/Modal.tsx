import React, { useEffect } from 'react';
import { View, Modal as RNModal, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/contexts/ThemeContext';
import { GlassSurface } from './GlassSurface';
import { Text } from './Text';
import { Button } from './Button';

type ModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  primaryAction?: { label: string; onPress: () => void; variant?: 'primary' | 'danger' };
  secondaryAction?: { label: string; onPress: () => void };
};

export function Modal({
  visible,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction,
}: ModalProps) {
  const theme = useAppTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: visible ? theme.duration.glass : theme.duration.fast,
    });
  }, [visible]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        onPress={onClose}
      >
        <Animated.View style={[{ width: '86%', maxWidth: 400 }, contentStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <GlassSurface level={4} borderRadius={theme.radius.xl}>
              <View style={{ padding: theme.spacing[6], gap: theme.spacing[5] }}>
                {title && <Text variant="h3">{title}</Text>}
                {children}
                {(primaryAction || secondaryAction) && (
                  <View style={{ gap: theme.spacing[3] }}>
                    {primaryAction && (
                      <Button
                        title={primaryAction.label}
                        onPress={primaryAction.onPress}
                        variant={primaryAction.variant ?? 'primary'}
                        fullWidth
                      />
                    )}
                    {secondaryAction && (
                      <Button
                        title={secondaryAction.label}
                        onPress={secondaryAction.onPress}
                        variant="ghost"
                        fullWidth
                      />
                    )}
                  </View>
                )}
              </View>
            </GlassSurface>
          </Pressable>
        </Animated.View>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
