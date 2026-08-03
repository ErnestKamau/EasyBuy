import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { GlassSurface } from './GlassSurface';

type Variant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const theme = useAppTheme();
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const heights: Record<Size, number> = {
    sm: 40,
    md: theme.touchTarget,
    lg: 52,
  };
  const paddings: Record<Size, number> = {
    sm: theme.spacing[4],
    md: theme.spacing[5],
    lg: theme.spacing[6],
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withTiming(theme.pressScale, { duration: theme.duration.fast });
  };
  const onPressOut = () => {
    scale.value = withTiming(1, { duration: theme.duration.fast });
  };

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  }, [isDisabled, onPress]);

  const bg =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.error
        : variant === 'secondary'
          ? theme.colors.primaryMuted
          : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? 'onPrimary'
      : variant === 'ghost'
        ? 'brand'
        : 'brand';

  const borderColor =
    variant === 'secondary' || variant === 'ghost'
      ? theme.colors.border
      : 'transparent';

  const content = (
    <View
      style={[
        styles.row,
        {
          height: heights[size],
          paddingHorizontal: paddings[size],
          borderRadius: theme.radius.md,
          backgroundColor: variant === 'glass' ? 'transparent' : bg,
          borderWidth: variant === 'secondary' || variant === 'ghost' ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor,
          opacity: isDisabled ? 0.5 : 1,
          minWidth: fullWidth ? undefined : 80,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger'
              ? theme.colors.textOnPrimary
              : theme.colors.primary
          }
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text
            variant="button"
            color={textColor as any}
            style={{ marginHorizontal: leftIcon || rightIcon ? theme.spacing[2] : 0 }}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[animStyle, fullWidth && { alignSelf: 'stretch' }, style]}
    >
      {variant === 'glass' ? (
        <GlassSurface level={3} borderRadius={theme.radius.md}>
          {content}
        </GlassSurface>
      ) : (
        content
      )}
    </AnimatedPressable>
  );
}

type IconButtonProps = {
  icon: React.ReactNode;
  onPress?: () => void;
  size?: number;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  onPress,
  size,
  disabled,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const theme = useAppTheme();
  const dim = size ?? theme.touchTarget;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? theme.pressScale : 1 }],
        },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

type FABProps = {
  icon: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

/** One FAB per screen max. Glass 3. */
export function FAB({ icon, onPress, accessibilityLabel, style }: FABProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress?.();
      }}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[
        {
          position: 'absolute',
          right: theme.spacing[5],
          bottom: theme.spacing[8],
          width: 56,
          height: 56,
          zIndex: theme.zIndex.raised,
        },
        style,
      ]}
    >
      <GlassSurface
        level={3}
        borderRadius={28}
        style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
