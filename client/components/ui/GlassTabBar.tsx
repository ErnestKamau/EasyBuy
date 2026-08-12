import React from 'react';
import { View, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';
import { FloatingGlassBar } from './FloatingGlassBar';
import { Text } from './Text';
import { Badge } from './Badge';

/**
 * Floating glass bottom tab bar — homepage position + home-indicator clearance.
 */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useAppTheme();

  return (
    <FloatingGlassBar level={3}>
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
    </FloatingGlassBar>
  );
}
