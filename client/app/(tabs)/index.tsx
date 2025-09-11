// app/tabs/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AuthScreens from '../../components/AuthScreens';
import { User, authApi, isAuthenticated } from '../../services/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (await isAuthenticated()) {
        const currentUser = await authApi.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.log('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreens onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {user.username} to homepage !</Text>
      <Text style={styles.info}>Email: {user.email}</Text>
      <Text style={styles.info}>Phone: {user.phone_number}</Text>
      <Text style={styles.info}>Role: {user.role}</Text>
      {user.gender && <Text style={styles.info}>Gender: {user.gender}</Text>}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});