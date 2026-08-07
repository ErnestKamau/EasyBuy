import React, { useEffect } from 'react';
import { View, Pressable, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
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
  LucideIcon,
} from 'lucide-react-native';
import { useAppTheme, useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { Text, TextColor } from './Text';
import { Avatar } from './Avatar';
import { Divider } from './Divider';
import { Badge } from './Badge';
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

type Tone = 'brand' | 'info' | 'warning' | 'success' | 'muted';

type NavItem = {
  label: string;
  Icon: LucideIcon;
  tone: Tone;
  href: string;
  /** Pathname (no route-group segments) this item is considered active on. */
  match: string;
  badge?: number;
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
  const pathname = usePathname();
  const { state: cartState } = useCart();
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

  const toneStyles: Record<Tone, { fg: string; bg: string }> = {
    brand: { fg: theme.colors.primary, bg: theme.colors.primaryMuted },
    info: { fg: theme.colors.info, bg: theme.colors.infoMuted },
    warning: { fg: theme.colors.warning, bg: theme.colors.warningMuted },
    success: { fg: theme.colors.success, bg: theme.colors.successMuted },
    muted: { fg: theme.colors.textSecondary, bg: theme.colors.backgroundSecondary },
  };

  const items: NavItem[] = [
    { label: 'Home', Icon: Home, tone: 'brand', href: '/(tabs)/', match: '/' },
    {
      label: 'Cart',
      Icon: ShoppingBag,
      tone: 'info',
      href: '/(tabs)/cart',
      match: '/cart',
      badge: cartState.totalItems,
    },
    { label: 'Orders', Icon: Package, tone: 'warning', href: '/(tabs)/orders', match: '/orders' },
    { label: 'Wallet', Icon: Wallet, tone: 'success', href: '/wallet/history', match: '/wallet/history' },
    { label: 'Profile', Icon: User, tone: 'brand', href: '/(tabs)/profile', match: '/profile' },
    { label: 'Help', Icon: HelpCircle, tone: 'muted', href: '/help-support', match: '/help-support' },
  ];

  const isActive = (item: NavItem) =>
    item.match === '/' ? pathname === '/' : pathname === item.match || pathname.startsWith(`${item.match}/`);

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
            zIndex: theme.zIndex.drawer,
          },
          drawerStyle,
        ]}
      >
        {/*
          Solid panel, not GlassSurface: BlurView nested inside a Reanimated
          transform (the slide-in translateX above) corrupts/ghosts on Android,
          duplicating sibling content into the blurred layer. A drawer needs to
          stay legible while animating, so it skips the glass treatment.

          Safe-area insets are padding on the CONTENT below, not this box —
          padding here would leave a transparent gap at the top/bottom where
          the dimmed backdrop shows through instead of the panel itself.
        */}
        <View
          style={[
            {
              flex: 1,
              backgroundColor: theme.colors.surface,
              borderRightWidth: StyleSheet.hairlineWidth * 2,
              borderRightColor: theme.colors.border,
            },
            theme.getElevation('elv600'),
          ]}
        >
          <View
            style={{
              flex: 1,
              paddingTop: insets.top + theme.spacing[4],
              paddingBottom: insets.bottom + theme.spacing[4],
              paddingHorizontal: theme.spacing[5],
              gap: theme.spacing[5],
            }}
          >
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
              {items.map((item) => {
                const active = isActive(item);
                const { fg, bg } = toneStyles[item.tone];
                const { Icon } = item;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => navigate(item.href)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing[3],
                      paddingVertical: theme.spacing[2],
                      paddingHorizontal: theme.spacing[3],
                      borderRadius: theme.radius.md,
                      backgroundColor: pressed ? theme.colors.primaryMuted : 'transparent',
                      minHeight: theme.touchTarget,
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: theme.radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: active ? bg : 'transparent',
                      }}
                    >
                      <Icon size={20} color={active ? fg : theme.colors.textMuted} />
                    </View>
                    <Text
                      variant="body"
                      color={(active ? item.tone : 'primary') as TextColor}
                      style={{
                        flex: 1,
                        fontFamily: active ? theme.fontFamily.body.semiBold : theme.fontFamily.body.regular,
                      }}
                    >
                      {item.label}
                    </Text>
                    {!!item.badge && <Badge count={item.badge} color={fg} />}
                  </Pressable>
                );
              })}
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
        </View>
      </Animated.View>
    </View>
  );
}
