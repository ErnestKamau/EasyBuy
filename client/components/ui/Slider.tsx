import React from 'react';
import { View, PanResponder, LayoutChangeEvent } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

type SliderProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
};

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
}: SliderProps) {
  const theme = useAppTheme();
  const [width, setWidth] = React.useState(0);

  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

  const setFromX = (x: number) => {
    if (width <= 0) return;
    const r = Math.max(0, Math.min(1, x / width));
    const raw = min + r * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(Math.max(min, Math.min(max, stepped)));
  };

  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
    }),
  ).current;

  return (
    <View>
      {label && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing[2] }}>
          <Text variant="label" color="secondary">
            {label}
          </Text>
          <Text variant="label" color="brand">
            {value}
          </Text>
        </View>
      )}
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: theme.touchTarget, justifyContent: 'center' }}
        {...pan.panHandlers}
      >
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.colors.border,
          }}
        >
          <View
            style={{
              width: `${ratio * 100}%`,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.primary,
            }}
          />
        </View>
        <View
          style={{
            position: 'absolute',
            left: `${ratio * 100}%`,
            marginLeft: -12,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.surface,
            borderWidth: 2,
            borderColor: theme.colors.primary,
            ...theme.getElevation('elv200'),
          }}
        />
      </View>
    </View>
  );
}

type RangeSliderProps = {
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
};

export function RangeSlider({
  minValue,
  maxValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
}: RangeSliderProps) {
  const theme = useAppTheme();
  // Simplified: two independent sliders stacked for clarity
  return (
    <View style={{ gap: theme.spacing[4] }}>
      {label && (
        <Text variant="label" color="secondary">
          {label}: {minValue} – {maxValue}
        </Text>
      )}
      <Slider value={minValue} onChange={(v) => onChange(Math.min(v, maxValue), maxValue)} min={min} max={max} step={step} label="Min" />
      <Slider value={maxValue} onChange={(v) => onChange(minValue, Math.max(v, minValue))} min={min} max={max} step={step} label="Max" />
    </View>
  );
}
