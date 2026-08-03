import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Search, X } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { GlassSurface } from './GlassSurface';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  glass?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({
  label,
  error,
  helper,
  glass = false,
  leftIcon,
  rightIcon,
  containerStyle,
  value,
  onFocus,
  onBlur,
  style,
  ...rest
}: InputProps) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);
  const hasValue = Boolean(value && String(value).length > 0);
  const floated = focused || hasValue;

  useEffect(() => {
    if (error) {
      shake.value = withSequence(
        withTiming(-6, { duration: 40 }),
        withTiming(6, { duration: 40 }),
        withTiming(-4, { duration: 40 }),
        withTiming(4, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
    }
  }, [error]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const borderColor = error
    ? theme.colors.error
    : focused
      ? theme.colors.borderFocus
      : theme.colors.border;

  const field = (
    <Animated.View
      style={[
        styles.field,
        {
          minHeight: theme.touchTarget + 8,
          borderRadius: theme.radius.md,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: glass ? 'transparent' : theme.colors.surface,
          paddingHorizontal: theme.spacing[4],
          paddingTop: label ? theme.spacing[4] : theme.spacing[3],
          paddingBottom: theme.spacing[3],
        },
        shakeStyle,
      ]}
    >
      {label && (
        <Text
          variant="caption"
          color={error ? 'error' : focused ? 'brand' : 'muted'}
          style={{
            position: 'absolute',
            left: theme.spacing[4] + (leftIcon ? 28 : 0),
            top: floated ? 6 : 16,
            fontSize: floated ? 11 : 15,
          }}
        >
          {label}
        </Text>
      )}
      <View style={styles.row}>
        {leftIcon && <View style={{ marginRight: theme.spacing[2] }}>{leftIcon}</View>}
        <TextInput
          value={value}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            theme.typography.body,
            {
              flex: 1,
              color: theme.colors.text,
              padding: 0,
              marginTop: label ? 8 : 0,
            },
            style,
          ]}
          {...rest}
        />
        {rightIcon && <View style={{ marginLeft: theme.spacing[2] }}>{rightIcon}</View>}
      </View>
    </Animated.View>
  );

  return (
    <View style={containerStyle}>
      {glass ? (
        <GlassSurface level={1} borderRadius={theme.radius.md}>
          {field}
        </GlassSurface>
      ) : (
        field
      )}
      {(error || helper) && (
        <Text
          variant="caption"
          color={error ? 'error' : 'muted'}
          style={{ marginTop: theme.spacing[2], marginLeft: theme.spacing[1] }}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
}

export function TextArea(props: InputProps) {
  return (
    <Input
      {...props}
      multiline
      style={[{ minHeight: 96, textAlignVertical: 'top' }, props.style]}
    />
  );
}

type SearchBarProps = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onCancel?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  onCancel,
  style,
}: SearchBarProps) {
  const theme = useAppTheme();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }, style]}>
      <GlassSurface level={1} borderRadius={theme.radius.pill} style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: theme.touchTarget,
            paddingHorizontal: theme.spacing[4],
            gap: theme.spacing[2],
          }}
        >
          <Search size={theme.iconSize.md} color={theme.colors.textMuted} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            style={[theme.typography.body, { flex: 1, color: theme.colors.text, padding: 0 }]}
            returnKeyType="search"
          />
          {value.length > 0 && (
            <Pressable
              onPress={() => onChangeText('')}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <X size={theme.iconSize.sm} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>
      </GlassSurface>
      {onCancel && (
        <Pressable onPress={onCancel} hitSlop={8}>
          <Text variant="label" color="brand">
            Cancel
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
