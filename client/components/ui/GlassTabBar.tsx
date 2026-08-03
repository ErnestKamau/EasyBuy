import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';
import { GlassSurface } from './GlassSurface';
import { Text } from './Text';
import { Badge } from './Badge';

/**
 * Floating glass bottom tab bar — Glass 2, safe-area aware (home indicator clearance).
 */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: theme.spacing[4],
        right: theme.spacing[4],
        bottom: Math.max(insets.bottom, theme.spacing[3]),
      }}
    >
      <GlassSurface level={2} borderRadius={theme.radius.xl}>
        <View
          style={{
            flexDirection: 'row',
            paddingTop: theme.spacing[2],
            paddingBottom: theme.spacing[2],
            paddingHorizontal: theme.spacing[2],
          }}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : options.title ?? route.name;
            const color = focused ? theme.colors.tabIconSelected : theme.colors.tabIconDefault;
            const badge = options.tabBarBadge;

            const onPress = () => {
              Haptics.selectionAsync().catch(() => {});
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={() =>
                  navigation.emit({ type: 'tabLongPress', target: route.key })
                }
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: theme.touchTarget,
                  gap: 2,
                }}
              >
                <View>
                  {options.tabBarIcon?.({ focused, color, size: 22 })}
                  {badge != null && (
                    <View style={{ position: 'absolute', top: -4, right: -8 }}>
                      <Badge count={typeof badge === 'number' ? badge : 1} />
                    </View>
                  )}
                </View>
                <Text
                  variant="caption"
                  style={{
                    color,
                    fontFamily: focused
                      ? theme.fontFamily.body.semiBold
                      : theme.fontFamily.body.regular,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}
