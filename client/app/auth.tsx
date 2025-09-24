import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { authApi, RegisterData, LoginData } from "../services/api";
import { ToastService } from "@/utils/toastService";
import { useAuth } from "./_layout";

const LoginForm = React.memo(
  ({
    loginData,
    setLoginData,
    loading,
    handleLogin,
    onSwitchToRegister,
  }: {
    loginData: LoginData;
    setLoginData: (data: LoginData) => void;
    loading: boolean;
    handleLogin: () => void;
    onSwitchToRegister: () => void;
  }) => (
    <View style={styles.formContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.inputWithIcon}>
        <MaterialIcons
          name="person"
          size={20}
          color="#999"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={loginData.username}
          onChangeText={(text) =>
            setLoginData({ ...loginData, username: text })
          }
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
        />
      </View>

      <View style={styles.inputWithIcon}>
        <MaterialIcons
          name="password"
          size={20}
          color="#999"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={loginData.password}
          onChangeText={(text) =>
            setLoginData({ ...loginData, password: text })
          }
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkContainer}
        onPress={onSwitchToRegister}
        activeOpacity={0.7}
      >
        <Text style={styles.linkText}>
          Don't have an account?{" "}
          <Text style={styles.linkTextBold}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  )
);

const RegisterForm = React.memo(
  ({
    registerData,
    setRegisterData,
    loading,
    handleRegister,
    onSwitchToLogin,
  }: {
    registerData: RegisterData;
    setRegisterData: (data: RegisterData) => void;
    loading: boolean;
    handleRegister: () => void;
    onSwitchToLogin: () => void;
  }) => (
    <View style={styles.formContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us today</Text>
      </View>

      <View style={styles.inputWithIcon}>
        <MaterialIcons
          name="person"
          size={20}
          color="#999"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={registerData.username}
          onChangeText={(text) =>
            setRegisterData({ ...registerData, username: text })
          }
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
        />
      </View>

      <View style={styles.inputWithIcon}>
        <MaterialIcons
          name="mail"
          size={20}
          color="#999"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={registerData.email}
          onChangeText={(text) =>
            setRegisterData({ ...registerData, email: text })
          }
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
        />
      </View>

      <View style={styles.inputWithIcon}>
        <MaterialIcons
          name="call"
          size={20}
          color="#999"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone No. (+254700123456 )"
          placeholderTextColor="#999"
          value={registerData.phone_number}
          onChangeText={(text) =>
            setRegisterData({ ...registerData, phone_number: text })
          }
          keyboardType="phone-pad"
          autoComplete="tel"
        />
      </View>

      <View style={styles.genderContainer}>
        <Text style={styles.genderLabel}>Gender (Optional)</Text>
        <View style={styles.genderButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              registerData.gender === "Male" && styles.genderButtonActive,
            ]}
            onPress={() => setRegisterData({ ...registerData, gender: "Male" })}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.genderButtonText,
                registerData.gender === "Male" && styles.genderButtonTextActive,
              ]}
            >
              Male
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              registerData.gender === "Female" && styles.genderButtonActive,
            ]}
            onPress={() =>
              setRegisterData({ ...registerData, gender: "Female" })
            }
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.genderButtonText,
                registerData.gender === "Female" &&
                  styles.genderButtonTextActive,
              ]}
            >
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.genderContainer}>
        <Text style={styles.genderLabel}>Role (Optional)</Text>
        <View style={styles.genderButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              registerData.role === "admin" && styles.genderButtonActive,
            ]}
            onPress={() => setRegisterData({ ...registerData, role: "admin" })}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.genderButtonText,
                registerData.role === "admin" && styles.genderButtonTextActive,
              ]}
            >
              admin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              registerData.role === "customer" && styles.genderButtonActive,
            ]}
            onPress={() =>
              setRegisterData({ ...registerData, role: "customer" })
            }
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.genderButtonText,
                registerData.role === "customer" &&
                  styles.genderButtonTextActive,
              ]}
            >
              Customer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputWithIcon}>
        <MaterialIcons
          name="key"
          size={20}
          color="#999"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 characters)"
          placeholderTextColor="#999"
          value={registerData.password}
          onChangeText={(text) =>
            setRegisterData({ ...registerData, password: text })
          }
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
        />
      </View>

      <View style={styles.inputWithIcon}>
        <MaterialIcons
          name="key"
          size={20}
          color="#999"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          value={registerData.password_confirm}
          onChangeText={(text) => {
            setRegisterData({ ...registerData, password_confirm: text });
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkContainer}
        onPress={onSwitchToLogin}
        activeOpacity={0.7}
      >
        <Text style={styles.linkText}>
          Already have an account?{" "}
          <Text style={styles.linkTextBold}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  )
);

