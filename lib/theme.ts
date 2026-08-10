import { DefaultTheme, type Theme } from '@react-navigation/native';

/**
 * ───── Color Palette (DESIGN.md Section 1) ─────
 * Light mode only. Hex values for programmatic use
 * (map markers, inline styles, gradients).
 */
export const COLORS = {
  // Core Identity
  primary: '#0d9488',           // teal-700
  primaryLight: '#14b8a6',      // teal-500 (gradient start)
  secondary: '#ea580c',         // orange-500
  accent: '#f59e0b',            // amber-500
  background: '#fefcf9',        // warm off-white
  surface: '#ffffff',
  surfaceElevated: '#f8fafc',
  border: '#e2e8f0',
  textPrimary: '#0f1729',       // deep navy
  textSecondary: '#64748b',     // slate-500
  destructive: '#dc2626',

  // Gradients (reference — use with expo-linear-gradient)
  sunrise: {
    colors: ['#14b8a8', '#f59e0b'] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  twilight: {
    colors: ['#0d9488', '#0ea5e9'] as [string, string],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

/**
 * ───── Activity Category Colors (DESIGN.md Section 1) ─────
 */
export const CATEGORY_COLORS: Record<string, { light: string; text: string }> = {
  food:      { light: '#f97316', text: '#ffffff' },
  sports:    { light: '#10b981', text: '#ffffff' },
  arts:      { light: '#8b5cf6', text: '#ffffff' },
  nightlife: { light: '#84cc16', text: '#0f1729' },
  music:     { light: '#06b6d4', text: '#ffffff' },
};

/**
 * ───── Spacing Scale (DESIGN.md Section 2 — 4px base) ─────
 */
export const SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

/**
 * ───── Radius Tokens (DESIGN.md Section 2) ─────
 */
export const RADIUS = {
  md: 16,
  lg: 24,
  full: 9999,
} as const;

/**
 * ───── Elevation Shadows (DESIGN.md Section 2) ─────
 */
export const ELEVATION = {
  0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

/**
 * ───── React Navigation Theme (light mode) ─────
 */
export const NAV_THEME: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    border: COLORS.border,
    card: COLORS.surface,
    notification: COLORS.destructive,
    primary: COLORS.primary,
    text: COLORS.textPrimary,
  },
};
