import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and merges Tailwind classes
 * to avoid conflicts. Required by React Native Reusables components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Activity category types used across the app.
 */
export type ActivityCategory =
  | 'food'
  | 'sports'
  | 'arts'
  | 'nightlife'
  | 'music';

/**
 * Returns the hex color for an activity category.
 * Light mode only (per current plan).
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: '#f97316',
    sports: '#10b981',
    arts: '#8b5cf6',
    nightlife: '#84cc16',
    music: '#06b6d4',
  };
  return colors[category.toLowerCase()] ?? '#64748b';
}

/**
 * Returns a contrast-safe text color (black or white) for a given
 * category background color.
 */
export function getCategoryTextColor(category: string): string {
  // All category colors in light mode are dark enough for white text
  // except nightlife (#84cc16) which needs dark text
  const darkTextCategories = ['nightlife'];
  return darkTextCategories.includes(category.toLowerCase())
    ? '#0f1729'
    : '#ffffff';
}
