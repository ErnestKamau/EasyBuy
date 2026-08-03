import React, { useRef, useState } from 'react';
import {
  ScrollView,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ProgressDots } from './ProgressDots';
import { MediaContainer } from './MediaContainer';

type CarouselProps = {
  images: (string | null | undefined)[];
  aspectRatio?: '1:1' | '4:3' | '16:9' | '3:4';
  onIndexChange?: (i: number) => void;
};

export function Carousel({ images, aspectRatio = '1:1', onIndexChange }: CarouselProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);
  const items = images.length > 0 ? images : [null];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) {
      setIndex(i);
      onIndexChange?.(i);
    }
  };

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {items.map((uri, i) => (
          <View key={i} style={{ width }}>
            <MediaContainer uri={uri} aspectRatio={aspectRatio} borderRadius={0} />
          </View>
        ))}
      </ScrollView>
      {items.length > 1 && (
        <View style={{ position: 'absolute', bottom: theme.spacing[4], left: 0, right: 0 }}>
          <ProgressDots count={items.length} index={index} />
        </View>
      )}
    </View>
  );
}
