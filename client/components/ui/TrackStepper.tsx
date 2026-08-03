import React from 'react';
import { View } from 'react-native';
import { Package, ChefHat, Truck, Home, Check, LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

export type TrackStep = {
  key: string;
  label: string;
  Icon?: LucideIcon;
};

const DEFAULT_STEPS: TrackStep[] = [
  { key: 'placed', label: 'Placed', Icon: Package },
  { key: 'preparing', label: 'Preparing', Icon: ChefHat },
  { key: 'delivering', label: 'On the way', Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: Home },
];

type TrackStepperProps = {
  steps?: TrackStep[];
  /** Index of current (in-progress) step, 0-based. Completed = < current. */
  current: number;
};

export function TrackStepper({ steps = DEFAULT_STEPS, current }: TrackStepperProps) {
  const theme = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: theme.spacing[3] }}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const upcoming = i > current;
        const Icon = step.Icon ?? Package;
        const color = done || active ? theme.colors.primary : theme.colors.border;
        const iconColor = done || active ? theme.colors.textOnPrimary : theme.colors.textMuted;

        return (
          <React.Fragment key={step.key}>
            <View style={{ alignItems: 'center', flex: 1, gap: theme.spacing[2] }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: done || active ? theme.colors.primary : theme.colors.backgroundSecondary,
                  borderWidth: active ? 2 : 0,
                  borderColor: theme.colors.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {done ? (
                  <Check size={18} color={theme.colors.textOnPrimary} strokeWidth={3} />
                ) : (
                  <Icon size={16} color={iconColor} />
                )}
              </View>
              <Text
                variant="caption"
                color={upcoming ? 'muted' : 'primary'}
                style={{
                  textAlign: 'center',
                  fontFamily: active ? theme.fontFamily.body.semiBold : theme.fontFamily.body.regular,
                }}
              >
                {step.label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View
                style={{
                  position: 'absolute',
                  top: 18,
                  left: `${((i + 0.5) / steps.length) * 100}%`,
                  width: `${(1 / steps.length) * 100}%`,
                  height: 2,
                  backgroundColor: i < current ? theme.colors.primary : theme.colors.border,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
