// app/onboarding.tsx - Welcome/Onboarding Screen
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ShoppingBag, ArrowRight } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { defaultFontFamily, headingFontFamily } from "@/constants/Fonts";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function OnboardingScreen() {
  const { currentTheme, themeName } = useTheme();
  const isDark = themeName === "dark";

  const styles = createStyles(currentTheme, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Large Icon Section */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          style={styles.iconContainer}
        >
          <View style={styles.iconWrapper}>
            <ShoppingBag
              size={120}
              color={currentTheme.primary}
              strokeWidth={1.5}
            />
          </View>
        </Animated.View>

        {/* App Name & Tagline */}
        <View style={styles.textContainer}>
          <Text style={styles.appName}>EasyBuy</Text>
          <Text style={styles.tagline}>
            Premium products for your moments
          </Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeSubtitle}>
            Login or signup to continue
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/auth?mode=register")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
            <ArrowRight size={20} color={currentTheme.surface} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/auth?mode=login")}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guest Link */}
        <TouchableOpacity
          style={styles.guestLink}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.7}
        >
          <Text style={styles.guestLinkText}>Continue as a guest?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 32,
      justifyContent: "space-between",
    },
    iconContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 60,
    },
    iconWrapper: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: isDark
        ? "rgba(91, 143, 199, 0.1)"
        : "rgba(30, 58, 95, 0.08)",
      justifyContent: "center",
      alignItems: "center",
    },
    textContainer: {
      alignItems: "center",
      marginBottom: 40,
    },
    appName: {
      fontSize: 42,
      fontWeight: "700",
      color: theme.primary,
      letterSpacing: -0.5,
      marginBottom: 8,
      fontFamily: headingFontFamily,
    },
    tagline: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      fontWeight: "400",
      fontFamily: defaultFontFamily,
    },
    welcomeContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    welcomeTitle: {
      fontSize: 32,
      fontWeight: "700",
      color: theme.primary,
      marginBottom: 8,
      letterSpacing: -0.5,
      fontFamily: headingFontFamily,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
    },
    buttonContainer: {
      gap: 16,
      marginBottom: 24,
    },
    primaryButton: {
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
    },
    primaryButtonText: {
      color: theme.surface,
      fontSize: 18,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderRadius: 12,
      paddingVertical: 18,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.primary,
      minHeight: 56,
    },
    secondaryButtonText: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    guestLink: {
      alignItems: "center",
      paddingVertical: 12,
    },
    guestLinkText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "400",
    },
  });

