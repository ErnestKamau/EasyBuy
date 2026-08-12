import React, { useEffect, useState } from 'react';
import { View, Image, ImageStyle, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Skeleton } from './Skeleton';
import { ImageOff } from 'lucide-react-native';
import { resolveMediaUrl } from '@/utils/mediaUrl';

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
  const resolved = resolveMediaUrl(uri);
  const [loading, setLoading] = useState(!!resolved);
  const [error, setError] = useState(false);
  const rad = borderRadius ?? theme.radius.md;
  const ratio = resolveAspect(aspectRatio);

  useEffect(() => {
    setError(false);
    setLoading(!!resolved);
  }, [resolved]);

  return (
    <View
      style={[
        {
          width: '100%',
          aspectRatio: ratio,
          borderRadius: rad,
          overflow: 'hidden',
          backgroundColor: theme.colors.skeleton,
        },
        style,
      ]}
    >
      {resolved && !error ? (
        <>
          <Image
            key={resolved}
            source={{ uri: resolved }}
            style={[StyleSheet.absoluteFillObject, imageStyle]}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
            resizeMode="cover"
          />
          {loading && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
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
