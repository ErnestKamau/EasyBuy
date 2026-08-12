import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, LayoutChangeEvent, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { Badge } from './Badge';
import { spring } from '@/design/tokens/motion';
import { TAB_BAR } from './tabBarTokens';
import { buildBubbleTabBarPath } from './tabBarShape';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Style 6 floating pill — top edge curves up at the active tab (SVG silhouette).
 */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useAppTheme();
  const glass = theme.glass[3];
  const insets = useSafeAreaInsets();
  const floatBottom = Math.max(insets.bottom, theme.spacing[3]);

  const [barWidth, setBarWidth] = useState(0);
  const barW = useSharedValue(0);
  const bumpCx = useSharedValue(0);
  const dotX = useSharedValue(0);
  const tabCenters = useRef<Record<number, number>>({});

  const totalH = TAB_BAR.BUMP_RISE + TAB_BAR.BAR_H;

  const moveToTab = useCallback(
    (index: number) => {
      const cx = tabCenters.current[index];
      if (cx == null) return;
      bumpCx.value = withSpring(cx, spring.snappy);
      dotX.value = withSpring(cx - TAB_BAR.DOT / 2, spring.snappy);
    },
    [bumpCx, dotX],
  );

  useEffect(() => {
    moveToTab(state.index);
  }, [state.index, moveToTab]);

  const onBarLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      setBarWidth(w);
      barW.value = w;
      moveToTab(state.index);
    },
    [barW, moveToTab, state.index],
  );

  const onTabLayout = useCallback(
    (index: number, e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      tabCenters.current[index] = x + width / 2;
      if (index === state.index) {
        bumpCx.value = x + width / 2;
        dotX.value = x + width / 2 - TAB_BAR.DOT / 2;
      }
    },
    [bumpCx, dotX, state.index],
  );

  const pathProps = useAnimatedProps(() => ({
    d: buildBubbleTabBarPath(
      barW.value,
      TAB_BAR.BAR_H,
      TAB_BAR.CORNER_R,
      bumpCx.value,
      TAB_BAR.BUMP_W,
      TAB_BAR.BUMP_RISE,
    ),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dotX.value }],
  }));

  const hairline = StyleSheet.hairlineWidth * 2;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: theme.spacing[4],
        right: theme.spacing[4],
        bottom: floatBottom,
        height: totalH,
        overflow: 'visible',
      }}
      onLayout={onBarLayout}
    >
      {barWidth > 0 && (
        <Svg
          width={barWidth}
          height={totalH}
          viewBox={`0 ${-TAB_BAR.BUMP_RISE} ${barWidth} ${TAB_BAR.BAR_H + TAB_BAR.BUMP_RISE}`}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <AnimatedPath
            animatedProps={pathProps}
            fill={glass.tint}
            stroke={glass.borderColor}
            strokeWidth={hairline}
          />
        </Svg>
      )}

      {/* Dot at the peak of the bump */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 2,
            left: 0,
            width: TAB_BAR.DOT,
            height: TAB_BAR.DOT,
            borderRadius: TAB_BAR.DOT / 2,
            backgroundColor: theme.colors.primary,
            zIndex: 2,
          },
          theme.getElevation('elv300'),
          dotStyle,
        ]}
      />

      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          paddingTop: TAB_BAR.BUMP_RISE + TAB_BAR.CONTENT_TOP,
          paddingBottom: TAB_BAR.PAD_BOTTOM,
          paddingHorizontal: theme.spacing[1],
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
              onLayout={(e) => onTabLayout(index, e)}
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
                justifyContent: 'flex-end',
                gap: TAB_BAR.ICON_LABEL_GAP,
                paddingBottom: 2,
              }}
            >
              <View>
                {options.tabBarIcon?.({ focused, color, size: TAB_BAR.ICON_SIZE })}
                {badge != null && (
                  <View style={{ position: 'absolute', top: -3, right: -9 }}>
                    <Badge count={typeof badge === 'number' ? badge : 1} />
                  </View>
                )}
              </View>
              <Text
                variant="caption"
                style={{
                  color,
                  fontSize: TAB_BAR.LABEL_SIZE,
                  lineHeight: 13,
                  fontFamily: focused
                    ? theme.fontFamily.body.semiBold
                    : theme.fontFamily.body.medium,
                }}
              >
                {label}
              </Text>
              {focused ? (
                <View
                  style={{
                    width: 20,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: theme.colors.primary,
                  }}
                />
              ) : (
                <View style={{ height: 2 }} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
