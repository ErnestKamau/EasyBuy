// app/(tabs)/_layout.tsx - Theme-integrated version
import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/contexts/ThemeContext';

// Extract TabBarIcon outside parent component to avoid recreation on each render
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { state } = useCart();
  const { currentTheme, themeName } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentTheme.tabIconSelected,
        tabBarInactiveTintColor: currentTheme.tabIconDefault,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: currentTheme.surface,
          borderTopWidth: 1,
          borderTopColor: currentTheme.border,
          elevation: themeName === 'dark' ? 12 : 8,
          shadowOpacity: themeName === 'dark' ? 0.3 : 0.1,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
          paddingBottom: 8,
          height: 88,
        },
        headerStyle: { 
          backgroundColor: currentTheme.surface,
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: themeName === 'dark' ? 0.2 : 0.05,
          shadowRadius: 4,
          elevation: themeName === 'dark' ? 6 : 2,
        },
        headerTitleStyle: {
          color: currentTheme.text,
          fontSize: 20,
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="bell"
                    size={25}
                    color={currentTheme.text}
                    style={{ 
                      marginRight: 15, 
                      opacity: pressed ? 0.5 : 1 
                    }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
          tabBarBadge: state.totalItems > 0 ? state.totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: currentTheme.error,
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: '600',
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            lineHeight: 20,
            textAlign: 'center',
          },
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
