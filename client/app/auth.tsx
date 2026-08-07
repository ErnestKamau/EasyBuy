// app/auth.tsx - Complete Auth Flow with All Screens
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import {
  User,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  Shield,
  ArrowRight,
} from "lucide-react-native";
import LottieView from "lottie-react-native";
import { authApi, RegisterData, LoginData } from "../services/api";
import { ToastService } from "@/utils/toastService";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from "@/design";
import {
  Text,
  Surface,
  Button,
  IconButton,
  Input,
  Checkbox,
  OTPInput,
  Divider,
} from "@/components/ui";

// Lottie Animation Component
const LottieAnimation = ({
  source,
  size = 160,
  autoPlay = true,
  loop = true,
  fallbackIcon: FallbackIcon,
  fallbackColor,
}: {
  source?: any;
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
  fallbackIcon?: any;
  fallbackColor?: string;
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      setTimeout(() => {
        animationRef.current?.play();
      }, 100);
    }
  }, [autoPlay]);

  if (source) {
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
      // Fallback to icon if Lottie fails
      if (FallbackIcon) {
        return (
          <FallbackIcon
            size={size * 0.5}
            color={fallbackColor || "#000"}
            strokeWidth={1.5}
          />
        );
      }
    }
  }

  // Default fallback
  if (FallbackIcon) {
    return (
      <FallbackIcon
        size={size * 0.5}
        color={fallbackColor || "#000"}
        strokeWidth={1.5}
      />
    );
  }

  return null;
};

type AuthScreen =
  | "register"
  | "login"
  | "forgot-password"
  | "email-verification"
  | "verification-complete"
  | "reset-password"
  | "account-created"
  | "password-changed";

