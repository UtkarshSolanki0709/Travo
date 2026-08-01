import { useCallback, useRef } from "react";
import { Animated, Pressable, type PressableProps } from "react-native";

interface AnimatedPressableComponentProps extends PressableProps {
  /** How far the view scales down on press (default 0.95) */
  scaleValue?: number;
  children: React.ReactNode;
}

/**
 * Pressable wrapper that scales down on press with a spring,
 * then springs back on release. Uses RN built-in Animated API
 * so it works in Expo Go without native modules.
 */
export default function AnimatedPressable({
  scaleValue = 0.95,
  children,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: AnimatedPressableComponentProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.spring(scale, {
        toValue: scaleValue,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
      onPressIn?.(e);
    },
    [onPressIn, scale, scaleValue],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }).start();
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
      <Animated.View style={[{ transform: [{ scale }] }, style as any]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
