import React, { useEffect } from 'react';
import { View, Pressable, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Home,
  ShoppingBag,
  Package,
  User,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Wallet,
} from 'lucide-react-native';
import { useAppTheme, useTheme } from '@/contexts/ThemeContext';
import { GlassSurface } from './GlassSurface';
import { Text } from './Text';
import { Avatar } from './Avatar';
import { Divider } from './Divider';
import { BackdropPressable } from './BackdropPressable';

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.82);

type DrawerMenuProps = {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  avatarUri?: string;
  onLogout?: () => void;
};

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onPress?: () => void;
};

export function DrawerMenu({
  open,
  onClose,
  userName,
  userEmail,
  avatarUri,
  onLogout,
}: DrawerMenuProps) {
  const theme = useAppTheme();
  const { themeName, changeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = React.useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      progress.value = withTiming(1, { duration: theme.duration.glass });
    } else {
      progress.value = withTiming(0, { duration: theme.duration.normal }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [open]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * -DRAWER_WIDTH }],
  }));

  if (!mounted) return null;

  const navigate = (href: string) => {
    onClose();
    router.push(href as any);
  };

  const items: NavItem[] = [
    { label: 'Home', icon: <Home size={20} color={theme.colors.text} />, href: '/(tabs)/' },
    { label: 'Cart', icon: <ShoppingBag size={20} color={theme.colors.text} />, href: '/(tabs)/cart' },
    { label: 'Orders', icon: <Package size={20} color={theme.colors.text} />, href: '/(tabs)/orders' },
    { label: 'Wallet', icon: <Wallet size={20} color={theme.colors.text} />, href: '/wallet/history' },
    { label: 'Profile', icon: <User size={20} color={theme.colors.text} />, href: '/(tabs)/profile' },
    { label: 'Help', icon: <HelpCircle size={20} color={theme.colors.text} />, href: '/help-support' },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <BackdropPressable visible={open} onPress={onClose} progress={progress} />
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: DRAWER_WIDTH,
            paddingTop: insets.top + theme.spacing[4],
            paddingBottom: insets.bottom + theme.spacing[4],
            zIndex: theme.zIndex.drawer,
          },
          drawerStyle,
        ]}
      >
        <GlassSurface
          level={3}
          borderRadius={0}
          style={{ flex: 1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomWidth: 0 }}
        >
          <View style={{ flex: 1, padding: theme.spacing[5], gap: theme.spacing[5] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4] }}>
              <Avatar uri={avatarUri} name={userName} size="lg" />
              <View style={{ flex: 1 }}>
                <Text variant="title" numberOfLines={1}>
                  {userName || 'Guest'}
                </Text>
                {userEmail && (
                  <Text variant="caption" color="muted" numberOfLines={1}>
                    {userEmail}
                  </Text>
                )}
              </View>
            </View>

            <Divider />

            <View style={{ gap: theme.spacing[1] }}>
              {items.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => (item.href ? navigate(item.href) : item.onPress?.())}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[4],
                    paddingVertical: theme.spacing[3],
                    paddingHorizontal: theme.spacing[3],
                    borderRadius: theme.radius.md,
                    backgroundColor: pressed ? theme.colors.primaryMuted : 'transparent',
                    minHeight: theme.touchTarget,
                  })}
                >
                  {item.icon}
                  <Text variant="body">{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={() => changeTheme(themeName === 'dark' ? 'light' : 'dark')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[4],
                paddingVertical: theme.spacing[3],
                minHeight: theme.touchTarget,
              }}
            >
              {themeName === 'dark' ? (
                <Sun size={20} color={theme.colors.text} />
              ) : (
                <Moon size={20} color={theme.colors.text} />
              )}
              <Text variant="body">
                {themeName === 'dark' ? 'Light mode' : 'Dark mode'}
              </Text>
            </Pressable>

            {onLogout && (
              <Pressable
                onPress={() => {
                  onClose();
                  onLogout();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[4],
                  paddingVertical: theme.spacing[3],
                  minHeight: theme.touchTarget,
                }}
              >
                <LogOut size={20} color={theme.colors.error} />
                <Text variant="body" color="error">
                  Log out
                </Text>
              </Pressable>
            )}
          </View>
        </GlassSurface>
      </Animated.View>
    </View>
  );
}
