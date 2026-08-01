import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  style?: ViewStyle;
  className?: string;
  variant?: "light" | "dark";
}

/**
 * Frosted-glass card.
 * iOS: BlurView with a semi-opaque white overlay for readability.
 * Android: solid white with slight transparency (no native blur).
 */
export default function GlassCard({
  children,
  intensity = 60,
  style,
  className,
  variant = "light",
}: GlassCardProps) {
  const isDark = variant === "dark";

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={intensity}
        tint={isDark ? "dark" : "default"}
        style={[styles.glass, style]}
        className={`${
          isDark ? "bg-indigo-950/40" : "bg-background-surface/40"
        } border-white/20 ${className || ""}`}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[styles.glass, style]}
      className={`${
        isDark ? "bg-indigo-950/80" : "bg-background-surface/90"
      } border-white/20 backdrop-blur-md ${className || ""}`}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});
