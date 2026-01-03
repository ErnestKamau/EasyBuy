// app/auth.tsx - Complete Auth Flow with All Screens
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
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
import { useAuth } from "./_layout";
import { useTheme } from "@/contexts/ThemeContext";
import { defaultFontFamily, headingFontFamily } from "@/constants/Fonts";

const { width: screenWidth } = Dimensions.get("window");

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
  const { currentTheme, themeName } = useTheme();
  const { login } = useAuth();
  const isDark = themeName === "dark";

  const [currentScreen, setCurrentScreen] = useState<AuthScreen>(
    (params.mode as AuthScreen) || "login"
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Verification state
  const [verificationCode, setVerificationCode] = useState(["", "", "", ""]);
  const [userEmail, setUserEmail] = useState("");
  const [verificationFlow, setVerificationFlow] = useState<
    "registration" | "password-reset" | null
  >(null);

  // Reset password state
  const [resetPasswordData, setResetPasswordData] = useState({
    password: "",
    password_confirmation: "",
  });

  const styles = createStyles(currentTheme, isDark);
  const insets = useSafeAreaInsets();
  const [screenKey, setScreenKey] = useState(0);

  // Refs for OTP inputs
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  // Update screen key when screen changes for animation
  useEffect(() => {
    setScreenKey((prev) => prev + 1);
  }, [currentScreen]);

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
        "Please fill in all required fields"
      );
      return;
    }

    if (!privacyAccepted) {
      ToastService.showError(
        "Privacy Policy",
        "Please accept the privacy policy to continue"
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
        "Password must be at least 8 characters long"
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
        "Please enter date of birth in YYYY-MM-DD format"
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
        "Date of birth cannot be in the future"
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
      setVerificationCode(["", "", "", ""]);
      ToastService.showSuccess(
        "Registration Successful!",
        "Please check your email for the OTP verification code"
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
      setVerificationCode(["", "", "", ""]);
      setCurrentScreen("email-verification");
      ToastService.showSuccess(
        "Code Sent",
        "Please check your email for the OTP verification code"
      );
    } catch (error) {
      ToastService.showApiError(error, "Failed to send code");
    } finally {
      setLoading(false);
    }
  }, [forgotPasswordEmail]);

  // Handle verification code input
  const handleVerificationCodeChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) {
      // If pasted multiple digits, take only the first one
      value = value[0];
    }

    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace to go to previous input
  const handleVerificationCodeKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle verification submit
  const handleVerifyCode = useCallback(async () => {
    const code = verificationCode.join("");
    if (code.length !== 4) {
      ToastService.showError("Invalid Code", "Please enter the 4-digit code");
      return;
    }

    setLoading(true);
    try {
      const code = verificationCode.join("");
      const isRegistrationFlow = verificationFlow === "registration";

      if (isRegistrationFlow) {
        // Verify email code for registration
        await authApi.verifyEmailCode(userEmail, code);
        ToastService.showSuccess(
          "Email Verified!",
          "Your email has been verified successfully"
        );
        setCurrentScreen("account-created");
      } else {
        // Verify reset code for password reset
        await authApi.verifyResetCode(userEmail, code);
        ToastService.showSuccess(
          "Code Verified!",
          "Please set your new password"
        );
        setCurrentScreen("reset-password");
      }
    } catch (error) {
      ToastService.showApiError(error, "Verification Failed");
      // Clear code inputs on error
      setVerificationCode(["", "", "", ""]);
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
        "Password must be at least 8 characters"
      );
      return;
    }

    setLoading(true);
    try {
      const code = verificationCode.join("");
      await authApi.resetPassword(
        userEmail,
        code,
        resetPasswordData.password,
        resetPasswordData.password_confirmation
      );
      // Clear password fields
      setResetPasswordData({
        password: "",
        password_confirmation: "",
      });
      setCurrentScreen("password-changed");
      ToastService.showSuccess(
        "Password Reset",
        "Your password has been reset successfully"
      );
    } catch (error) {
      ToastService.showApiError(error, "Password Reset Failed");
    } finally {
      setLoading(false);
    }
  }, [resetPasswordData, verificationCode]);

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
        "Verification code resent to your email"
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
            key={screenKey}
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
              styles={styles}
            />
          </Animated.View>
        );
      case "login":
        return (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            key={screenKey}
          >
            <LoginScreen
              loginData={loginData}
              setLoginData={setLoginData}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              onLogin={handleLogin}
              onSwitchToRegister={() => setCurrentScreen("register")}
              onForgotPassword={() => setCurrentScreen("forgot-password")}
              styles={styles}
            />
          </Animated.View>
        );
      case "forgot-password":
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            key={screenKey}
          >
            <ForgotPasswordScreen
              email={forgotPasswordEmail}
              setEmail={setForgotPasswordEmail}
              loading={loading}
              onSendCode={handleForgotPassword}
              onBack={() => setCurrentScreen("login")}
              styles={styles}
            />
          </Animated.View>
        );
      case "email-verification":
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            key={screenKey}
          >
            <EmailVerificationScreen
              email={userEmail}
              code={verificationCode}
              onCodeChange={handleVerificationCodeChange}
              loading={loading}
              onVerify={handleVerifyCode}
              onResend={handleResendCode}
              onBack={() => {
                setVerificationFlow(null);
                setCurrentScreen("login");
              }}
              styles={styles}
              codeInputRefs={codeInputRefs}
              onKeyPress={handleVerificationCodeKeyPress}
            />
          </Animated.View>
        );
      case "reset-password":
        return (
          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            key={screenKey}
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
              styles={styles}
            />
          </Animated.View>
        );
      case "account-created":
        return (
          <Animated.View
            entering={FadeIn.duration(400).springify()}
            exiting={FadeOut.duration(200)}
            key={screenKey}
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
                setVerificationCode(["", "", "", ""]);
                setCurrentScreen("login");
              }}
              styles={styles}
            />
          </Animated.View>
        );
      case "password-changed":
        return (
          <Animated.View
            entering={FadeIn.duration(400).springify()}
            exiting={FadeOut.duration(200)}
            key={screenKey}
          >
            <PasswordChangedScreen
              onContinue={() => setCurrentScreen("login")}
              styles={styles}
            />
          </Animated.View>
        );
      default:
        setCurrentScreen("login");
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 20), // Reduce top margin by 10px
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderScreen()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  styles,
}: any) => (
  <View style={styles.formContainer}>
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to continue</Text>
    </View>

    <View style={styles.inputWithIcon}>
      <User size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={styles.placeholderColor}
        value={registerData.username}
        onChangeText={(text) =>
          setRegisterData({ ...registerData, username: text })
        }
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>

    <View style={styles.inputWithIcon}>
      <User size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="First Name"
        placeholderTextColor={styles.placeholderColor}
        value={registerData.first_name}
        onChangeText={(text) =>
          setRegisterData({ ...registerData, first_name: text })
        }
        autoCapitalize="words"
      />
    </View>

    <View style={styles.inputWithIcon}>
      <User size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        placeholderTextColor={styles.placeholderColor}
        value={registerData.last_name}
        onChangeText={(text) =>
          setRegisterData({ ...registerData, last_name: text })
        }
        autoCapitalize="words"
      />
    </View>

    <View style={styles.inputWithIcon}>
      <Mail size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor={styles.placeholderColor}
        value={registerData.email}
        onChangeText={(text) =>
          setRegisterData({ ...registerData, email: text })
        }
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
    </View>

    <View style={styles.inputWithIcon}>
      <Phone size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Phone Number (Optional)"
        placeholderTextColor={styles.placeholderColor}
        value={registerData.phone_number}
        onChangeText={(text) =>
          setRegisterData({ ...registerData, phone_number: text })
        }
        keyboardType="phone-pad"
      />
    </View>

    <View style={styles.inputWithIcon}>
      <User size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        placeholderTextColor={styles.placeholderColor}
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
      />
    </View>

    <View style={styles.inputWithIcon}>
      <Lock size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Password (min 8 characters)"
        placeholderTextColor={styles.placeholderColor}
        value={registerData.password}
        onChangeText={(text) =>
          setRegisterData({ ...registerData, password: text })
        }
        secureTextEntry={!showPassword}
        autoCapitalize="none"
      />
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={styles.eyeIcon}
      >
        {showPassword ? (
          <EyeOff size={20} color={styles.inputIcon.color} />
        ) : (
          <Eye size={20} color={styles.inputIcon.color} />
        )}
      </TouchableOpacity>
    </View>

    <View style={styles.inputWithIcon}>
      <Lock size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor={styles.placeholderColor}
        value={registerData.password_confirmation}
        onChangeText={(text) =>
          setRegisterData({ ...registerData, password_confirmation: text })
        }
        secureTextEntry={!showConfirmPassword}
        autoCapitalize="none"
      />
      <TouchableOpacity
        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        style={styles.eyeIcon}
      >
        {showConfirmPassword ? (
          <EyeOff size={20} color={styles.inputIcon.color} />
        ) : (
          <Eye size={20} color={styles.inputIcon.color} />
        )}
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={[styles.checkboxContainer, { marginBottom: 24 }]}
      onPress={() => setPrivacyAccepted(!privacyAccepted)}
      activeOpacity={0.7}
    >
      <View
        style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}
      >
        {privacyAccepted && (
          <CheckCircle size={16} color={styles.checkboxIconColor} />
        )}
      </View>
      <Text style={styles.checkboxText}>I agree with privacy policy</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.primaryButton, loading && styles.buttonDisabled]}
      onPress={onRegister}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={styles.primaryButtonText.color} />
      ) : (
        <Text style={styles.primaryButtonText}>Sign Up</Text>
      )}
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.linkContainer}
      onPress={onSwitchToLogin}
      activeOpacity={0.7}
    >
      <Text style={styles.linkText}>
        Already have an account? <Text style={styles.linkTextBold}>Login</Text>
      </Text>
    </TouchableOpacity>
  </View>
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
  onLogin,
  onSwitchToRegister,
  onForgotPassword,
  styles,
}: any) => (
  <View style={styles.formContainer}>
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Login Account</Text>
      <Text style={styles.subtitle}>Welcome Back!</Text>
    </View>

    <View style={styles.inputWithIcon}>
      <User size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Username or Email"
        placeholderTextColor={styles.placeholderColor}
        value={loginData.username}
        onChangeText={(text) => setLoginData({ ...loginData, username: text })}
        autoCapitalize="none"
        autoComplete="username"
      />
    </View>

    <View style={styles.inputWithIcon}>
      <Lock size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={styles.placeholderColor}
        value={loginData.password}
        onChangeText={(text) => setLoginData({ ...loginData, password: text })}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="password"
      />
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={styles.eyeIcon}
      >
        {showPassword ? (
          <EyeOff size={20} color={styles.inputIcon.color} />
        ) : (
          <Eye size={20} color={styles.inputIcon.color} />
        )}
      </TouchableOpacity>
    </View>

    <View style={styles.rememberForgotContainer}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setRememberMe(!rememberMe)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && (
            <CheckCircle size={16} color={styles.checkboxIconColor} />
          )}
        </View>
        <Text style={styles.checkboxText}>Keep me logged in</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onForgotPassword}
        activeOpacity={0.7}
        style={{ marginLeft: "auto", marginRight: - 14, alignItems: "center" }}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={[styles.primaryButton, loading && styles.buttonDisabled]}
      onPress={onLogin}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={styles.primaryButtonText.color} />
      ) : (
        <Text style={styles.primaryButtonText}>Login</Text>
      )}
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.linkContainer}
      onPress={onSwitchToRegister}
      activeOpacity={0.7}
    >
      <Text style={styles.linkText}>
        Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
      </Text>
    </TouchableOpacity>
  </View>
);

