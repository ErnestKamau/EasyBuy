// app/onboarding.tsx — Jade Horizon
import React, { useRef, useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Screen, Text, Button, ProgressDots, GlassSurface } from '@/components/ui';

const ONBOARDING_KEY = 'has_seen_onboarding';
const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'fresh',
    title: 'Quality, delivered fresh',
    body: 'Browse curated products and get them delivered to your door — calmly, quickly, reliably.',
    lottie: require('../assets/lottie/delivery-boy.json'),
  },
  {
    key: 'social',
    title: 'Share the moment',
    body: 'Invite friends, track every order, and enjoy a premium experience built around you.',
    lottie: require('../assets/lottie/friends-socializing.json'),
  },
];

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const animRef = useRef<LottieView>(null);

  useEffect(() => {
    animRef.current?.play();
  }, [index]);

  const finish = async (mode: 'login' | 'register') => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace(`/auth?mode=${mode}` as any);
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.fill, { paddingHorizontal: theme.spacing[6], paddingBottom: theme.spacing[6] }]}>
        <Animated.View
          key={slide.key}
          entering={FadeIn.duration(theme.duration.slow)}
          style={styles.hero}
        >
          <LottieView
            ref={animRef}
            source={slide.lottie}
            autoPlay
            loop
            style={{ width: width * 0.7, height: width * 0.7 }}
          />
        </Animated.View>

        <GlassSurface level={2} borderRadius={theme.radius.xl} style={{ marginBottom: theme.spacing[6] }}>
          <Animated.View
            entering={FadeInDown.duration(theme.duration.normal)}
            style={{ padding: theme.spacing[6], gap: theme.spacing[3] }}
          >
            <Text variant="h2" style={{ textAlign: 'center' }}>
              {slide.title}
            </Text>
            <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
              {slide.body}
            </Text>
          </Animated.View>
        </GlassSurface>

        <ProgressDots count={SLIDES.length} index={index} />

        <View style={{ flex: 1 }} />

        <View style={{ gap: theme.spacing[3] }}>
          {isLast ? (
            <>
              <Button
                title="Create account"
                onPress={() => finish('register')}
                fullWidth
                rightIcon={<ArrowRight size={18} color={theme.colors.textOnPrimary} />}
              />
              <Button title="Log in" variant="ghost" onPress={() => finish('login')} fullWidth />
            </>
          ) : (
            <Button
              title="Continue"
              onPress={() => setIndex((i) => i + 1)}
              fullWidth
              rightIcon={<ArrowRight size={18} color={theme.colors.textOnPrimary} />}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 240 },
});
