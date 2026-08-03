import React from 'react';
import { Pressable, View, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

type Option = { value: string; label: string };

type SegmentedControlProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  const theme = useAppTheme();
  const [width, setWidth] = React.useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const translate = useSharedValue(0);

  React.useEffect(() => {
    if (width > 0) {
      const seg = width / options.length;
      translate.value = withTiming(index * seg, { duration: theme.duration.normal });
    }
  }, [index, width, options.length]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translate.value }],
    width: width > 0 ? width / options.length : 0,
  }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.md,
        padding: 3,
        position: 'relative',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 3,
            bottom: 3,
            left: 3,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.primary,
          },
          indicatorStyle,
        ]}
      />
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(opt.value);
            }}
            style={{
              flex: 1,
              minHeight: 36,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text variant="label" color={selected ? 'onPrimary' : 'secondary'}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