// Forgot Password Screen Component
const ForgotPasswordScreen = ({
  email,
  setEmail,
  loading,
  onSendCode,
  onBack,
  styles,
}: any) => (
  <View style={styles.formContainer}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={onBack}
      activeOpacity={0.7}
    >
      <ArrowLeft size={24} color={styles.backButtonIcon.color} />
    </TouchableOpacity>

    <View style={styles.iconContainer}>
      <View style={styles.iconWrapper}>
        <Shield size={80} color={styles.iconColor} strokeWidth={1.5} />
      </View>
    </View>

    <View style={styles.headerContainer}>
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>No worries, We got you.</Text>
    </View>

    <Text style={styles.infoText}>We'll send you code to reset it.</Text>

    <View style={styles.inputWithIcon}>
      <Mail size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor={styles.placeholderColor}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
    </View>

    <TouchableOpacity
      style={[styles.primaryButton, loading && styles.buttonDisabled]}
      onPress={onSendCode}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={styles.primaryButtonText.color} />
      ) : (
        <Text style={styles.primaryButtonText}>Send Code</Text>
      )}
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.linkContainer}
      onPress={onBack}
      activeOpacity={0.7}
    >
      <Text style={styles.linkText}>
        <ArrowLeft size={14} color={styles.linkText.color} /> Back to log in?
      </Text>
    </TouchableOpacity>
  </View>
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
  styles,
  codeInputRefs,
  onKeyPress,
}: any) => (
  <View style={styles.formContainer}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={onBack}
      activeOpacity={0.7}
    >
      <ArrowLeft size={24} color={styles.backButtonIcon.color} />
    </TouchableOpacity>

    <View style={styles.iconContainer}>
      <View style={styles.iconWrapper}>
        <LottieAnimation
          source={require("@/assets/lottie/email-verification.json")}
          size={300}
          autoPlay={true}
          loop={true}
          fallbackIcon={Mail}
          fallbackColor={styles.iconColor}
          
        />
      </View>
    </View>

    <View style={styles.headerContainer}>
      <Text style={styles.title}>Verification</Text>
      <Text style={styles.subtitle}>Enter the code to continue.</Text>
    </View>

    <Text style={styles.emailText}>
      We sent a code to <Text style={styles.emailHighlight}>{email}</Text>
    </Text>

    <View style={styles.codeContainer}>
      {code.map((digit: string, index: number) => (
        <TextInput
          key={`code-input-${index}`}
          ref={(ref) => {
            if (codeInputRefs?.current) {
              codeInputRefs.current[index] = ref;
            }
          }}
          style={styles.codeInput}
          value={digit}
          onChangeText={(value) => onCodeChange(index, value)}
          onKeyPress={({ nativeEvent }) => {
            if (onKeyPress) {
              onKeyPress(index, nativeEvent.key);
            }
          }}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          autoFocus={index === 0}
        />
      ))}
    </View>

    <TouchableOpacity
      style={[styles.primaryButton, loading && styles.buttonDisabled]}
      onPress={onVerify}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={styles.primaryButtonText.color} />
      ) : (
        <Text style={styles.primaryButtonText}>Continue</Text>
      )}
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.linkContainer}
      onPress={onResend}
      activeOpacity={0.7}
    >
      <Text style={styles.linkText}>
        Didn't receive the code?{" "}
        <Text style={styles.linkTextBold}>Send Again</Text>
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.linkContainer}
      onPress={onBack}
      activeOpacity={0.7}
    >
      <Text style={styles.linkText}>
        <ArrowLeft size={14} color={styles.linkText.color} /> Back to log in?
      </Text>
    </TouchableOpacity>
  </View>
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
  styles,
}: any) => (
  <View style={styles.formContainer}>
    <View style={styles.iconContainer}>
      <View style={styles.iconWrapper}>
        <LottieAnimation
          source={require("@/assets/lottie/set-password.json")}
          size={160}
          autoPlay={true}
          loop={true}
          fallbackIcon={Lock}
          fallbackColor={styles.iconColor}
        />
      </View>
    </View>

    <View style={styles.headerContainer}>
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>Create a unique password.</Text>
    </View>

    <View style={styles.inputWithIcon}>
      <Lock size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor={styles.placeholderColor}
        value={passwordData.password}
        onChangeText={(text) =>
          setPasswordData({ ...passwordData, password: text })
        }
        secureTextEntry={!showPassword}
        autoCapitalize="none"
      />
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={styles.eyeIcon}
      >
        {showPassword ? (
          <EyeOff size={20} color={styles.inputIcon.color} />
        ) : (
          <Eye size={20} color={styles.inputIcon.color} />
        )}
      </TouchableOpacity>
    </View>

    <View style={styles.inputWithIcon}>
      <Lock size={20} color={styles.inputIcon.color} />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor={styles.placeholderColor}
        value={passwordData.password_confirmation}
        onChangeText={(text) =>
          setPasswordData({ ...passwordData, password_confirmation: text })
        }
        secureTextEntry={!showConfirmPassword}
        autoCapitalize="none"
      />
      <TouchableOpacity
        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        style={styles.eyeIcon}
      >
        {showConfirmPassword ? (
          <EyeOff size={20} color={styles.inputIcon.color} />
        ) : (
          <Eye size={20} color={styles.inputIcon.color} />
        )}
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={[styles.primaryButton, loading && styles.buttonDisabled]}
      onPress={onReset}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={styles.primaryButtonText.color} />
      ) : (
        <Text style={styles.primaryButtonText}>Reset Password</Text>
      )}
    </TouchableOpacity>
  </View>
);

