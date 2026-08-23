import React, { useState } from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from "react-native";
import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { UserCheck, AlertCircle, CheckCircle2 } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { COLORS } from "@/lib/theme";
import { database } from "@/services/database";
import { analytics } from "@/services/analytics";

export default function CompleteProfileScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses[0]?.emailAddress ||
    "";

  const [username, setUsername] = useState(
    user?.username ||
      userEmail.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) ||
      "",
  );
  const [displayName, setDisplayName] = useState(user?.fullName || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onCompletePress = async () => {
    if (!isLoaded || !user) return;

    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim() || trimmedUsername;
    const trimmedPassword = password.trim();

    if (!trimmedUsername) {
      setError("Please choose a username.");
      return;
    }

    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    if (!trimmedPassword) {
      setError("Please create a password so you can also log in manually.");
      return;
    }

    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Update Username and Display Name in Clerk
      await user.update({
        username: trimmedUsername,
        firstName: trimmedDisplayName,
      });

      // 2. Set password in Clerk so user can sign in via Google OR password
      try {
        await user.updatePassword({
          newPassword: trimmedPassword,
        });
      } catch (passErr: any) {
        const passMsg = passErr.errors?.[0]?.message || passErr.message || "";
        console.warn("Error setting password on OAuth user:", passMsg);
        // If the password format is invalid, surface it to the user
        if (passMsg.toLowerCase().includes("password")) {
          setError(`Password issue: ${passMsg}`);
          setLoading(false);
          return;
        }
        // For other errors (e.g. already has password), proceed silently
      }

      // 3. Sync user into Supabase database
      await database.syncUser(
        user.id,
        userEmail,
        trimmedUsername,
        trimmedDisplayName,
        user.imageUrl,
      );

      void analytics.track("complete_profile", {
        has_username: true,
        has_display_name: Boolean(trimmedDisplayName),
      });

      // 4. Navigate into main app
      router.replace("/(tabs)/map");
    } catch (err: any) {
      console.error("Complete Profile error:", err);
      const msg = err.errors?.[0]?.message || err.message || "Failed to save profile. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ImageBackground
        source={require("@/assets/textures/paper-texture.png")}
        imageStyle={{ opacity: 0.05 }}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-8">
            <View className="h-16 w-16 items-center justify-center rounded-radius-lg bg-primary/10 mb-4 border border-primary/20">
              <UserCheck size={32} color={COLORS.primary} />
            </View>
            <Text className="text-display-xl font-display text-foreground text-center">
              Complete Your Profile
            </Text>
            <Text className="mt-2 text-center text-body-md text-muted-foreground font-body">
              Choose your username and set a password so you can sign in with Google or manually.
            </Text>
          </View>

          <Card className="p-6">
            {error ? (
              <View className="mb-4 flex-row items-start rounded-radius-md bg-destructive/10 p-3 border border-destructive/20">
                <AlertCircle
                  size={18}
                  color={COLORS.destructive}
                  className="mr-2 mt-0.5"
                />
                <Text className="text-body-sm text-destructive font-body flex-1">
                  {error}
                </Text>
              </View>
            ) : null}

            {userEmail ? (
              <View className="mb-4 p-3 rounded-radius-md bg-primary/5 border border-primary/15 flex-row items-center">
                <CheckCircle2 size={18} color={COLORS.primary} className="mr-2" />
                <View className="flex-1">
                  <Text className="text-caption text-muted-foreground font-body">
                    Verified Google Account
                  </Text>
                  <Text className="text-body-sm font-medium text-foreground font-body">
                    {userEmail}
                  </Text>
                </View>
              </View>
            ) : null}

            <View className="mb-4">
              <Input
                label="Username"
                aria-label="Username"
                autoCapitalize="none"
                value={username}
                placeholder="e.g. travel_buddy07"
                onChangeText={setUsername}
              />
            </View>

            <View className="mb-4">
              <Input
                label="Display Name (Optional)"
                aria-label="Display Name"
                value={displayName}
                placeholder="Your full or preferred name"
                onChangeText={setDisplayName}
              />
            </View>

            <View className="mb-4">
              <Input
                label="Create Password"
                aria-label="Create Password"
                value={password}
                placeholder="At least 8 characters"
                secureTextEntry
                onChangeText={setPassword}
              />
            </View>

            <View className="mb-6">
              <Input
                label="Confirm Password"
                aria-label="Confirm Password"
                value={confirmPassword}
                placeholder="Re-enter your password"
                secureTextEntry
                onChangeText={setConfirmPassword}
              />
            </View>

            <Button
              onPress={onCompletePress}
              loading={loading}
              variant="default"
              size="lg"
              className="w-full"
            >
              <Text className="text-body-md font-semibold text-white font-body">
                Finish &amp; Start Exploring
              </Text>
            </Button>
          </Card>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}
