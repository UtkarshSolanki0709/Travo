import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Text, View } from 'react-native';
import Animated, {
  FadeOut,
  SlideInUp,
} from 'react-native-reanimated';
import { COLORS } from '@/lib/theme';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; text: string }> = {
  success: { bg: COLORS.primary, text: '#fff' },
  error: { bg: COLORS.destructive, text: '#fff' },
  info: { bg: COLORS.surface, text: COLORS.textPrimary },
};

const TOAST_DURATION = 3000;

/**
 * Lightweight toast provider for transient feedback.
 * Renders toasts at the top of the screen with enter/exit animations.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: showToast }}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 60,
          left: 16,
          right: 16,
          zIndex: 9999,
          alignItems: 'center',
        }}
      >
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant];
          return (
            <Animated.View
              key={t.id}
              entering={SlideInUp.duration(250).springify()}
              exiting={FadeOut.duration(200)}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              style={{
                backgroundColor: style.bg,
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderRadius: 12,
                marginBottom: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
                maxWidth: '100%',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.06)',
              }}
            >
              <Text
                style={{
                  color: style.text,
                  fontSize: 14,
                  fontFamily: 'Inter_500Medium',
                  textAlign: 'center',
                }}
              >
                {t.message}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}