// Account Created Success Screen
const AccountCreatedScreen = ({ onContinue, styles }: any) => (
  <View style={styles.successContainer}>
    <View style={styles.iconContainer}>
      <View style={styles.successIconWrapper}>
        <CheckCircle
          size={120}
          color={styles.successIcon.color}
          strokeWidth={2}
        />
      </View>
    </View>

    <View style={styles.headerContainer}>
      <Text style={styles.title}>Account Created!</Text>
      <Text style={styles.subtitle}>Welcome to EasyBuy.</Text>
    </View>

    <Text style={styles.successMessage}>Your account has been created</Text>
    <Text style={styles.successTitle}>Successfully!</Text>

    <TouchableOpacity
      style={styles.primaryButton}
      onPress={onContinue}
      activeOpacity={0.8}
    >
      <Text style={styles.primaryButtonText}>Continue</Text>
      <ArrowRight size={20} color={styles.primaryButtonText.color} />
    </TouchableOpacity>
  </View>
);

// Password Changed Success Screen
const PasswordChangedScreen = ({ onContinue, styles }: any) => (
  <View style={styles.successContainer}>
    <View style={styles.iconContainer}>
      <View style={styles.successIconWrapper}>
        <LottieAnimation
          source={require("@/assets/lottie/success.json")}
          size={160}
          autoPlay={true}
          loop={false}
          fallbackIcon={CheckCircle}
          fallbackColor={styles.successIcon.color}
        />
      </View>
    </View>

    <View style={styles.headerContainer}>
      <Text style={styles.title}>Password Changed!</Text>
      <Text style={styles.subtitle}>No hassle anymore.</Text>
    </View>

    <Text style={styles.successMessage}>Your password has been reset</Text>
    <Text style={styles.successTitle}>Successfully!</Text>

    <TouchableOpacity
      style={styles.primaryButton}
      onPress={onContinue}
      activeOpacity={0.8}
    >
      <Text style={styles.primaryButtonText}>Continue</Text>
      <ArrowRight size={20} color={styles.primaryButtonText.color} />
    </TouchableOpacity>
  </View>
);

