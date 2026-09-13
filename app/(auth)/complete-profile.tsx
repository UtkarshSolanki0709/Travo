import React, { useState } from "react";
import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { UserCheck, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { COLORS } from "@/lib/theme";
import { database } from "@/services/database";
import { analytics } from "@/services/analytics";
import { validatePasswordStrength } from "@/lib/utils";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (!user.passwordEnabled && !trimmedPassword) {
      setError("Please create a password so you can also log in manually.");
      return;
    }

    if (trimmedPassword) {
      const passValidation = validatePasswordStrength(trimmedPassword);
      if (!passValidation.isValid) {
        setError(passValidation.error || "Password does not meet requirements.");
        return;
      }

      if (trimmedPassword !== confirmPassword.trim()) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // 1. Update Username and Display Name in Clerk only if changed
      const clerkUpdates: { username?: string; firstName?: string } = {};
      if (user.username !== trimmedUsername) {
        clerkUpdates.username = trimmedUsername;
      }
      if (user.firstName !== trimmedDisplayName) {
        clerkUpdates.firstName = trimmedDisplayName;
      }
      if (Object.keys(clerkUpdates).length > 0) {
        try {
          await user.update(clerkUpdates);
        } catch (clerkErr: any) {
          console.warn("Clerk user.update directly failed, saving to metadata:", clerkErr);
          // If username or firstName is not enabled/supported in Clerk instance, save to unsafeMetadata
          try {
            await user.updateMetadata({
              unsafeMetadata: {
                ...user.unsafeMetadata,
                username: trimmedUsername,
                display_name: trimmedDisplayName,
              },
            });
          } catch (metaErr) {
            console.warn("Clerk updateMetadata fallback failed:", metaErr);
          }
        }
      }

      // 2. Set password in Clerk so user can sign in via Google OR password (if not already set)
      if (!user.passwordEnabled && trimmedPassword) {
        try {
          await user.updatePassword({
            newPassword: trimmedPassword,
          });
        } catch (passErr: any) {
          const passMsg = passErr.errors?.[0]?.message || passErr.message || "";
          console.warn("Error setting password on OAuth user:", passMsg);
          // Surface only real password policy issues, ignore if already set
          if (
            passMsg.toLowerCase().includes("password") &&
            !passMsg.toLowerCase().includes("already") &&
            !passMsg.toLowerCase().includes("current")
          ) {
            setError(`Password issue: ${passMsg}`);
            setLoading(false);
            return;
          }
        }
      }

      // 3. Sync user into Supabase database
      try {
        await database.syncUser(
          user.id,
          userEmail,
          trimmedUsername,
          trimmedDisplayName,
          user.imageUrl,
        );
      } catch (dbErr: any) {
        console.error("Supabase syncUser failed:", dbErr);
        const errMsg = dbErr?.message || String(dbErr);
        if (
          errMsg.includes("Network request failed") ||
          dbErr?.name === "TypeError"
        ) {
          setError(
            "Database connection failed (TypeError: Network request failed). Your Supabase project appears to be paused or unreachable. Please check your Supabase dashboard to resume it.",
          );
          setLoading(false);
          return;
        }
        throw dbErr;
      }

      void analytics.track("complete_profile", {
        has_username: true,
        has_display_name: Boolean(trimmedDisplayName),
      });

      // 4. Navigate into main app
      router.replace("/(tabs)/map");
    } catch (err: any) {
      console.error("Complete Profile error:", err);
      const firstErr = err?.errors?.[0];
      const paramName = firstErr?.meta?.paramName || firstErr?.paramName;
      const msg =
        firstErr?.longMessage ||
        (paramName ? `Field "${paramName}" ${firstErr?.message}` : firstErr?.message) ||
        err?.message ||
        "Failed to save profile. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/textures/paper-texture.png")}
      imageStyle={{ opacity: 0.05 }}
      className="flex-1 bg-background"
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 48,
          paddingBottom: 80,
        }}
        bottomOffset={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
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

        <Card className="p-6 mb-6">
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
              label={user?.passwordEnabled ? "Password (Already set)" : "Create Password"}
              aria-label="Create Password"
              value={password}
              placeholder={user?.passwordEnabled ? "Leave blank to keep existing" : "Min 8 chars, 1 upper, 1 lower, 1 num, 1 symbol"}
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={COLORS.textSecondary} />
                  ) : (
                    <Eye size={18} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              }
            />
          </View>

          <View className="mb-6">
            <Input
              label={user?.passwordEnabled ? "Confirm Password (Optional)" : "Confirm Password"}
              aria-label="Confirm Password"
              value={confirmPassword}
              placeholder={user?.passwordEnabled ? "Leave blank to keep existing" : "Re-enter your password"}
              secureTextEntry={!showConfirmPassword}
              onChangeText={setConfirmPassword}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={COLORS.textSecondary} />
                  ) : (
                    <Eye size={18} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              }
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
      </KeyboardAwareScrollView>
    </ImageBackground>
  );
}
