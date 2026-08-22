import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
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
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-url-polyfill/auto";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ToastProvider } from "../components/ui/ToastProvider";
import { MapProvider } from "../context/MapContext";
import "../global.css";
import { useThemeHotkey } from "../hooks/useThemeHotkey";
import { COLORS, NAV_THEME } from "../lib/theme";
import { database } from "../services/database";
import { analytics } from "../services/analytics";
// Importing the task module both binds LOCATION_TASK_NAME and registers the
// background task definition with TaskManager (must run once at startup).
import { LOCATION_TASK_NAME } from "../services/locationTask";

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
  const trackedAppOpen = useRef(false);

  // Analytics: identify the user, log app_open once, flush on foreground
  useEffect(() => {
    if (!isLoaded) return;
    analytics.setUser(isSignedIn ? user?.id ?? null : null);
    if (!trackedAppOpen.current) {
      trackedAppOpen.current = true;
      void analytics.track("app_open");
    }
    void analytics.flush();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void analytics.flush();
    });
    return () => sub.remove();
  }, [isLoaded, isSignedIn, user?.id]);

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
    } else {
      // Stop background journey sharing so a signed-out device stops
      // updating the previous user's live location.
      TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME)
        .then((registered) =>
          registered
            ? Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
            : null,
        )
        .catch(() => {})
        .finally(() => {
          SecureStore.deleteItemAsync("current_user_id").catch(() => {});
          SecureStore.deleteItemAsync("user_interests").catch(() => {});
        });
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
  useThemeHotkey();

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
    <ErrorBoundary>
      <Head>
        <title>Travo — Travel Together</title>
        <meta name="description" content="Discover and join travel activities with people who share your interests. Plan trips, explore maps, and connect with fellow travelers." />
      </Head>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <ThemeProvider value={NAV_THEME}>
          <ClerkProvider
            publishableKey={CLERK_PUBLISHABLE_KEY || ""}
            tokenCache={tokenCache}
          >
            <KeyboardProvider>
              <MapProvider>
                <ToastProvider>
                  <InitialLayout />
                  <PortalHost />
                </ToastProvider>
              </MapProvider>
            </KeyboardProvider>
          </ClerkProvider>
        </ThemeProvider>
      </View>
    </ErrorBoundary>
  );
}
