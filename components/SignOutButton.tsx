import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import "../global.css";

export const SignOutButton = () => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to your desired page
      router.replace("/");
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      className="p-4 rounded-xl bg-background-elevated active:bg-background-elevated/80 border border-border-divider/50"
    >
      <Text className="text-text-secondary font-semibold">Sign out</Text>
    </TouchableOpacity>
  );
};
