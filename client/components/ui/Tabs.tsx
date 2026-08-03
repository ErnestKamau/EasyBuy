import React, { useEffect } from 'react';
import { Pressable, View, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

type Tab = { key: string; label: string };

type TabsProps = {
  tabs: Tab[];
  value: string;
  onChange: (key: string) => void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  const theme = useAppTheme();
  const [layouts, setLayouts] = React.useState<Record<string, { x: number; width: number }>>({});
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);

  useEffect(() => {
    const layout = layouts[value];
    if (layout) {
      indicatorX.value = withTiming(layout.x, { duration: theme.duration.normal });
      indicatorW.value = withTiming(layout.width, { duration: theme.duration.normal });
    }
  }, [value, layouts]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: theme.spacing[5] }}>
        {tabs.map((tab) => {
          const selected = tab.key === value;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(tab.key);
              }}
              onLayout={(e: LayoutChangeEvent) => {
                const { x, width } = e.nativeEvent.layout;
                setLayouts((prev) => ({ ...prev, [tab.key]: { x, width } }));
              }}
              style={{ paddingVertical: theme.spacing[3], minHeight: theme.touchTarget }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text
                variant="label"
                color={selected ? 'brand' : 'muted'}
                style={{
                  fontFamily: selected
                    ? theme.fontFamily.body.semiBold
                    : theme.fontFamily.body.medium,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: 2, backgroundColor: theme.colors.borderSubtle }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              height: 2,
              backgroundColor: theme.colors.primary,
              borderRadius: 1,
            },
            indicatorStyle,
          ]}
        />
      </View>
    </View>
  );
}
