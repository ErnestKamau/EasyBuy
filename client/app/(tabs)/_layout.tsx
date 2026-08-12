// app/(tabs)/_layout.tsx — Jade Horizon GlassTabBar
import React, { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, useAppTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { GlassTabBar, Badge, DrawerMenu, HamburgerButton } from '@/components/ui';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size ?? 22} {...props} />;
}

export default function TabLayout() {
  const { state } = useCart();
  const { currentTheme } = useTheme();
  const theme = useAppTheme();
  const { unreadCount } = useNotifications();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: currentTheme.tabIconSelected,
          tabBarInactiveTintColor: currentTheme.tabIconDefault,
          headerShown: true,
          headerStyle: {
            backgroundColor: currentTheme.surface,
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            ...theme.typography.title,
            color: currentTheme.text,
          },
          headerShadowVisible: false,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerLeft: () => (
            <View style={{ marginLeft: 4 }}>
              <HamburgerButton
                open={drawerOpen}
                onPress={() => setDrawerOpen((o) => !o)}
              />
            </View>
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={{ marginRight: 16, position: 'relative' }}>
                {({ pressed }) => (
                  <>
                    <FontAwesome
                      name="bell"
                      size={22}
                      color={currentTheme.text}
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                    {unreadCount > 0 && (
                      <View style={{ position: 'absolute', top: -4, right: -6 }}>
                        <Badge count={unreadCount} />
                      </View>
                    )}
                  </>
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
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <TabBarIcon name="list-alt" color={color} />,
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

      <DrawerMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userName={user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : undefined}
        userEmail={user?.email}
        onLogout={logout}
      />
    </View>
  );
}
