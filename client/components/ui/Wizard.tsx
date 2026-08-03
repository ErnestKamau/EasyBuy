import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeIn,
} from 'react-native-reanimated';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { ProgressBar } from './Progress';
import { Button } from './Button';

type WizardStep = {
  key: string;
  title: string;
  /** Return true to allow advance */
  validate?: () => boolean | Promise<boolean>;
  render: () => React.ReactNode;
};

type WizardContainerProps = {
  steps: WizardStep[];
  onComplete: () => void;
  completeLabel?: string;
};

export function WizardStepper({
  steps,
  current,
}: {
  steps: { key: string; title: string }[];
  current: number;
}) {
  const theme = useAppTheme();
  const progress = steps.length > 1 ? current / (steps.length - 1) : 1;

  return (
    <View style={{ gap: theme.spacing[3] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {steps.map((s, i) => (
          <Text
            key={s.key}
            variant="caption"
            color={i === current ? 'brand' : i < current ? 'primary' : 'muted'}
            style={{
              fontFamily:
                i === current
                  ? theme.fontFamily.body.semiBold
                  : theme.fontFamily.body.regular,
            }}
          >
            {i + 1}. {s.title}
          </Text>
        ))}
      </View>
      <ProgressBar progress={progress} />
    </View>
  );
}

export function WizardContainer({
  steps,
  onComplete,
  completeLabel = 'Confirm',
}: WizardContainerProps) {
  const theme = useAppTheme();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  const next = useCallback(async () => {
    setBusy(true);
    try {
      const ok = step.validate ? await step.validate() : true;
      if (!ok) return;
      if (isLast) onComplete();
      else setIndex((i) => i + 1);
    } finally {
      setBusy(false);
    }
  }, [step, isLast, onComplete]);

  return (
    <View style={{ flex: 1, gap: theme.spacing[5] }}>
      <WizardStepper steps={steps} current={index} />
      <Animated.View
        key={step.key}
        entering={FadeInRight.duration(theme.duration.normal)}
        exiting={FadeOutLeft.duration(theme.duration.fast)}
        style={{ flex: 1 }}
      >
        {step.render()}
      </Animated.View>
      <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
        {index > 0 && (
          <Button
            title="Back"
            variant="secondary"
            onPress={() => setIndex((i) => i - 1)}
            style={{ flex: 1 }}
          />
        )}
        <Button
          title={isLast ? completeLabel : 'Continue'}
          onPress={next}
          loading={busy}
          fullWidth
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
}
