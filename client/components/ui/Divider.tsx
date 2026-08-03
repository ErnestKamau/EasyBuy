import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

export function Divider({
  vertical,
  style,
}: {
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        vertical
          ? { width: StyleSheetHairline, alignSelf: 'stretch', backgroundColor: theme.colors.divider }
          : { height: StyleSheetHairline, alignSelf: 'stretch', backgroundColor: theme.colors.divider },
        style,
      ]}
    />
  );
}

const StyleSheetHairline = 1;
