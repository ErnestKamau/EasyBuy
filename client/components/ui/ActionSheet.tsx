import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { BottomSheet } from './BottomSheet';
import { Text } from './Text';
import { Divider } from './Divider';

type Action = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: React.ReactNode;
};

type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: Action[];
  cancelLabel?: string;
};

export function ActionSheet({
  visible,
  onClose,
  title,
  actions,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const theme = useAppTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} snap={0.4}>
      <View style={{ gap: theme.spacing[2] }}>
        {title && (
          <Text variant="label" color="muted" style={{ textAlign: 'center', marginBottom: theme.spacing[2] }}>
            {title}
          </Text>
        )}
        {actions.map((action, i) => (
          <React.Fragment key={action.label}>
            {i > 0 && <Divider />}
            <Pressable
              onPress={() => {
                onClose();
                action.onPress();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing[3],
                minHeight: theme.touchTarget + 4,
              }}
            >
              {action.icon}
              <Text variant="body" color={action.destructive ? 'error' : 'primary'}>
                {action.label}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
        <Divider />
        <Pressable
          onPress={onClose}
          style={{
            alignItems: 'center',
            minHeight: theme.touchTarget + 4,
            justifyContent: 'center',
          }}
        >
          <Text variant="body" color="muted">
            {cancelLabel}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
