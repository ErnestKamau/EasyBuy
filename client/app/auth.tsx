import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { authApi, handleApiError, RegisterData, LoginData, User } from '../services/api';




const LoginForm = React.memo(({
  loginData,
  setLoginData,
  loading,
  handleLogin,
  onSwitchToRegister
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

    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#999"
        value={loginData.username}
        onChangeText={(text) => setLoginData({ ...loginData, username: text })}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
      />
    </View>

    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={loginData.password}
        onChangeText={(text) => setLoginData({ ...loginData, password: text })}
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
        Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
      </Text>
    </TouchableOpacity>
  </View>
));


const RegisterForm = React.memo(({
  registerData,
  setRegisterData,
  loading,
  handleRegister,
  onSwitchToLogin
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

    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#999"
        value={registerData.username}
        onChangeText={(text) => setRegisterData({ ...registerData, username: text })}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
      />
    </View>

    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={registerData.email}
        onChangeText={(text) => setRegisterData({ ...registerData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
      />
    </View>

    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Phone Number (e.g., +254700123456)"
        placeholderTextColor="#999"
        value={registerData.phone_number}
        onChangeText={(text) => setRegisterData({ ...registerData, phone_number: text })}
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
            registerData.gender === 'Male' && styles.genderButtonActive
          ]}
          onPress={() => setRegisterData({ ...registerData, gender: 'Male' })}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.genderButtonText,
            registerData.gender === 'Male' && styles.genderButtonTextActive
          ]}>
            Male
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderButton,
            registerData.gender === 'Female' && styles.genderButtonActive
          ]}
          onPress={() => setRegisterData({ ...registerData, gender: 'Female' })}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.genderButtonText,
            registerData.gender === 'Female' && styles.genderButtonTextActive
          ]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Password (min 8 characters)"
        placeholderTextColor="#999"
        value={registerData.password}
        onChangeText={(text) => setRegisterData({ ...registerData, password: text })}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password-new"
      />
    </View>

    <View style={styles.inputContainer}>
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
        Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
      </Text>
    </TouchableOpacity>
  </View>
));

export default function AuthScreens() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);


  const [loginData, setLoginData] = useState<LoginData>({
    username: '',
    password: '',
  });


  const [registerData, setRegisterData] = useState<RegisterData>({
    username: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirm: '',
    gender: undefined,
  });



  const handleLogin = useCallback(async () => {
    if (!loginData.username || !loginData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login(loginData);
      Alert.alert('Success', 'Login successful!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      Alert.alert('Login Failed', handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [loginData]);

  const handleRegister = useCallback(async () => {
    if (!registerData.username || !registerData.email || !registerData.phone_number || !registerData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (registerData.password !== registerData.password_confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (registerData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register(registerData);
      Alert.alert('Success', 'Registration successful! Please sign in with your new account.', [
        {
            text: 'OK',
            onPress: () =>{
                setIsLogin(true);
                setRegisterData({
                    username: '',
                    email: '',
                    phone_number: '',
                    password: '',
                    password_confirm: '',
                    gender: undefined,
                });
                setLoginData({
                    username: registerData.username,
                    password: '',
                });
            }
        }
      ]);
    } catch (error) {
      Alert.alert('Registration Failed', handleApiError(error));
    } finally {
      setLoading(false);
      setIsLogin(false)
    }
  }, [registerData]);

  const switchToRegister = useCallback(() => setIsLogin(false), []);
  const switchToLogin = useCallback(() => setIsLogin(true), []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={{ display: isLogin ? 'flex' : 'none' }}>
            <LoginForm
              loginData={loginData}
              setLoginData={setLoginData}
              loading={loading}
              handleLogin={handleLogin}
              onSwitchToRegister={switchToRegister}
            />
          </View>

          <View style={{ display: isLogin ? 'none' : 'flex' }}>
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
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  genderContainer: {
    marginBottom: 20,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  genderButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  genderButtonTextActive: {
    color: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#666666',
  },
  linkTextBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
});