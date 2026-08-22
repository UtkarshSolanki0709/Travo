import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { useSignUp } from "@clerk/expo/legacy";
import { useOAuth, useUser } from "@clerk/expo";
import { Link, useRouter } from 'expo-router';
import { Send, AlertCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useWarmUpBrowser } from '../../hooks/useWarmUpBrowser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { COLORS } from '@/lib/theme';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  useWarmUpBrowser();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useUser();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      await signUp.create({
        emailAddress,
        username,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/');
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
        setError('Verification incomplete. Please check the code.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignUpPress = React.useCallback(async () => {
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
        router.replace('/');
      }
    } catch (err: any) {
      const message = typeof err?.message === 'string' ? err.message : '';
      if (message.toLowerCase().includes('already signed in')) {
        router.replace('/');
        return;
      }
      console.error('OAuth error', err);
      setError('Failed to sign up with Google.');
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
              {pendingVerification
                ? 'Verify your email to continue'
                : 'Create an account to start your journey.'}
            </Text>
          </View>

          <Card className="p-6">
            {error ? (
              <View className="mb-4 flex-row items-start rounded-radius-md bg-destructive/10 p-3 border border-destructive/20">
                <AlertCircle size={18} color={COLORS.destructive} className="mr-2 mt-0.5" />
                <Text className="text-body-sm text-destructive font-body flex-1">{error}</Text>
              </View>
            ) : null}

            {pendingVerification ? (
              <>
                <View className="mb-6">
                  <Input
                    label="Verification Code"
                    aria-label="Verification Code"
                    value={code}
                    placeholder="Enter 6-digit code"
                    onChangeText={setCode}
                    keyboardType="number-pad"
                  />
                </View>

                <Button
                  onPress={onVerifyPress}
                  loading={loading}
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  <Text className="text-body-md font-semibold text-white font-body">
                    Verify Email
                  </Text>
                </Button>

                <TouchableOpacity
                  onPress={() => setPendingVerification(false)}
                  className="mt-4 items-center"
                >
                  <Text className="text-body-sm font-medium text-muted-foreground font-body">
                    Back to Sign Up
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="mb-4">
                  <Input
                    label="Username"
                    aria-label="Username"
                    autoCapitalize="none"
                    value={username}
                    placeholder="Choose a username"
                    onChangeText={setUsername}
                  />
                </View>

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
                    placeholder="Create a password"
                    secureTextEntry
                    onChangeText={setPassword}
                  />
                </View>

                <Button
                  onPress={onSignUpPress}
                  loading={loading}
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  <Text className="text-body-md font-semibold text-white font-body">
                    Create Account
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
                  onPress={onGoogleSignUpPress}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  <Text className="text-body-md font-semibold text-primary font-body">
                    Continue with Google
                  </Text>
                </Button>

                <View className="mt-6 flex-row items-center justify-center">
                  <Text className="text-body-sm text-muted-foreground font-body">
                    Already have an account?
                  </Text>
                  <Link href="/sign-in" asChild>
                    <TouchableOpacity>
                      <Text className="ml-2 text-body-sm font-semibold text-primary font-body">
                        Sign in
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </>
            )}
          </Card>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}
