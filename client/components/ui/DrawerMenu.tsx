import React, { useEffect } from 'react';
import { View, Pressable, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
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
  Receipt,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LucideIcon,
} from 'lucide-react-native';
import { useAppTheme, useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { Text, TextColor } from './Text';
import { Avatar } from './Avatar';
import { Divider } from './Divider';
import { Badge } from './Badge';
import { BackdropPressable } from './BackdropPressable';

const DRAWER_EXPANDED = Math.min(300, Dimensions.get('window').width * 0.78);
const DRAWER_COLLAPSED = 76;

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
  match: string;
  badge?: number;
};

type NavSection = {
  title: string;
  items: NavItem[];
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
  const glass = theme.glass[3];
  const { themeName, changeTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { state: cartState } = useCart();
  const progress = useSharedValue(0);
  const collapsed = useSharedValue(0);
  const [mounted, setMounted] = React.useState(open);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      progress.value = withTiming(1, { duration: theme.duration.glass });
    } else {
      progress.value = withTiming(0, { duration: theme.duration.normal }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
      collapsed.value = withTiming(0, { duration: theme.duration.fast });
      setIsCollapsed(false);
    }
  }, [open]);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    if (!next) setIsCollapsed(false);
    collapsed.value = withTiming(next ? 1 : 0, { duration: theme.duration.glass }, (finished) => {
      if (finished && next) runOnJS(setIsCollapsed)(true);
    });
  };

  const drawerStyle = useAnimatedStyle(() => {
    const width = interpolate(
      collapsed.value,
      [0, 1],
      [DRAWER_EXPANDED, DRAWER_COLLAPSED],
      Extrapolation.CLAMP,
    );
    return {
      width,
      transform: [{ translateX: (1 - progress.value) * -DRAWER_EXPANDED }],
    };
  });

  const labelOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(collapsed.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
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

  const sections: NavSection[] = [
    {
      title: 'Menu',
      items: [
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
        { label: 'History', Icon: Receipt, tone: 'info', href: '/history', match: '/history' },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Wallet', Icon: Wallet, tone: 'success', href: '/wallet/history', match: '/wallet/history' },
        { label: 'Profile', Icon: User, tone: 'brand', href: '/(tabs)/profile', match: '/profile' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help', Icon: HelpCircle, tone: 'muted', href: '/help-support', match: '/help-support' },
      ],
    },
  ];

  const isActive = (item: NavItem) =>
    item.match === '/'
      ? pathname === '/'
      : pathname === item.match || pathname.startsWith(`${item.match}/`);

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item);
    const { fg, bg } = toneStyles[item.tone];
    const { Icon } = item;

    return (
      <Pressable
        key={item.label}
        onPress={() => navigate(item.href)}
        accessibilityLabel={item.label}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: isCollapsed ? 0 : theme.spacing[3],
          paddingVertical: theme.spacing[2],
          paddingHorizontal: isCollapsed ? theme.spacing[2] : theme.spacing[3],
          borderRadius: theme.radius.lg,
          backgroundColor: active ? bg : pressed ? theme.colors.primaryMuted : 'transparent',
          minHeight: theme.touchTarget,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: theme.radius.md,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={active ? fg : theme.colors.textMuted} />
          {isCollapsed && !!item.badge && (
            <View style={{ position: 'absolute', top: 2, right: 2 }}>
              <Badge dot color={fg} />
            </View>
          )}
        </View>

        {!isCollapsed && (
          <Animated.View
            style={[{ flex: 1, flexDirection: 'row', alignItems: 'center' }, labelOpacity]}
          >
            <Text
              variant="body"
              color={(active ? item.tone : 'primary') as TextColor}
              style={{
                flex: 1,
                fontFamily: active
                  ? theme.fontFamily.body.semiBold
                  : theme.fontFamily.body.regular,
              }}
            >
              {item.label}
            </Text>
            {!!item.badge && <Badge count={item.badge} color={fg} />}
            <ChevronRight
              size={16}
              color={theme.colors.textMuted}
              style={{ marginLeft: theme.spacing[1] }}
            />
          </Animated.View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <BackdropPressable visible={open} onPress={onClose} progress={progress} />
      <Animated.View
        style={[
          {
            // Full-height only change vs floating inset panel
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: theme.zIndex.drawer,
            overflow: 'hidden',
          },
          drawerStyle,
        ]}
      >
        {/*
          Glass tint without BlurView — blur nested inside a Reanimated
          transform corrupts on Android. Tint + border still reads as glass.
          Safe-area is padding on content so the panel fills the screen edge.
        */}
        <View
          style={[
            {
              flex: 1,
              backgroundColor: glass.tint,
              borderRightWidth: StyleSheet.hairlineWidth * 2,
              borderRightColor: glass.borderColor,
            },
            theme.getElevation('elv600'),
          ]}
        >
          <View
            style={{
              flex: 1,
              paddingTop: insets.top + theme.spacing[4],
              paddingBottom: insets.bottom + theme.spacing[4],
              paddingHorizontal: isCollapsed ? theme.spacing[2] : theme.spacing[4],
              gap: theme.spacing[4],
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[3],
                justifyContent: isCollapsed ? 'center' : 'flex-start',
              }}
            >
              <Avatar uri={avatarUri} name={userName} size={isCollapsed ? 'md' : 'lg'} />
              {!isCollapsed && (
                <Animated.View style={[{ flex: 1 }, labelOpacity]}>
                  <Text variant="title" numberOfLines={1}>
                    {userName || 'Guest'}
                  </Text>
                  {userEmail && (
                    <Text variant="caption" color="muted" numberOfLines={1}>
                      {userEmail}
                    </Text>
                  )}
                </Animated.View>
              )}
              {!isCollapsed && (
                <Pressable
                  onPress={toggleCollapsed}
                  accessibilityLabel="Collapse menu"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: theme.radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.backgroundSecondary,
                  }}
                >
                  <ChevronsLeft size={16} color={theme.colors.textMuted} />
                </Pressable>
              )}
            </View>

            {isCollapsed && (
              <Pressable
                onPress={toggleCollapsed}
                accessibilityLabel="Expand menu"
                style={{
                  alignSelf: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: theme.radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.backgroundSecondary,
                }}
              >
                <ChevronsRight size={16} color={theme.colors.textMuted} />
              </Pressable>
            )}

            <Divider />

            <View style={{ flex: 1, gap: theme.spacing[4] }}>
              {sections.map((section) => (
                <View key={section.title} style={{ gap: theme.spacing[1] }}>
                  {!isCollapsed ? (
                    <Animated.View style={labelOpacity}>
                      <Text
                        variant="caption"
                        color="muted"
                        style={{
                          paddingHorizontal: theme.spacing[3],
                          marginBottom: theme.spacing[1],
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                          fontFamily: theme.fontFamily.body.medium,
                          fontSize: 10,
                        }}
                      >
                        {section.title}
                      </Text>
                    </Animated.View>
                  ) : (
                    <View
                      style={{
                        height: StyleSheet.hairlineWidth,
                        backgroundColor: theme.colors.borderSubtle,
                        marginHorizontal: theme.spacing[2],
                        marginVertical: theme.spacing[1],
                      }}
                    />
                  )}
                  {section.items.map(renderNavItem)}
                </View>
              ))}
            </View>

            <Divider />
            <Pressable
              onPress={() => changeTheme(themeName === 'dark' ? 'light' : 'dark')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: isCollapsed ? 0 : theme.spacing[3],
                paddingVertical: theme.spacing[2],
                paddingHorizontal: isCollapsed ? theme.spacing[2] : theme.spacing[3],
                borderRadius: theme.radius.lg,
                minHeight: theme.touchTarget,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
              }}
            >
              {themeName === 'dark' ? (
                <Sun size={20} color={theme.colors.text} />
              ) : (
                <Moon size={20} color={theme.colors.text} />
              )}
              {!isCollapsed && (
                <Animated.View style={labelOpacity}>
                  <Text variant="body">
                    {themeName === 'dark' ? 'Light mode' : 'Dark mode'}
                  </Text>
                </Animated.View>
              )}
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
                  gap: isCollapsed ? 0 : theme.spacing[3],
                  paddingVertical: theme.spacing[2],
                  paddingHorizontal: isCollapsed ? theme.spacing[2] : theme.spacing[3],
                  borderRadius: theme.radius.lg,
                  minHeight: theme.touchTarget,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                }}
              >
                <LogOut size={20} color={theme.colors.error} />
                {!isCollapsed && (
                  <Animated.View style={labelOpacity}>
                    <Text variant="body" color="error">
                      Log out
                    </Text>
                  </Animated.View>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
