import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Svg, { Ellipse, Rect, Circle, Path, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getReducedMotion, subscribeReducedMotion } from '@/design/tokens/motion';

export type EmptyIllustrationKind = 'inbox' | 'error';

const NO_MESSAGES = require('@/assets/illustrations/no-messages.png');
const ART_RATIO = 397 / 276;

type Props = {
  kind: EmptyIllustrationKind;
  size?: number;
};

export function EmptyIllustration({ kind, size = 300 }: Props) {
  const height = kind === 'inbox' ? size / ART_RATIO : size * 0.78;

  if (kind === 'inbox') {
    return <InboxScene width={size} height={height} />;
  }

  return (
    <View style={{ width: size, height, alignItems: 'center' }}>
      <ErrorScene width={size} height={height} />
    </View>
  );
}

function InboxScene({ width, height }: { width: number; height: number }) {
  const theme = useAppTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const pokeX = useSharedValue(0);
  const pokeY = useSharedValue(0);
  const pokeRot = useSharedValue(0);
  const ping = useSharedValue(0);

  useEffect(() => {
    getReducedMotion().then(setReduceMotion);
    return subscribeReducedMotion(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pokeX.value = 0;
      pokeY.value = 0;
      pokeRot.value = 0;
      ping.value = 0;
      return;
    }

    const pokeEase = Easing.bezier(0.2, 0, 0, 1);
    pokeRot.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(-2.4, { duration: 160, easing: pokeEase }),
        withTiming(0.6, { duration: 120 }),
        withTiming(0, { duration: 280, easing: pokeEase }),
        withTiming(0, { duration: 1400 }),
      ),
      -1,
      false,
    );
    pokeX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(4, { duration: 160, easing: pokeEase }),
        withTiming(-3, { duration: 90 }),
        withTiming(2, { duration: 90 }),
        withTiming(0, { duration: 220, easing: pokeEase }),
        withTiming(0, { duration: 1400 }),
      ),
      -1,
      false,
    );
    pokeY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(3, { duration: 160, easing: pokeEase }),
        withTiming(0, { duration: 400, easing: pokeEase }),
        withTiming(0, { duration: 1400 }),
      ),
      -1,
      false,
    );
    ping.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(1, { duration: 80 }),
        withDelay(220, withTiming(0, { duration: 420 })),
        withTiming(0, { duration: 1400 }),
      ),
      -1,
      false,
    );
  }, [reduceMotion, pokeX, pokeY, pokeRot, ping]);

  const artStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pokeX.value },
      { translateY: pokeY.value },
      { rotate: `${pokeRot.value}deg` },
    ],
  }));

  const pingStyle = useAnimatedStyle(() => ({
    opacity: ping.value,
    transform: [{ scale: 0.92 + ping.value * 0.12 }],
  }));

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: width * 0.92,
          height: height * 0.72,
          borderRadius: 999,
          backgroundColor: theme.colors.primaryMuted,
          opacity: theme.mode === 'dark' ? 0.55 : 0.7,
        }}
      />
      <Animated.View style={[{ width, height }, artStyle]}>
        <Image
          source={NO_MESSAGES}
          style={{ width, height }}
          resizeMode="contain"
          accessibilityLabel="Waiting for a message"
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: width * 0.22,
            top: height * 0.68,
            gap: 5,
          },
          pingStyle,
        ]}
      >
        {[18, 14, 10].map((wLen, i) => (
          <View
            key={i}
            style={{
              width: wLen,
              height: 2,
              borderRadius: 1,
              backgroundColor: theme.colors.primary,
              transform: [{ rotate: `${-28 + i * 28}deg` }],
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function ErrorScene({ width, height }: { width: number; height: number }) {
  const theme = useAppTheme();
  const line = theme.colors.info;
  const fill = theme.colors.infoMuted;
  const cloud = theme.mode === 'dark' ? theme.colors.surfaceRaised : theme.colors.backgroundSecondary;
  const face = theme.colors.text;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 280 220">
        <Ellipse cx="70" cy="48" rx="28" ry="14" fill={cloud} />
        <Ellipse cx="92" cy="48" rx="18" ry="10" fill={cloud} />
        <Ellipse cx="210" cy="40" rx="32" ry="16" fill={cloud} opacity={0.8} />
        <Ellipse cx="232" cy="40" rx="16" ry="10" fill={cloud} opacity={0.8} />

        <Path d="M88 78 Q140 28 192 78" stroke={line} strokeWidth="2.4" fill={fill} />
        <Path d="M88 78 Q140 58 192 78" stroke={line} strokeWidth="1.2" fill="none" />
        <Line x1="100" y1="78" x2="132" y2="132" stroke={line} strokeWidth="1.4" />
        <Line x1="140" y1="52" x2="140" y2="132" stroke={line} strokeWidth="1.4" />
        <Line x1="180" y1="78" x2="148" y2="132" stroke={line} strokeWidth="1.4" />

        <Circle cx="140" cy="148" r="16" fill={fill} stroke={line} strokeWidth="2" />
        <Circle cx="134" cy="146" r="2.4" fill={face} />
        <Circle cx="146" cy="146" r="2.4" fill={face} />
        <Path d="M134 156 Q140 160 146 156" stroke={face} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <Rect x="128" y="164" width="24" height="28" rx="8" fill={fill} stroke={line} strokeWidth="2" />
        <Path d="M128 172 L112 188" stroke={line} strokeWidth="2.2" strokeLinecap="round" />
        <Path d="M152 172 L168 188" stroke={line} strokeWidth="2.2" strokeLinecap="round" />
        <Path d="M134 190 L128 208" stroke={line} strokeWidth="2.2" strokeLinecap="round" />
        <Path d="M146 190 L152 208" stroke={line} strokeWidth="2.2" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