export default function AuthScreens() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const [loginData, setLoginData] = useState<LoginData>({
    username: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState<RegisterData>({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    password_confirm: "",
    gender: undefined,
  });

  const handleLogin = useCallback(async () => {
    if (!loginData.username || !loginData.password) {
      ToastService.showError("Validation Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(loginData);
    } catch (error) {
      console.log("Login error caught in component:", error);
    } finally {
      setLoading(false);
    }
  }, [loginData, login]);

  const handleRegister = useCallback(async () => {
    if (
      !registerData.username ||
      !registerData.email ||
      !registerData.phone_number ||
      !registerData.password
    ) {
      ToastService.showError(
        "Validation Error",
        "Please fill in all required fields"
      );
      return;
    }

    if (registerData.password !== registerData.password_confirm) {
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
      ToastService.showError(
        "Invalid Email",
        "Please enter a valid email address"
      );
      return;
    }

    if (registerData.phone_number.length < 10) {
      ToastService.showError(
        "Invalid Phone",
        "Please enter a valid phone number"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register(registerData);

      ToastService.showSuccess(
        "Registration Successful!",
        "Your account has been created. Please sign in with your new credentials."
      );

      setIsLogin(true);
      setRegisterData({
        username: "",
        email: "",
        phone_number: "",
        password: "",
        password_confirm: "",
        gender: undefined,
      });
      setLoginData({
        username: registerData.username,
        password: "",
      });
    } catch (error) {
      ToastService.showApiError(error, "Registration Failed");
    } finally {
      setLoading(false);
    }
  }, [registerData]);

  const switchToRegister = useCallback(() => setIsLogin(false), []);
  const switchToLogin = useCallback(() => setIsLogin(true), []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ display: isLogin ? "flex" : "none" }}>
            <LoginForm
              loginData={loginData}
              setLoginData={setLoginData}
              loading={loading}
              handleLogin={handleLogin}
              onSwitchToRegister={switchToRegister}
            />
          </View>

          <View style={{ display: isLogin ? "none" : "flex" }}>
            <RegisterForm
              registerData={registerData}
              setRegisterData={setRegisterData}
              loading={loading}
              handleRegister={handleRegister}
              onSwitchToLogin={switchToLogin}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginTop: 26,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  formContainer: {
    backgroundColor: "#fefefeff",
    borderRadius: 16,
    padding: 32,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
    borderColor: "#0f9e99",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
    width: 325,
  },
  input: {
    borderColor: "#0f9e99",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#1a1a1a",
    width: 250,
  },
  genderContainer: {
    marginBottom: 20,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  genderButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  genderButtonActive: {
    backgroundColor: "#171717",
    borderColor: "#171717",
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  genderButtonTextActive: {
    color: "#ffffff",
  },
  primaryButton: {
    backgroundColor: "#171717",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  linkContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 16,
    color: "#666666",
  },
  linkTextBold: {
    color: "#007AFF",
    fontWeight: "600",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0f9e99",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  inputIcon: {
    marginRight: 12,
    width: 20,
  },

  inputWithIconText: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1a1a1a",
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonIcon: {
    marginRight: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  rowIcon: {
    marginRight: 12,
    width: 24,
  },

  inputWithRowIcon: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
  },
});
