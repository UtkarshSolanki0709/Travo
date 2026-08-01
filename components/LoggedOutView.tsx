import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function LoggedOutView() {
  return (
    <View className="flex-1 items-center justify-center mt-24 px-6">
      <Ionicons
        name="lock-closed"
        size={60}
        color="var(--color-text-disabled)"
      />
      <Text className="text-2xl font-bold text-text-primary text-center">
        You are not signed in
      </Text>
      <Text className="text-base text-text-secondary text-center mt-2 mb-8">
        Sign in to customize your profile and share your journey.
      </Text>
      <View className="w-full gap-4">
        <Link href="/sign-in" asChild>
          <TouchableOpacity className="bg-brand-primary active:bg-brand-primary-pressed p-4 rounded-xl items-center shadow-lg">
            <Text className="text-text-on-primary font-bold">Sign in</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/sign-up" asChild>
          <TouchableOpacity className="bg-background-surface active:bg-background-elevated p-4 rounded-xl items-center border border-brand-primary">
            <Text className="text-brand-primary font-bold">Sign up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
