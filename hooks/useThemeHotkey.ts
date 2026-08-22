import { useEffect } from 'react';

/**
 * Hook that registers Cmd/Ctrl+Shift+D to toggle the color scheme.
 * Ignores key events from interactive fields (inputs, textareas, selects,
 * and contenteditable nodes).
 *
 * On native platforms the `document` global does not exist, so the
 * listener simply never attaches.
 */
export function useThemeHotkey() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger on Cmd/Ctrl + Shift + D
      if (!((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'd')) {
        return;
      }

      // Ignore when focus is in an interactive text field
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName?.toLowerCase();
        if (
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      e.preventDefault();

      // Toggle the HTML class for dark mode (NativeWind uses class strategy)
      const html = document.documentElement;
      const isDark = html.classList.contains('dark');
      if (isDark) {
        html.classList.remove('dark');
        html.style.colorScheme = 'light';
      } else {
        html.classList.add('dark');
        html.style.colorScheme = 'dark';
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
