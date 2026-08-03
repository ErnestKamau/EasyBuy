import React, { useEffect } from 'react';
import {
  View,
  Modal as RNModal,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/contexts/ThemeContext';
import { GlassSurface } from './GlassSurface';

const SCREEN_H = Dimensions.get('window').height;

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Fraction of screen height, default 0.5 */
  snap?: number;
};

/**
 * Snap-point glass sheet (Glass 4). Drag handle + backdrop dismiss.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  snap = 0.55,
}: BottomSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = React.useState(visible);
  const sheetH = SCREEN_H * snap;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: theme.duration.glass });
    } else {
      progress.value = withTiming(0, { duration: theme.duration.normal }, (f) => {
        if (f) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - progress.value) * sheetH,
      },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.6,
  }));

  // Simple pan without requiring gesture-handler reanimated plugin complexity
  // Use Pressable drag fallback via onClose on backdrop

  if (!mounted) return null;

  return (
    <RNModal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.fill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backdropStyle]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: sheetH + insets.bottom,
            },
            sheetStyle,
          ]}
        >
          <GlassSurface
            level={4}
            borderRadius={theme.radius['2xl']}
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                paddingBottom: insets.bottom + theme.spacing[4],
                paddingTop: theme.spacing[3],
              }}
            >
              <View style={{ alignItems: 'center', marginBottom: theme.spacing[3] }}>
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.colors.border,
                  }}
                />
              </View>
              <View style={{ paddingHorizontal: theme.spacing[5] }}>{children}</View>
            </View>
          </GlassSurface>
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
});
