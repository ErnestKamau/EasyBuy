import React, { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, router } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { GlassTabBar } from '@/components/ui';
import { RiderProvider } from '@/contexts/RiderContext';
import { ToastService } from '@/utils/toastService';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

function RiderTabs() {
  const theme = useAppTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== 'rider') {
      ToastService.showError('Access Denied', 'Rider account required');
      router.replace('/(tabs)');
    }
  }, [user]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => {
          const current = props.state.routes[props.state.index];
          if (current.name.startsWith('job')) return null;
          return <GlassTabBar {...props} />;
        }}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            ...theme.typography.title,
            color: theme.colors.text,
          },
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Assigned',
            tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <TabBarIcon name="clock-o" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
        <Tabs.Screen
          name="job/[id]"
          options={{
            href: null,
            title: 'Delivery',
            headerShown: true,
          }}
        />
      </Tabs>
    </View>
  );
}

export default function RiderLayout() {
  return (
    <RiderProvider>
      <RiderTabs />
    </RiderProvider>
  );
}
