// app/onboarding.tsx - Two-Screen Onboarding Flow with Lottie Animations
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight, ArrowLeft } from "lucide-react-native";
import LottieView from "lottie-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { defaultFontFamily, headingFontFamily } from "@/constants/Fonts";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const ONBOARDING_KEY = "has_seen_onboarding";

// Lottie Animation Component
const LottieAnimation = ({
  source,
  size = 300,
  autoPlay = true,
  loop = true,
}: {
  source?: any;
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      // Small delay to ensure the view is mounted
      setTimeout(() => {
        animationRef.current?.play();
      }, 100);
    }
  }, [autoPlay]);

  if (!source) {
    return null;
  }

  try {
    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LottieView
          ref={animationRef}
          source={source}
          style={{ width: size, height: size }}
          autoPlay={autoPlay}
          loop={loop}
          resizeMode="contain"
        />
      </View>
    );
  } catch (error) {
    console.log("Lottie animation error:", error);
    return null;
  }
};

export default function OnboardingScreen() {
  const { currentTheme, themeName } = useTheme();
  const isDark = themeName === "dark";
  const [currentScreen, setCurrentScreen] = useState(0);
  const [screenKey, setScreenKey] = useState(0);

  const styles = createStyles(currentTheme, isDark);

  useEffect(() => {
    setScreenKey((prev) => prev + 1);
  }, [currentScreen]);

  const handleNext = () => {
    if (currentScreen === 0) {
      setCurrentScreen(1);
    } else {
      // Mark onboarding as seen and go to auth
      AsyncStorage.setItem(ONBOARDING_KEY, "true");
      router.replace("/auth?mode=login");
    }
  };

  const handleSkip = () => {
    AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/auth?mode=login");
  };

  const handleBack = () => {
    if (currentScreen === 1) {
      setCurrentScreen(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Skip Button */}
        {currentScreen === 0 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Back Button (Screen 2 only) */}
        {currentScreen === 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={currentTheme.text} />
          </TouchableOpacity>
        )}

        {/* Screen 1: Quality Khat, Delivered Fresh */}
        {currentScreen === 0 && (
          <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            key={`screen-0-${screenKey}`}
            style={styles.screenContainer}
          >
            <View style={styles.iconContainer}>
              <LottieAnimation
                source={require("@/assets/lottie/delivery-boy.json")}
                size={280}
                autoPlay={true}
                loop={true}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>Quality Khat,</Text>
              <Text style={styles.titleHighlight}>Delivered Fresh</Text>
              <Text style={styles.description}>
                Get premium quality khat and refreshments delivered right to
                your door. Fast, fresh, and convenient - perfect for when you
                need it most.
              </Text>
            </View>

            <View style={styles.indicatorContainer}>
              <View style={[styles.indicator, styles.indicatorActive]} />
              <View style={styles.indicator} />
            </View>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <ArrowRight size={20} color={currentTheme.surface} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Screen 2: Chill, Connect, Enjoy */}
        {currentScreen === 1 && (
          <Animated.View
            entering={SlideInRight.duration(400)}
            exiting={SlideOutLeft.duration(200)}
            key={`screen-1-${screenKey}`}
            style={styles.screenContainer}
          >
            <View style={[styles.iconContainer, styles.iconContainerLarge]}>
              <LottieAnimation
                source={require("@/assets/lottie/skeleton-playing-guitar.json")}
                size={350}
                autoPlay={true}
                loop={true}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>Chill, Connect,</Text>
              <Text style={styles.titleHighlight}>Enjoy</Text>
              <Text style={styles.description}>
                Join our community and enjoy quality time with friends. Visit
                our chill zone or have everything delivered - your choice, your
                convenience.
              </Text>
            </View>

            <View style={styles.indicatorContainer}>
              <View style={styles.indicator} />
              <View style={[styles.indicator, styles.indicatorActive]} />
            </View>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Get Started</Text>
              <ArrowRight size={20} color={currentTheme.surface} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 40,
    },
    skipButton: {
      alignSelf: "flex-end",
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    skipButtonText: {
      fontSize: 16,
      color: theme.textSecondary,
      fontWeight: "500",
      fontFamily: defaultFontFamily,
    },
    backButton: {
      alignSelf: "flex-start",
      padding: 8,
      marginBottom: 20,
    },
    screenContainer: {
      flex: 1,
      justifyContent: "space-between",
      minHeight: screenHeight * 0.85,
    },
    iconContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 40,
      paddingBottom: 20,
      minHeight: 300,
      width: "100%",
    },
    iconContainerLarge: {
      minHeight: 400,
      paddingTop: 20,
      paddingBottom: 10,
    },
    textContainer: {
      alignItems: "center",
      marginBottom: 40,
    },
    title: {
      fontSize: 36,
      fontWeight: "700",
      color: theme.primary,
      textAlign: "center",
      letterSpacing: -0.5,
      marginBottom: 4,
      fontFamily: headingFontFamily,
    },
    titleHighlight: {
      fontSize: 36,
      fontWeight: "700",
      color: theme.primary,
      textAlign: "center",
      letterSpacing: -0.5,
      marginBottom: 16,
      fontFamily: headingFontFamily,
    },
    description: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 20,
      fontFamily: defaultFontFamily,
    },
    indicatorContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginBottom: 32,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.textSecondary + "40",
    },
    indicatorActive: {
      width: 24,
      backgroundColor: theme.primary,
    },
    nextButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 18,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      minHeight: 56,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 20,
    },
    nextButtonText: {
      color: theme.surface,
      fontSize: 18,
      fontWeight: "600",
      letterSpacing: 0.3,
      fontFamily: defaultFontFamily,
    },
  });
