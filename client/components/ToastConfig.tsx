/**
 * ToastConfig — Jade Horizon tokens
 */
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import { CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { jadeLight } from '@/design';
import { Text } from '@/components/ui/Text';

const TOAST_WIDTH = Dimensions.get('window').width - 32;

const AnimatedIcon = ({
  source,
  size = 48,
  FallbackIcon,
  color,
}: {
  source?: any;
  size?: number;
  FallbackIcon?: any;
  color?: string;
}) => {
  const animationRef = useRef<LottieView>(null);
  useEffect(() => {
    animationRef.current?.play();
  }, []);

  if (source) {
    return (
      <LottieView
        ref={animationRef}
        source={source}
        style={{ width: size, height: size }}
        autoPlay
        loop={false}
      />
    );
  }
  if (FallbackIcon) {
    return <FallbackIcon size={size * 0.5} color={color} strokeWidth={2.5} />;
  }
  return null;
};

type Tone = 'success' | 'error' | 'info' | 'warning';

const TONE: Record<
  Tone,
  { bg: string; border: string; title: string; message: string; bar: string; lottie: any; Icon: any }
> = {
  success: {
    bg: jadeLight.colors.successMuted,
    border: jadeLight.colors.success,
    title: jadeLight.colors.secondary,
    message: jadeLight.colors.success,
    bar: jadeLight.colors.success,
    lottie: require('@/assets/lottie/success.json'),
    Icon: CheckCircle,
  },
  error: {
    bg: jadeLight.colors.dangerMuted,
    border: jadeLight.colors.error,
    title: '#991B1B',
    message: jadeLight.colors.error,
    bar: jadeLight.colors.error,
    lottie: require('@/assets/lottie/error.json'),
    Icon: XCircle,
  },
  info: {
    bg: jadeLight.colors.infoMuted,
    border: jadeLight.colors.info,
    title: '#1E40AF',
    message: jadeLight.colors.info,
    bar: jadeLight.colors.info,
    lottie: require('@/assets/lottie/info.json'),
    Icon: AlertCircle,
  },
  warning: {
    bg: jadeLight.colors.warningMuted,
    border: jadeLight.colors.warning,
    title: '#92400E',
    message: jadeLight.colors.warning,
    bar: jadeLight.colors.warning,
    lottie: require('@/assets/lottie/warning.json'),
    Icon: AlertTriangle,
  },
};

function ToastCard({ tone, text1, text2 }: { tone: Tone; text1?: string; text2?: string }) {
  const t = TONE[tone];
  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(160)}
      style={styles.container}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: t.bg,
            borderLeftColor: t.border,
            borderRadius: jadeLight.radius.lg,
            ...jadeLight.getElevation('elv400'),
          },
        ]}
      >
        <View style={styles.icon}>
          <AnimatedIcon source={t.lottie} FallbackIcon={t.Icon} color={t.border} />
        </View>
        <View style={styles.content}>
          {text1 && (
            <Text variant="label" style={{ color: t.title }} numberOfLines={2}>
              {text1}
            </Text>
          )}
          {text2 && (
            <Text variant="caption" style={{ color: t.message, marginTop: 2 }} numberOfLines={3}>
              {text2}
            </Text>
          )}
        </View>
        <View style={[styles.barTrack, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
          <View style={[styles.bar, { backgroundColor: t.bar }]} />
        </View>
      </View>
    </Animated.View>
  );
}

export const toastConfig = {
  success: (props: any) => <ToastCard tone="success" text1={props.text1} text2={props.text2} />,
  error: (props: any) => <ToastCard tone="error" text1={props.text1} text2={props.text2} />,
  info: (props: any) => <ToastCard tone="info" text1={props.text1} text2={props.text2} />,
  warning: (props: any) => <ToastCard tone="warning" text1={props.text1} text2={props.text2} />,
};

const styles = StyleSheet.create({
  container: {
    width: TOAST_WIDTH,
    alignSelf: 'center',
    marginTop: Platform.OS === 'ios' ? 50 : 20,
  },
  toast: {
    width: '100%',
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  icon: { marginRight: 12, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingRight: 8 },
  barTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  bar: { height: '100%', width: '100%' },
});
