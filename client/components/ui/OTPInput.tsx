import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

type OTPInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};

export function OTPInput({ length = 4, value, onChange, error }: OTPInputProps) {
  const theme = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.wrap}>
      <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
        {digits.map((d, i) => {
          const filled = d.trim().length > 0;
          const active = value.length === i;
          return (
            <View
              key={i}
              style={{
                width: 52,
                height: 56,
                borderRadius: theme.radius.md,
                borderWidth: 1.5,
                borderColor: error
                  ? theme.colors.error
                  : active
                    ? theme.colors.borderFocus
                    : theme.colors.border,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TextInput
                editable={false}
                value={filled ? d : ''}
                style={[
                  theme.typography.h3,
                  {
                    color: theme.colors.text,
                    textAlign: 'center',
                    width: '100%',
                    padding: 0,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        maxLength={length}
        style={styles.hidden}
        caretHidden
        autoFocus
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  hidden: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
});
