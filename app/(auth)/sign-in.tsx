import { useSignIn } from "@clerk/expo/legacy";
import { useOAuth, useUser } from "@clerk/expo";
import { analytics } from "@/services/analytics";
import { Link, useRouter } from 'expo-router';
import {
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from 'react-native';
import React from 'react';
import { Send, AlertCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useWarmUpBrowser } from '../../hooks/useWarmUpBrowser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { COLORS } from '@/lib/theme';

WebBrowser.maybeCompleteAuthSession();

export default function Page() {
  useWarmUpBrowser();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useUser();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        void analytics.track('sign_in', { method: 'password' });
        router.replace('/');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError('Sign in incomplete. Please check your credentials.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignInPress = React.useCallback(async () => {
    if (isSignedIn) {
      router.replace('/');
      return;
    }
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/', { scheme: 'travo' }),
      });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        void analytics.track('sign_in', { method: 'google' });
        router.replace('/');
      }
    } catch (err: any) {
      const message = typeof err?.message === 'string' ? err.message : '';
      if (message.toLowerCase().includes('already signed in')) {
        router.replace('/');
        return;
      }
      console.error('OAuth error', err);
      setError('Failed to sign in with Google.');
    }
  }, [isSignedIn, router, startOAuthFlow]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ImageBackground
        source={require('@/assets/textures/paper-texture.png')}
        imageStyle={{ opacity: 0.05 }}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
          <View className="items-center mb-8">
            <View className="h-16 w-16 items-center justify-center rounded-radius-lg bg-primary/10 mb-4 border border-primary/20">
              <Send size={32} color={COLORS.primary} />
            </View>
            <Text className="text-display-xl font-display text-foreground text-center">
              Travo
            </Text>
            <Text className="mt-2 text-center text-body-md text-muted-foreground font-body">
              Welcome back! Please sign in to continue.
            </Text>
          </View>

          <Card className="p-6">
            {error ? (
              <View className="mb-4 flex-row items-start rounded-radius-md bg-destructive/10 p-3 border border-destructive/20">
                <AlertCircle size={18} color={COLORS.destructive} className="mr-2 mt-0.5" />
                <Text className="text-body-sm text-destructive font-body flex-1">{error}</Text>
              </View>
            ) : null}

            <View className="mb-4">
              <Input
                label="Email address"
                aria-label="Email address"
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Enter your email"
                onChangeText={setEmailAddress}
                keyboardType="email-address"
              />
            </View>

            <View className="mb-6">
              <Input
                label="Password"
                aria-label="Password"
                value={password}
                placeholder="Enter your password"
                secureTextEntry
                onChangeText={setPassword}
              />
            </View>

            <Button
              onPress={onSignInPress}
              loading={loading}
              variant="default"
              size="lg"
              className="w-full"
            >
              <Text className="text-body-md font-semibold text-white font-body">
                Sign In
              </Text>
            </Button>

            <View className="my-5 flex-row items-center">
              <View className="h-px flex-1 bg-border" />
              <Text className="mx-3 text-body-sm font-medium text-muted-foreground font-body">
                OR
              </Text>
              <View className="h-px flex-1 bg-border" />
            </View>

            <Button
              onPress={onGoogleSignInPress}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              <Text className="text-body-md font-semibold text-primary font-body">
                Continue with Google
              </Text>
            </Button>

            <View className="mt-5 flex-row flex-wrap items-center justify-center">
              <Text className="text-body-sm text-muted-foreground font-body">
                By continuing, you agree to our
              </Text>
              <Link href="/legal/terms" asChild>
                <TouchableOpacity>
                  <Text className="mx-1 text-body-sm font-semibold text-primary font-body">
                    Terms of Service
                  </Text>
                </TouchableOpacity>
              </Link>
              <Text className="text-body-sm text-muted-foreground font-body">and</Text>
              <Link href="/legal/privacy" asChild>
                <TouchableOpacity>
                  <Text className="mx-1 text-body-sm font-semibold text-primary font-body">
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-body-sm text-muted-foreground font-body">
                Don&apos;t have an account?
              </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text className="ml-2 text-body-sm font-semibold text-primary font-body">
                    Sign up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Card>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}
