/**
 * Jade Horizon — Motion Tokens
 * Transform + opacity only. Glass moves slower. Reduced-motion respected.
 */

import { Easing } from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

export const duration = {
  fast: 120,
  normal: 200,
  slow: 320,
  verySlow: 500,
  /** Glass surfaces animate slightly slower than standard */
  glass: 280,
} as const;

export type DurationKey = keyof typeof duration;

/** Named easing curves — avoid linear for UI interactions */
export const easing = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  enter: Easing.bezier(0, 0, 0.2, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
  emphasized: Easing.bezier(0.2, 0, 0, 1),
} as const;

export const spring = {
  snappy: { damping: 20, stiffness: 300, mass: 0.8 },
  gentle: { damping: 24, stiffness: 180, mass: 1 },
  soft: { damping: 28, stiffness: 140, mass: 1.1 },
} as const;

/** Pressed scale — subtle, never bounce */
export const pressScale = 0.97;

/** Glass entrance offset (slide up) */
export const glassEnterOffset = 16;

let _reducedMotion: boolean | null = null;

export async function getReducedMotion(): Promise<boolean> {
  if (_reducedMotion !== null) return _reducedMotion;
  try {
    _reducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    _reducedMotion = false;
  }
  return _reducedMotion;
}

export function subscribeReducedMotion(cb: (enabled: boolean) => void) {
  const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
    _reducedMotion = enabled;
    cb(enabled);
  });
  return () => sub.remove();
}

/** Resolve duration under reduced-motion (collapse to near-instant fade) */
export function resolveDuration(key: DurationKey, reducedMotion: boolean): number {
  if (reducedMotion) return key === 'verySlow' ? 80 : 0;
  return duration[key];
}
