// app/about.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Package,
  Users,
  Shield,
  Award,
  Globe,
} from 'lucide-react-native';

export default function AboutScreen() {
  const { currentTheme, themeName } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Info Card */}
        <View style={[styles.infoCard, { backgroundColor: currentTheme.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: `${currentTheme.primary}15` }]}>
            <Package size={32} color={currentTheme.primary} />
          </View>
          <Text style={[styles.appName, { color: currentTheme.text }]}>EasyBuy</Text>
          <Text style={[styles.version, { color: currentTheme.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.description, { color: currentTheme.textSecondary }]}>
            Your trusted shopping companion for fresh groceries and everyday essentials.
            Shop with ease and convenience.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Features</Text>
          
          <View style={[styles.featureCard, { backgroundColor: currentTheme.surface }]}>
            <Users size={24} color={currentTheme.primary} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: currentTheme.text }]}>User-Friendly</Text>
              <Text style={[styles.featureDescription, { color: currentTheme.textSecondary }]}>
                Intuitive interface designed for easy navigation and shopping
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: currentTheme.surface }]}>
            <Shield size={24} color={currentTheme.primary} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: currentTheme.text }]}>Secure Payments</Text>
              <Text style={[styles.featureDescription, { color: currentTheme.textSecondary }]}>
                Safe and secure payment options including M-Pesa integration
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: currentTheme.surface }]}>
            <Award size={24} color={currentTheme.primary} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: currentTheme.text }]}>Quality Products</Text>
              <Text style={[styles.featureDescription, { color: currentTheme.textSecondary }]}>
                Fresh products sourced with care and delivered to your doorstep
              </Text>
            </View>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Company Information</Text>
          <View style={[styles.infoBox, { backgroundColor: currentTheme.surface }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>Company:</Text>
              <Text style={[styles.infoValue, { color: currentTheme.text }]}>EasyBuy Ltd.</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>Founded:</Text>
              <Text style={[styles.infoValue, { color: currentTheme.text }]}>2024</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>Location:</Text>
              <Text style={[styles.infoValue, { color: currentTheme.text }]}>Kenya</Text>
            </View>
          </View>
        </View>

        {/* Technology */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Built With</Text>
          <View style={[styles.techCard, { backgroundColor: currentTheme.surface }]}>
            <Globe size={24} color={currentTheme.primary} />
            <View style={styles.techContent}>
              <Text style={[styles.techText, { color: currentTheme.text }]}>
                React Native • Expo • Django • TypeScript
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: currentTheme.textSecondary }]}>
            © 2024 EasyBuy. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    alignItems: 'center',
    padding: 32,
    margin: 20,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoBox: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  techCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  techContent: {
    flex: 1,
    marginLeft: 16,
  },
  techText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});