export default function AuthScreens() {
  const params = useLocalSearchParams();
  const theme = useAppTheme();
  const { login, socialLogin } = useAuth();
  const isDark = theme.mode === "dark";

  const [currentScreen, setCurrentScreen] = useState<AuthScreen>(
    (params.mode as AuthScreen) || "login",
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize Google Sign-In
  useEffect(() => {
    if (GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
          offlineAccess: true,
        });
      } catch (error) {
        console.log("GoogleSignin configuration error:", error);
      }
    }
  }, []);

  // Login state
  const [loginData, setLoginData] = useState<LoginData>({
    username: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);

  // Register state
  const [registerData, setRegisterData] = useState<RegisterData>({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    password_confirmation: "",
    gender: undefined,
    date_of_birth: "",
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Forgot password state
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  // Verification state — pre-populate from URL params when redirected here after registration
  const [verificationCode, setVerificationCode] = useState("");
  const [userEmail, setUserEmail] = useState(
    (params.email as string) || "",
  );
  const [verificationFlow, setVerificationFlow] = useState<
    "registration" | "password-reset" | null
  >(params.mode === "email-verification" ? "registration" : null);

  // Reset password state
  const [resetPasswordData, setResetPasswordData] = useState({
    password: "",
    password_confirmation: "",
  });

  const insets = useSafeAreaInsets();

  // Handle login
  const handleLogin = useCallback(async () => {
    if (!loginData.username || !loginData.password) {
      ToastService.showError("Validation Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(loginData);
      // Navigation handled by auth context
    } catch (error: any) {
      console.log("Login error:", error);
      const errorMessage = error.message || "Login failed. Please try again.";
      ToastService.showError("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loginData, login]);

  // Handle Google Login
  const handleGoogleLogin = useCallback(async () => {
    setGoogleLoading(true);
    try {
      if (!GoogleSignin) {
        ToastService.showError("Error", "Google Sign-In is not available in this build.");
        return;
      }
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error("No ID token received from Google");
      }

      await socialLogin("google", idToken);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("Google Sign-In Error:", error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        ToastService.showError("Process in Progress", "Google Sign-In is already running");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        ToastService.showError("Error", "Google Play Services not available");
      } else {
        ToastService.showError("Google Authentication Failed", error.message || "An unexpected error occurred");
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [socialLogin, router]);

  // Handle registration
  const handleRegister = useCallback(async () => {
    if (
      !registerData.username ||
      !registerData.first_name ||
      !registerData.last_name ||
      !registerData.email ||
      !registerData.password ||
      !registerData.date_of_birth
    ) {
      ToastService.showError(
        "Validation Error",
        "Please fill in all required fields",
      );
      return;
    }

    if (!privacyAccepted) {
      ToastService.showError(
        "Privacy Policy",
        "Please accept the privacy policy to continue",
      );
      return;
    }

    if (registerData.password !== registerData.password_confirmation) {
      ToastService.showError("Password Mismatch", "Passwords do not match");
      return;
    }

    if (registerData.password.length < 8) {
      ToastService.showError(
        "Weak Password",
        "Password must be at least 8 characters long",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      ToastService.showError("Invalid Email", "Please enter a valid email");
      return;
    }

    // Validate date of birth format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(registerData.date_of_birth)) {
      ToastService.showError(
        "Invalid Date",
        "Please enter date of birth in YYYY-MM-DD format",
      );
      return;
    }

    // Validate date is valid and not in the future
    const birthDate = new Date(registerData.date_of_birth);
    const today = new Date();
    if (isNaN(birthDate.getTime())) {
      ToastService.showError("Invalid Date", "Please enter a valid date");
      return;
    }
    if (birthDate > today) {
      ToastService.showError(
        "Invalid Date",
        "Date of birth cannot be in the future",
      );
      return;
    }

    setLoading(true);
    try {
      await authApi.register(registerData);
      setUserEmail(registerData.email);
      setVerificationFlow("registration");
      setCurrentScreen("email-verification");
      // Reset verification code input
      setVerificationCode("");
      ToastService.showSuccess(
        "Registration Successful!",
        "Please check your email for the OTP verification code",
      );
    } catch (error) {
      ToastService.showApiError(error, "Registration Failed");
    } finally {
      setLoading(false);
    }
  }, [registerData, privacyAccepted]);

  // Handle forgot password
  const handleForgotPassword = useCallback(async () => {
    if (!forgotPasswordEmail) {
      ToastService.showError("Validation Error", "Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      ToastService.showError("Invalid Email", "Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(forgotPasswordEmail);
      setUserEmail(forgotPasswordEmail);
      setVerificationFlow("password-reset");
      // Reset verification code input
      setVerificationCode("");
      setCurrentScreen("email-verification");
      ToastService.showSuccess(
        "Code Sent",
        "Please check your email for the OTP verification code",
      );
    } catch (error) {
      ToastService.showApiError(error, "Failed to send code");
    } finally {
      setLoading(false);
    }
  }, [forgotPasswordEmail]);

  // Handle verification submit
  const handleVerifyCode = useCallback(async () => {
    if (verificationCode.length !== 4) {
      ToastService.showError("Invalid Code", "Please enter the 4-digit code");
      return;
    }

    setLoading(true);
    try {
      const isRegistrationFlow = verificationFlow === "registration";

      if (isRegistrationFlow) {
        // Verify email code for registration
        await authApi.verifyEmailCode(userEmail, verificationCode);
        ToastService.showSuccess(
          "Email Verified!",
          "Your email has been verified successfully",
        );
        setCurrentScreen("account-created");
      } else {
        // Verify reset code for password reset
        await authApi.verifyResetCode(userEmail, verificationCode);
        ToastService.showSuccess(
          "Code Verified!",
          "Please set your new password",
        );
        setCurrentScreen("reset-password");
      }
    } catch (error) {
      ToastService.showApiError(error, "Verification Failed");
      // Clear code input on error
      setVerificationCode("");
    } finally {
      setLoading(false);
    }
  }, [verificationCode, verificationFlow, userEmail]);

  // Handle password reset
  const handleResetPassword = useCallback(async () => {
    if (
      !resetPasswordData.password ||
      !resetPasswordData.password_confirmation
    ) {
      ToastService.showError("Validation Error", "Please fill in all fields");
      return;
    }

    if (
      resetPasswordData.password !== resetPasswordData.password_confirmation
    ) {
      ToastService.showError("Password Mismatch", "Passwords do not match");
      return;
    }

    if (resetPasswordData.password.length < 8) {
      ToastService.showError(
        "Weak Password",
        "Password must be at least 8 characters",
      );
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(
        userEmail,
        verificationCode,
        resetPasswordData.password,
        resetPasswordData.password_confirmation,
      );
      // Clear password fields
      setResetPasswordData({
        password: "",
        password_confirmation: "",
      });
      setCurrentScreen("password-changed");
      ToastService.showSuccess(
        "Password Reset",
        "Your password has been reset successfully",
      );
    } catch (error) {
      ToastService.showApiError(error, "Password Reset Failed");
    } finally {
      setLoading(false);
    }
  }, [resetPasswordData, verificationCode, userEmail]);

  // Resend verification code
  const handleResendCode = useCallback(async () => {
    if (!userEmail) {
      ToastService.showError("Error", "Email address not found");
      return;
    }

    setLoading(true);
    try {
      const isRegistrationFlow = verificationFlow === "registration";

      if (isRegistrationFlow) {
        // Resend email verification OTP
        await authApi.resendEmailVerificationCode(userEmail);
      } else {
        // Resend password reset OTP
        await authApi.forgotPassword(userEmail);
      }
      ToastService.showSuccess(
        "Code Sent",
        "Verification code resent to your email",
      );
    } catch (error) {
      ToastService.showApiError(error, "Failed to resend code");
    } finally {
      setLoading(false);
    }
  }, [userEmail, verificationFlow]);

  const renderScreen = () => {
    switch (currentScreen) {
      case "register":
        return (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
          >
            <RegisterScreen
              registerData={registerData}
              setRegisterData={setRegisterData}
              privacyAccepted={privacyAccepted}
              setPrivacyAccepted={setPrivacyAccepted}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              loading={loading}
              onRegister={handleRegister}
              onSwitchToLogin={() => setCurrentScreen("login")}
              theme={theme}
            />
          </Animated.View>
        );
      case "login":
        return (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
          >
            <LoginScreen
              loginData={loginData}
              setLoginData={setLoginData}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              googleLoading={googleLoading}
              onLogin={handleLogin}
              onGoogleLogin={handleGoogleLogin}
              onSwitchToRegister={() => setCurrentScreen("register")}
              onForgotPassword={() => setCurrentScreen("forgot-password")}
              theme={theme}
            />
          </Animated.View>
        );
      case "forgot-password":
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
          >
            <ForgotPasswordScreen
              email={forgotPasswordEmail}
              setEmail={setForgotPasswordEmail}
              loading={loading}
              onSendCode={handleForgotPassword}
              onBack={() => setCurrentScreen("login")}
              theme={theme}
            />
          </Animated.View>
        );
      case "email-verification":
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
          >
            <EmailVerificationScreen
              email={userEmail}
              code={verificationCode}
              onCodeChange={setVerificationCode}
              loading={loading}
              onVerify={handleVerifyCode}
              onResend={handleResendCode}
              onBack={() => {
                setVerificationFlow(null);
                setCurrentScreen("login");
              }}
              theme={theme}
            />
          </Animated.View>
        );
      case "reset-password":
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
          >
            <ResetPasswordScreen
              passwordData={resetPasswordData}
              setPasswordData={setResetPasswordData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              loading={loading}
              onReset={handleResetPassword}
              theme={theme}
            />
          </Animated.View>
        );
      case "account-created":
        return (
          <Animated.View
            entering={FadeIn.duration(400).springify()}
            exiting={FadeOut.duration(200)}
          >
            <AccountCreatedScreen
              onContinue={() => {
                // Clear registration data and go to login
                setRegisterData({
                  username: "",
                  first_name: "",
                  last_name: "",
                  email: "",
                  phone_number: "",
                  password: "",
                  password_confirmation: "",
                  gender: undefined,
                  date_of_birth: "",
                });
                setVerificationCode("");
                setCurrentScreen("login");
              }}
              theme={theme}
            />
          </Animated.View>
        );
      case "password-changed":
        return (
          <Animated.View
            entering={FadeIn.duration(400).springify()}
            exiting={FadeOut.duration(200)}
          >
            <PasswordChangedScreen
              onContinue={() => setCurrentScreen("login")}
              theme={theme}
            />
          </Animated.View>
        );
      default:
        setCurrentScreen("login");
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={
          isDark
            ? [theme.colors.horizonStart, theme.colors.horizonEnd]
            : [theme.colors.horizonStart, theme.colors.background]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.55 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {currentScreen === "email-verification" ? (
        renderScreen()
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: theme.spacing[7],
                paddingTop: Math.max(insets.top, theme.spacing[6]),
                paddingBottom: Math.max(insets.bottom, theme.spacing[6]),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderScreen()}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// Shared header used across auth sub-screens
const AuthHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={styles.headerContainer}>
    <Text variant="h1" color="brand" style={{ textAlign: "center" }}>
      {title}
    </Text>
    <Text variant="subtitle" color="secondary" style={{ textAlign: "center" }}>
      {subtitle}
    </Text>
  </View>
);

// Icon in a soft circular badge — used for forgot-password / verification / success states
const IconBadge = ({
  icon,
  theme,
  size = 160,
}: {
  icon: React.ReactNode;
  theme: AppTheme;
  size?: number;
}) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.colors.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {icon}
  </View>
);

const EyeToggle = ({
  visible,
  onToggle,
  theme,
}: {
  visible: boolean;
  onToggle: () => void;
  theme: AppTheme;
}) => (
  <Pressable onPress={onToggle} hitSlop={8}>
    {visible ? (
      <EyeOff size={theme.iconSize.md} color={theme.colors.textMuted} />
    ) : (
      <Eye size={theme.iconSize.md} color={theme.colors.textMuted} />
    )}
  </Pressable>
);

const AuthLink = ({
  onPress,
  text,
  boldText,
  theme,
}: {
  onPress: () => void;
  text: string;
  boldText: string;
  theme: AppTheme;
}) => (
  <Pressable
    onPress={onPress}
    style={{ alignItems: "center", paddingVertical: theme.spacing[2] }}
  >
    <Text variant="body" color="secondary">
      {text} <Text variant="body" color="brand" style={{ fontWeight: "600" }}>{boldText}</Text>
    </Text>
  </Pressable>
);

// Registration Screen Component
const RegisterScreen = ({
  registerData,
  setRegisterData,
  privacyAccepted,
  setPrivacyAccepted,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  onRegister,
  onSwitchToLogin,
  theme,
}: any) => (
  <Surface variant="glass" glassLevel={3} radius="xl" padding={7}>
    <AuthHeader title="Create Account" subtitle="Sign up to continue" />

    <Input
      leftIcon={<User size={theme.iconSize.md} color={theme.colors.textMuted} />}
      placeholder="Username"
      value={registerData.username}
      onChangeText={(text) =>
        setRegisterData({ ...registerData, username: text })
      }
      autoCapitalize="none"
      autoCorrect={false}
      containerStyle={{ marginBottom: theme.spacing[5] }}
    />

    <View style={{ flexDirection: "row", gap: theme.spacing[4], marginBottom: theme.spacing[5] }}>
      <Input
        leftIcon={<User size={theme.iconSize.md} color={theme.colors.textMuted} />}
        placeholder="First Name"
        value={registerData.first_name}
        onChangeText={(text) =>
          setRegisterData({ ...registerData, first_name: text })
        }
        autoCapitalize="words"
        containerStyle={{ flex: 1 }}
      />

      <Input
        leftIcon={<User size={theme.iconSize.md} color={theme.colors.textMuted} />}
        placeholder="Last Name"
        value={registerData.last_name}
        onChangeText={(text) =>
          setRegisterData({ ...registerData, last_name: text })
        }
        autoCapitalize="words"
        containerStyle={{ flex: 1 }}
      />
    </View>

    <Input
      leftIcon={<Mail size={theme.iconSize.md} color={theme.colors.textMuted} />}
      placeholder="Email Address"
      value={registerData.email}
      onChangeText={(text) =>
        setRegisterData({ ...registerData, email: text })
      }
      keyboardType="email-address"
      autoCapitalize="none"
      autoComplete="email"
      containerStyle={{ marginBottom: theme.spacing[5] }}
    />

    <Input
      leftIcon={<Phone size={theme.iconSize.md} color={theme.colors.textMuted} />}
      placeholder="Phone Number (Optional)"
      value={registerData.phone_number}
      onChangeText={(text) =>
        setRegisterData({ ...registerData, phone_number: text })
      }
      keyboardType="phone-pad"
      containerStyle={{ marginBottom: theme.spacing[5] }}
    />

    <Input
      leftIcon={<User size={theme.iconSize.md} color={theme.colors.textMuted} />}
      placeholder="Date of Birth (YYYY-MM-DD)"
      value={registerData.date_of_birth}
      onChangeText={(text) => {
        // Allow only numbers and dashes, format as user types
        let formatted = text.replaceAll(/[^\d-]/g, "");
        // Auto-format as YYYY-MM-DD
        if (formatted.length > 4 && !formatted.includes("-")) {
          formatted = formatted.slice(0, 4) + "-" + formatted.slice(4);
        }
        if (formatted.length > 7 && formatted.split("-").length === 2) {
          formatted = formatted.slice(0, 7) + "-" + formatted.slice(7);
        }
        // Limit to 10 characters (YYYY-MM-DD)
        formatted = formatted.slice(0, 10);
        setRegisterData({ ...registerData, date_of_birth: formatted });
      }}
      keyboardType="numeric"
      maxLength={10}
      containerStyle={{ marginBottom: theme.spacing[5] }}
    />

    <Input
      leftIcon={<Lock size={theme.iconSize.md} color={theme.colors.textMuted} />}
      rightIcon={
        <EyeToggle
          visible={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          theme={theme}
        />
      }
      placeholder="Password (min 8 characters)"
      value={registerData.password}
      onChangeText={(text) =>
        setRegisterData({ ...registerData, password: text })
      }
      secureTextEntry={!showPassword}
      autoCapitalize="none"
      containerStyle={{ marginBottom: theme.spacing[5] }}
    />

    <Input
      leftIcon={<Lock size={theme.iconSize.md} color={theme.colors.textMuted} />}
      rightIcon={
        <EyeToggle
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          theme={theme}
        />
      }
      placeholder="Confirm Password"
      value={registerData.password_confirmation}
      onChangeText={(text) =>
        setRegisterData({ ...registerData, password_confirmation: text })
      }
      secureTextEntry={!showConfirmPassword}
      autoCapitalize="none"
      containerStyle={{ marginBottom: theme.spacing[6] }}
    />

    <Checkbox
      checked={privacyAccepted}
      onChange={setPrivacyAccepted}
      label="I agree with privacy policy"
    />

    <View style={{ height: theme.spacing[6] }} />

    <Button
      title="Sign Up"
      onPress={onRegister}
      loading={loading}
      fullWidth
      style={{ marginBottom: theme.spacing[4] }}
    />

    <AuthLink
      onPress={onSwitchToLogin}
      text="Already have an account?"
      boldText="Login"
      theme={theme}
    />
  </Surface>
);

// Login Screen Component
const LoginScreen = ({
  loginData,
  setLoginData,
  rememberMe,
  setRememberMe,
  showPassword,
  setShowPassword,
  loading,
  googleLoading,
  onLogin,
  onGoogleLogin,
  onSwitchToRegister,
  onForgotPassword,
  theme,
}: any) => (
  <Surface variant="glass" glassLevel={3} radius="xl" padding={7}>
    <View style={{ alignItems: "center", marginBottom: theme.spacing[5] }}>
      <Image
        source={require("@/assets/images/online-shopping-from-mobile.png")}
        style={{
          width: 180,
          height: 180,
          marginBottom: theme.spacing[4],
        }}
        resizeMode="contain"
      />
    </View>

    <AuthHeader title="Login Account" subtitle="Welcome Back!" />

    <Input
      leftIcon={<User size={theme.iconSize.md} color={theme.colors.textMuted} />}
      placeholder="Username or Email"
      value={loginData.username}
      onChangeText={(text) => setLoginData({ ...loginData, username: text })}
      autoCapitalize="none"
      autoComplete="username"
      containerStyle={{ marginBottom: theme.spacing[5] }}
    />

    <Input
      leftIcon={<Lock size={theme.iconSize.md} color={theme.colors.textMuted} />}
      rightIcon={
        <EyeToggle
          visible={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          theme={theme}
        />
      }
      placeholder="Password"
      value={loginData.password}
      onChangeText={(text) => setLoginData({ ...loginData, password: text })}
      secureTextEntry={!showPassword}
      autoCapitalize="none"
      autoComplete="password"
      containerStyle={{ marginBottom: theme.spacing[5] }}
    />

    <View style={styles.rememberForgotRow}>
      <Checkbox
        checked={rememberMe}
        onChange={setRememberMe}
        label="Keep me logged in"
      />
      <Pressable onPress={onForgotPassword} hitSlop={8}>
        <Text variant="label" color="brand">
          Forgot Password?
        </Text>
      </Pressable>
    </View>

    <View style={{ height: theme.spacing[3] }} />

    <Button
      title="Login"
      onPress={onLogin}
      loading={loading}
      fullWidth
      style={{ marginBottom: theme.spacing[5] }}
    />

    <View style={styles.socialDivider}>
      <Divider style={{ flex: 1 }} />
      <Text
        variant="caption"
        color="muted"
        style={{ marginHorizontal: theme.spacing[4] }}
      >
        OR
      </Text>
      <Divider style={{ flex: 1 }} />
    </View>

    <View style={{ height: theme.spacing[5] }} />

    <Button
      title="Continue with Google"
      variant="secondary"
      onPress={onGoogleLogin}
      loading={googleLoading}
      disabled={googleLoading || loading}
      fullWidth
      leftIcon={
        <Text style={{ color: "#4285F4", fontWeight: "bold", fontSize: 18 }}>
          G
        </Text>
      }
      style={{ marginBottom: theme.spacing[5] }}
    />

    <AuthLink
      onPress={onSwitchToRegister}
      text="Don't have an account?"
      boldText="Sign Up"
      theme={theme}
    />
  </Surface>
);

// Forgot Password Screen Component
const ForgotPasswordScreen = ({
  email,
  setEmail,
  loading,
  onSendCode,
  onBack,
  theme,
}: any) => (
  <Surface variant="glass" glassLevel={3} radius="xl" padding={7}>
    <IconButton
      icon={<ArrowLeft size={theme.iconSize.lg} color={theme.colors.text} />}
      onPress={onBack}
      accessibilityLabel="Back"
      style={{ alignSelf: "flex-start", marginBottom: theme.spacing[5] }}
    />

    <View style={{ alignItems: "center", marginBottom: theme.spacing[8] }}>
      <IconBadge
        theme={theme}
        icon={<Shield size={80} color={theme.colors.primary} strokeWidth={1.5} />}
      />
    </View>

    <AuthHeader title="Forgot Password?" subtitle="No worries, We got you." />

    <Text
      variant="body"
      color="secondary"
      style={{ textAlign: "center", marginBottom: theme.spacing[6] }}
    >
      We'll send you code to reset it.
    </Text>

    <Input
      leftIcon={<Mail size={theme.iconSize.md} color={theme.colors.textMuted} />}
      placeholder="Email Address"
      value={email}
      onChangeText={setEmail}
      keyboardType="email-address"
      autoCapitalize="none"
      autoComplete="email"
      containerStyle={{ marginBottom: theme.spacing[6] }}
    />

    <Button
      title="Send Code"
      onPress={onSendCode}
      loading={loading}
      fullWidth
      style={{ marginBottom: theme.spacing[4] }}
    />

    <Pressable
      onPress={onBack}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing[2],
        paddingVertical: theme.spacing[2],
      }}
    >
      <ArrowLeft size={theme.iconSize.sm} color={theme.colors.textSecondary} />
      <Text variant="body" color="secondary">
        Back to log in?
      </Text>
    </Pressable>
  </Surface>
);

// Email Verification Screen Component
const EmailVerificationScreen = ({
  email,
  code,
  onCodeChange,
  loading,
  onVerify,
  onResend,
  onBack,
  theme,
}: any) => (
  <Surface variant="glass" glassLevel={3} radius="xl" padding={7}>
    <IconButton
      icon={<ArrowLeft size={theme.iconSize.lg} color={theme.colors.text} />}
      onPress={onBack}
      accessibilityLabel="Back"
      style={{ alignSelf: "flex-start", marginBottom: theme.spacing[5] }}
    />

    <View style={{ alignItems: "center", marginBottom: theme.spacing[8] }}>
      <IconBadge
        theme={theme}
        icon={<Mail size={80} color={theme.colors.primary} strokeWidth={1.5} />}
      />
    </View>

    <AuthHeader title="Verify Email" subtitle="Enter the 4-digit code sent to" />

    <Text
      variant="body"
      color="primary"
      style={{ textAlign: "center", marginBottom: theme.spacing[8] }}
    >
      {email}{" "}
      <Text
        variant="body"
        color="brand"
        style={{ fontWeight: "700" }}
        onPress={onBack}
      >
        Edit
      </Text>
    </Text>

    <View style={{ marginBottom: theme.spacing[8] }}>
      <OTPInput length={4} value={code} onChange={onCodeChange} />
    </View>

    <Button
      title="Verify"
      onPress={onVerify}
      loading={loading}
      fullWidth
      style={{ marginBottom: theme.spacing[4] }}
    />

    <AuthLink
      onPress={onResend}
      text="Didn't receive code?"
      boldText="Resend"
      theme={theme}
    />
  </Surface>
);

// Reset Password Screen Component
const ResetPasswordScreen = ({
  passwordData,
  setPasswordData,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  onReset,
  theme,
}: any) => (
  <Surface variant="glass" glassLevel={3} radius="xl" padding={7}>
    <View style={{ alignItems: "center", marginBottom: theme.spacing[8] }}>
      <IconBadge
        theme={theme}
        icon={
          <LottieAnimation
            source={require("@/assets/lottie/set-password.json")}
            size={160}
            autoPlay={true}
            loop={true}
            fallbackIcon={Lock}
            fallbackColor={theme.colors.primary}
          />
        }
      />
    </View>

    <AuthHeader title="Set New Password" subtitle="Create a unique password." />

    <Input
      leftIcon={<Lock size={theme.iconSize.md} color={theme.colors.textMuted} />}
      rightIcon={
        <EyeToggle
          visible={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          theme={theme}
        />
      }
      placeholder="New Password"
      value={passwordData.password}
      onChangeText={(text) =>
        setPasswordData({ ...passwordData, password: text })
      }
      secureTextEntry={!showPassword}
      autoCapitalize="none"
      containerStyle={{ marginBottom: theme.spacing[5] }}
    />

    <Input
      leftIcon={<Lock size={theme.iconSize.md} color={theme.colors.textMuted} />}
      rightIcon={
        <EyeToggle
          visible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          theme={theme}
        />
      }
      placeholder="Confirm Password"
      value={passwordData.password_confirmation}
      onChangeText={(text) =>
        setPasswordData({ ...passwordData, password_confirmation: text })
      }
      secureTextEntry={!showConfirmPassword}
      autoCapitalize="none"
      containerStyle={{ marginBottom: theme.spacing[6] }}
    />

    <Button title="Reset Password" onPress={onReset} loading={loading} fullWidth />
  </Surface>
);

// Account Created Success Screen
const AccountCreatedScreen = ({ onContinue, theme }: any) => (
  <Surface
    variant="glass"
    glassLevel={3}
    radius="xl"
    padding={8}
    style={{ minHeight: 500, justifyContent: "center", alignItems: "center" }}
  >
    <View style={{ alignItems: "center", marginBottom: theme.spacing[8] }}>
      <IconBadge
        theme={theme}
        size={200}
        icon={<CheckCircle size={120} color={theme.colors.primary} strokeWidth={2} />}
      />
    </View>

    <AuthHeader title="Account Created!" subtitle="Welcome to EasyBuy." />

    <Text variant="body" color="secondary" style={{ textAlign: "center" }}>
      Your account has been created
    </Text>
    <Text
      variant="h2"
      color="brand"
      style={{ textAlign: "center", marginBottom: theme.spacing[9] }}
    >
      Successfully!
    </Text>

    <Button
      title="Continue"
      onPress={onContinue}
      fullWidth
      rightIcon={<ArrowRight size={theme.iconSize.md} color={theme.colors.textOnPrimary} />}
    />
  </Surface>
);

// Password Changed Success Screen
const PasswordChangedScreen = ({ onContinue, theme }: any) => (
  <Surface
    variant="glass"
    glassLevel={3}
    radius="xl"
    padding={8}
    style={{ minHeight: 500, justifyContent: "center", alignItems: "center" }}
  >
    <View style={{ alignItems: "center", marginBottom: theme.spacing[8] }}>
      <IconBadge
        theme={theme}
        size={200}
        icon={
          <LottieAnimation
            source={require("@/assets/lottie/success.json")}
            size={160}
            autoPlay={true}
            loop={false}
            fallbackIcon={CheckCircle}
            fallbackColor={theme.colors.primary}
          />
        }
      />
    </View>

    <AuthHeader title="Password Changed!" subtitle="No hassle anymore." />

    <Text variant="body" color="secondary" style={{ textAlign: "center" }}>
      Your password has been reset
    </Text>
    <Text
      variant="h2"
      color="brand"
      style={{ textAlign: "center", marginBottom: theme.spacing[9] }}
    >
      Successfully!
    </Text>

    <Button
      title="Continue"
      onPress={onContinue}
      fullWidth
      rightIcon={<ArrowRight size={theme.iconSize.md} color={theme.colors.textOnPrimary} />}
    />
  </Surface>
);

// Layout-only styles (no theme colors — token-driven values are applied inline)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
    gap: 4,
  },
  rememberForgotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  socialDivider: {
    flexDirection: "row",
    alignItems: "center",
  },
});
