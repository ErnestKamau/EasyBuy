import React from 'react';
import { Pressable, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { RefreshCw, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { Button } from './Button';
import { GlassSurface } from './GlassSurface';
import { EmptyIllustration, EmptyIllustrationKind } from './EmptyIllustration';

type EmptyStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  lottie?: any;
  illustration?: EmptyIllustrationKind;
  onRefresh?: () => void;
};

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  lottie,
  illustration,
  onRefresh,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing[8],
        paddingVertical: theme.spacing[10],
        gap: theme.spacing[4],
      }}
    >
      {illustration ? (
        <EmptyIllustration kind={illustration} />
      ) : lottie ? (
        <LottieView source={lottie} autoPlay loop style={{ width: 160, height: 160 }} />
      ) : null}

      <Text variant="h3" style={{ textAlign: 'center', marginTop: theme.spacing[2] }}>
        {title}
      </Text>
      {message && (
        <Text
          variant="body"
          color="secondary"
          style={{ textAlign: 'center', maxWidth: 280 }}
        >
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: theme.spacing[3] }} />
      )}

      {onRefresh && (
        <View
          style={{
            position: 'absolute',
            right: theme.spacing[5],
            bottom: theme.spacing[8],
          }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onRefresh();
            }}
            accessibilityRole="button"
            accessibilityLabel="Refresh"
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? theme.pressScale : 1 }],
            })}
          >
            <GlassSurface
              level={3}
              borderRadius={theme.radius.circle}
              style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={20} color={theme.colors.text} />
                <View style={{ position: 'absolute', top: 10, right: 10 }}>
                  <Sparkles size={10} color={theme.colors.primary} />
                </View>
              </View>
            </GlassSurface>
          </Pressable>
        </View>
      )}
    </View>
  );
}
