import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { isAuthenticated, loading, hasSeenOnboarding, user } = useAuth();
  const { currentTheme } = useTheme();
  
  if (loading || hasSeenOnboarding === null) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: currentTheme.background
      }}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }
  
  if (!isAuthenticated) {
    if (hasSeenOnboarding) {
      return <Redirect href="/auth" />;
    } else {
      return <Redirect href="/onboarding" />;
    }
  }
  
  const target = user?.role === 'rider' ? '/rider' : '/(tabs)';
  return <Redirect href={target as any} />;
}
