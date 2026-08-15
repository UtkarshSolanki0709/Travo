import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-url-polyfill/auto";
import { MapProvider } from "../context/MapContext";
import "../global.css";
import { COLORS, NAV_THEME } from "../lib/theme";
import { database } from "../services/database";

SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables.",
  );
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn) {
      // Sync user data to Supabase
      const email = user?.emailAddresses[0]?.emailAddress;
      if (user && email) {
        database
          .syncUser(
            user.id,
            email,
            user.username || user.firstName || "user",
            user.fullName,
            user.imageUrl,
          )
          .catch((err) => console.error("Error syncing user:", err));
      }
    }

    if (!isSignedIn && !inAuthGroup) {
      // Redirect to sign-in if not signed in and trying to access app
      router.replace("/sign-in");
    }
  }, [isSignedIn, isLoaded, segments, router, user]);

  if (!isLoaded) {
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

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null; // Splash screen stays visible
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ThemeProvider value={NAV_THEME}>
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY || ""}
          tokenCache={tokenCache}
        >
          <KeyboardProvider>
            <MapProvider>
              <InitialLayout />
              <PortalHost />
            </MapProvider>
          </KeyboardProvider>
        </ClerkProvider>
      </ThemeProvider>
    </View>
  );
}
