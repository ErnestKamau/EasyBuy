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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

const goToLogin = () => {
  AsyncStorage.setItem(ONBOARDING_KEY, "true");
  router.replace("/auth?mode=login");
};

const goToRegister = () => {
  AsyncStorage.setItem(ONBOARDING_KEY, "true");
  router.replace("/auth?mode=register");
};

export default function OnboardingScreen() {
  const { currentTheme, themeName } = useTheme();
  const isDark = themeName === "dark";
  const insets = useSafeAreaInsets();

  const styles = createStyles(currentTheme, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen 1: Quality Khat, Delivered Fresh */}
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(200)}
          style={styles.screenContainer}
        >
          <View style={styles.iconContainer}>
            <LottieAnimation
              source={require("@/assets/lottie/delivery-boy.json")}
              size={300}
              autoPlay={true}
              loop={true}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>Welcome to EasyBuy</Text>
            <Text style={styles.titleHighlight}>
              Your one-stop shop for quality Mirraa and more
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={goToLogin}>
              <Text style={styles.primaryButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={goToRegister}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      marginTop: -20,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
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
      marginBottom: 30,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.primary,
      textAlign: "center",
      letterSpacing: -0.5,
      marginBottom: 12,
      fontFamily: headingFontFamily,
    },
    titleHighlight: {
      fontSize: 22,
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
      marginBottom: 24,
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
      marginBottom: 40,
    },
    nextButtonText: {
      color: theme.surface,
      fontSize: 18,
      fontWeight: "600",
      letterSpacing: 0.3,
      fontFamily: defaultFontFamily,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 32,
    },
    primaryButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 44,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      flexDirection: "row",
      minHeight: 56,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    secondaryButton: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      minHeight: 56,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    primaryButtonText: {
      color: theme.surface,
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.3,
      fontFamily: defaultFontFamily,
    },
    secondaryButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.3,
      fontFamily: defaultFontFamily,
    },
  });
