import { TextStyle } from 'react-native';

/**
 * Typography scale from DESIGN.md Section 3.
 *
 * Display/Headings: Poppins (700, 800)
 * Body/UI/Labels:   Inter (400, 500, 600)
 *
 * Font family names must match the keys used in expo-font loading.
 */

export const typography = {
  /** 48px / 1.1 / Poppins 800 — Map screen title */
  'display-2xl': {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 48,
    lineHeight: 48 * 1.1,
    fontWeight: '800',
  } as TextStyle,

  /** 36px / 1.15 / Poppins 700 — Modal headers */
  'display-xl': {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    lineHeight: 36 * 1.15,
    fontWeight: '700',
  } as TextStyle,

  /** 28px / 1.2 / Poppins 700 — Section titles */
  'heading-xl': {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 28 * 1.2,
    fontWeight: '700',
  } as TextStyle,

  /** 22px / 1.25 / Inter 600 — Card titles */
  'heading-lg': {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    lineHeight: 22 * 1.25,
    fontWeight: '600',
  } as TextStyle,

  /** 18px / 1.3 / Inter 600 — List item titles */
  'heading-md': {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 18 * 1.3,
    fontWeight: '600',
  } as TextStyle,

  /** 17px / 1.5 / Inter 400 — Body text, chat messages */
  'body-lg': {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    lineHeight: 17 * 1.5,
    fontWeight: '400',
  } as TextStyle,

  /** 15px / 1.5 / Inter 400 — Secondary text */
  'body-md': {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 15 * 1.5,
    fontWeight: '400',
  } as TextStyle,

  /** 13px / 1.4 / Inter 500 — Captions, labels (minimum body text) */
  'body-sm': {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 13 * 1.4,
    fontWeight: '500',
  } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
