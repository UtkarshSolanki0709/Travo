import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import { COLORS } from "@/lib/theme";

export default function OAuthCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      // If the user does not have a custom username set yet, send to complete-profile
      if (!user?.username) {
        router.replace("/complete-profile");
      } else {
        router.replace("/(tabs)/map");
      }
    } else {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, user?.username, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
      }}
    >
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}
