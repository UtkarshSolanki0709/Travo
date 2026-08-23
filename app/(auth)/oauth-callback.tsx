import { useEffect, useRef } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import { COLORS } from "@/lib/theme";
import { Send } from "lucide-react-native";

export default function OAuthCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // If the user does not have a username set yet, send to complete-profile
      if (!user?.username) {
        router.replace("/complete-profile");
      } else {
        router.replace("/(tabs)/map");
      }
    } else if (!timeoutRef.current) {
      // Set a fallback timer in case OAuth was cancelled or failed
      // Give Clerk sufficient time to exchange tokens before falling back
      timeoutRef.current = setTimeout(() => {
        router.replace("/sign-in");
      }, 6000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoaded, isSignedIn, user?.username, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
        padding: 24,
      }}
    >
      <View
        style={{
          height: 64,
          width: 64,
          borderRadius: 16,
          backgroundColor: `${COLORS.primary}15`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          borderWidth: 1,
          borderColor: `${COLORS.primary}30`,
        }}
      >
        <Send size={32} color={COLORS.primary} />
      </View>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text
        style={{
          marginTop: 16,
          fontSize: 15,
          color: COLORS.textSecondary,
          fontFamily: "Inter_500Medium",
        }}
      >
        Completing sign-in...
      </Text>
    </View>
  );
}
