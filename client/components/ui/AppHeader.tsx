import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { GlassSurface } from './GlassSurface';
import { IconButton } from './Button';

/** Scroll distance over which the large title collapses into the compact row */
const COLLAPSE_RANGE = 56;

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
  large?: boolean;
  /**
   * Pass the scroll offset (from `useAnimatedScrollHandler` or
   * `useScrollViewOffset`) to make the large title collapse on scroll:
   * the h1 shrinks/fades out and the compact centered title fades in.
   */
  scrollY?: SharedValue<number>;
  glass?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  left,
  right,
  large = false,
  scrollY,
  glass = true,
  style,
}: AppHeaderProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const collapsible = large && scrollY != null;

  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
  };

  // Large title: shrinks and fades out as the list scrolls up
  const largeTitleStyle = useAnimatedStyle(() => {
    if (!collapsible) return {};
    const y = scrollY!.value;
    return {
      opacity: interpolate(y, [0, COLLAPSE_RANGE * 0.8], [1, 0], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(y, [0, COLLAPSE_RANGE], [1, 0.9], Extrapolation.CLAMP) },
        { translateY: interpolate(y, [0, COLLAPSE_RANGE], [0, -8], Extrapolation.CLAMP) },
      ],
      height: interpolate(
        y,
        [0, COLLAPSE_RANGE],
        [subtitle ? 68 : 44, 0],
        Extrapolation.CLAMP,
      ),
    };
  }, [collapsible, subtitle]);

  // Compact title: fades in once the large title is gone
  const compactTitleStyle = useAnimatedStyle(() => {
    if (!collapsible) return { opacity: 1 };
    const y = scrollY!.value;
    return {
      opacity: interpolate(
        y,
        [COLLAPSE_RANGE * 0.6, COLLAPSE_RANGE],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  }, [collapsible]);

  const showCompactTitle = title && (!large || collapsible);

  const content = (
    <View
      style={{
        paddingTop: glass ? theme.spacing[3] : insets.top + theme.spacing[2],
        paddingBottom: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        gap: large ? theme.spacing[2] : 0,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: theme.touchTarget }}>
        {showBack ? (
          <IconButton
            accessibilityLabel="Go back"
            icon={<ChevronLeft size={24} color={theme.colors.text} />}
            onPress={handleBack}
          />
        ) : (
          left
        )}
        {showCompactTitle && (
          <Animated.View style={[{ flex: 1 }, compactTitleStyle]}>
            <Text
              variant="title"
              numberOfLines={1}
              style={{
                textAlign: left || showBack ? 'left' : 'center',
                marginHorizontal: theme.spacing[2],
              }}
            >
              {title}
            </Text>
          </Animated.View>
        )}
        {large && !collapsible && <View style={{ flex: 1 }} />}
        {(left || showBack) && !right && <View style={{ width: theme.touchTarget }} />}
        {right}
      </View>
      {large && title && (
        <Animated.View
          style={[{ paddingHorizontal: theme.spacing[2], overflow: 'hidden' }, largeTitleStyle]}
        >
          <Text variant="h1" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="body" color="secondary" style={{ marginTop: theme.spacing[1] }}>
              {subtitle}
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );

  if (glass) {
    return (
      <GlassSurface
        level={2}
        borderRadius={0}
        style={[
          {
            borderWidth: 0,
            borderBottomWidth: StyleSheetHairline,
            borderColor: theme.colors.borderSubtle,
          },
          style,
        ]}
      >
        {content}
      </GlassSurface>
    );
  }

  return <View style={style}>{content}</View>;
}

const StyleSheetHairline = 1;