// Styles
const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      marginTop: -24,
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      marginTop: -15,
    },
    formContainer: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 32,
      minHeight: 400,
    },
    headerContainer: {
      alignItems: "center",
      marginBottom: 28,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: theme.primary,
      marginBottom: 8,
      letterSpacing: -0.5,
      fontFamily: headingFontFamily,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      fontFamily: defaultFontFamily,
    },
    inputWithIcon: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.primary,
      borderRadius: 12,
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      marginBottom: 20,
      minHeight: 56,
    },
    input: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16,
      color: theme.text,
      fontFamily: defaultFontFamily,
    },
    inputIcon: {
      marginRight: 12,
      color: theme.textSecondary,
    },
    placeholderColor: theme.textSecondary,
    eyeIcon: {
      padding: 4,
    },
    primaryButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      minHeight: 56,
      flexDirection: "row",
      gap: 8,
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
      fontFamily: defaultFontFamily,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    linkContainer: {
      alignItems: "center",
      paddingVertical: 8,
    },
    linkText: {
      fontSize: 16,
      color: theme.textSecondary,
      fontFamily: defaultFontFamily,
    },
    linkTextBold: {
      fontSize: 16,
      color: theme.primary,
      fontWeight: "600",
      fontFamily: defaultFontFamily,
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: theme.primary,
      borderRadius: 6,
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      backgroundColor: theme.primary,
    },
    checkboxIconColor: theme.surface,
    checkboxText: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    rememberForgotContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      marginBottom: 24,
      paddingHorizontal: 8,
      paddingVertical: 12,
      overflow: "hidden",
    },
    forgotPasswordText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "600",
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    iconWrapper: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: isDark
        ? "rgba(91, 143, 199, 0.1)"
        : "rgba(30, 58, 95, 0.08)",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    iconColor: theme.primary,
    checkmarkOverlay: {
      position: "absolute",
      bottom: -10,
      right: -10,
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 4,
    },
    backButton: {
      alignSelf: "flex-start",
      marginBottom: 20,
      padding: 8,
    },
    backButtonIcon: {
      color: theme.text,
    },
    infoText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    emailText: {
      fontSize: 16,
      color: theme.text,
      textAlign: "center",
      marginBottom: 32,
    },
    emailHighlight: {
      color: theme.primary,
      fontWeight: "700",
    },
    codeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 32,
      gap: 12,
    },
    codeInput: {
      flex: 1,
      height: 64,
      borderWidth: 2,
      borderColor: theme.primary,
      borderRadius: 12,
      textAlign: "center",
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
      backgroundColor: theme.surface,
    },
    successContainer: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 32,
      alignItems: "center",
      minHeight: 500,
      justifyContent: "center",
    },
    successIconWrapper: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: isDark
        ? "rgba(91, 143, 199, 0.1)"
        : "rgba(30, 58, 95, 0.08)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
    },
    successIcon: {
      color: theme.primary,
    },
    successMessage: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 8,
    },
    successTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.primary,
      textAlign: "center",
      marginBottom: 40,
    },
  });
