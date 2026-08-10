import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { COLORS } from '@/lib/theme';

export default function LoggedOutView() {
  return (
    <View className="flex-1 items-center justify-center mt-16 px-6">
      <View className="p-4 rounded-full bg-primary/10 mb-4 border border-primary/20">
        <Lock size={48} color={COLORS.primary} />
      </View>

      <Text className="text-display-xl font-display text-foreground text-center">
        You are not signed in
      </Text>

      <Text className="text-body-md text-muted-foreground text-center font-body mt-2 mb-8">
        Sign in to customize your profile and share your journey.
      </Text>

      <View className="w-full gap-3">
        <Link href="/sign-in" asChild>
          <Button variant="default" size="lg" className="w-full">
            <Text className="text-white font-bold text-body-md font-body">
              Sign In
            </Text>
          </Button>
        </Link>

        <Link href="/sign-up" asChild>
          <Button variant="secondary" size="lg" className="w-full">
            <Text className="text-primary font-bold text-body-md font-body">
              Sign Up
            </Text>
          </Button>
        </Link>
      </View>
    </View>
  );
}