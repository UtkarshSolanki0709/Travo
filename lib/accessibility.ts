import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook that returns whether the user has enabled "Reduce Motion"
 * in their system accessibility settings.
 *
 * When true, all animations should become instant state changes:
 * - Marker bloom → instant appear
 * - Route draw → instant polyline
 * - Confetti → skip
 * - Pulsing user-location dot → static dot
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * Returns animation duration based on reduced-motion preference.
 * If reduced motion is enabled, returns 0 (instant).
 */
export function getAnimationDuration(
  durationMs: number,
  reduceMotion: boolean,
): number {
  return reduceMotion ? 0 : durationMs;
}

/**
 * Standard animation durations from DESIGN.md Section 6b.
 */
export const ANIMATION_DURATIONS = {
  instant: 150,    // Button presses
  fast: 250,       // Modal sheet, tab switch
  medium: 400,     // Screen transitions, card expand
  spring: 600,     // Bottom sheet (stiffness=100, damping=20)
} as const;

/**
 * Spring config for bottom sheet / modal animations.
 */
export const SPRING_CONFIG = {
  stiffness: 100,
  damping: 20,
} as const;
