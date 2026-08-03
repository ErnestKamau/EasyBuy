import React, { useState } from 'react';
import { View, Image, ImageStyle, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Skeleton } from './Skeleton';
import { ImageOff } from 'lucide-react-native';

type Aspect = '1:1' | '4:3' | '16:9' | '3:4' | number;

type MediaContainerProps = {
  uri?: string | null;
  aspectRatio?: Aspect;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

function resolveAspect(a: Aspect): number {
  if (typeof a === 'number') return a;
  const map = { '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9, '3:4': 3 / 4 };
  return map[a];
}

/** Never place media raw — always through MediaContainer (Content-First). */
export function MediaContainer({
  uri,
  aspectRatio = '1:1',
  borderRadius,
  style,
  imageStyle,
}: MediaContainerProps) {
  const theme = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const rad = borderRadius ?? theme.radius.md;
  const ratio = resolveAspect(aspectRatio);

  return (
    <View
      style={[
        {
          aspectRatio: ratio,
          borderRadius: rad,
          overflow: 'hidden',
          backgroundColor: theme.colors.skeleton,
        },
        style,
      ]}
    >
      {uri && !error ? (
        <>
          <Image
            source={{ uri }}
            style={[{ width: '100%', height: '100%' }, imageStyle]}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
            resizeMode="cover"
          />
          {loading && (
            <View style={StyleSheet.absoluteFill}>
              <Skeleton width="100%" height={400} borderRadius={0} />
            </View>
          )}
        </>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ImageOff size={28} color={theme.colors.textMuted} />
        </View>
      )}
    </View>
  );
}
