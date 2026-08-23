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
import { useSignUp, useSSO, useUser } from "@clerk/expo";
import { analytics } from "@/services/analytics";
import { Link, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Send, AlertCircle } from 'lucide-react-native';
import * as AuthSession from 'expo-auth-session';
import { useWarmUpBrowser } from '../../hooks/useWarmUpBrowser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { COLORS } from '@/lib/theme';

export default function SignUpScreen() {
  useWarmUpBrowser();
  const { signUp } = useSignUp();
  const { isSignedIn } = useUser();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onSignUpPress = async () => {
    setLoading(true);
    setError('');

    try {
      // Use the new Core 3 signal API: signUp.password()
      const { error: signUpError } = await signUp.password({
        emailAddress,
        username,
        password,
      });

      if (signUpError) {
        setError(signUpError.message || 'An error occurred during sign up.');
        return;
      }

      // Send email verification code
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(sendError.message || 'Failed to send verification code.');
        return;
      }
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || err.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (verifyError) {
        setError(verifyError.message || 'Verification failed. Please check the code.');
        return;
      }

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            // Handle session tasks
            if (session?.currentTask) {
              console.log('Session task:', session.currentTask);
              return;
            }
            void analytics.track('sign_up', { method: 'email' });
            const url = decorateUrl('/');
            router.replace(url as Href);
          },
        });
      } else {
        console.error('Sign-up not complete:', signUp.status, signUp.missingFields);
        setError('Verification incomplete. Please check the code or try again.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignUpPress = React.useCallback(async () => {
    if (isSignedIn) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: 'travo',
          path: '/oauth-callback',
        }),
      });

      const sessionId =
        res.createdSessionId ||
        res.signUp?.createdSessionId ||
        res.signIn?.createdSessionId;

      if (sessionId && res.setActive) {
        await res.setActive({ session: sessionId });
        void analytics.track('sign_up', { method: 'google' });
        // Route to onboarding / profile completion to create username & password
        router.replace('/complete-profile');
        return;
      }

      if (res.signUp && res.signUp.status === 'missing_requirements') {
        const fallbackUsername =
          res.signUp.emailAddress?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) ||
          `user_${Date.now().toString().slice(-6)}`;

        try {
          const updated = await res.signUp.update({
            username: fallbackUsername,
          });
          if (updated.createdSessionId && res.setActive) {
            await res.setActive({ session: updated.createdSessionId });
            void analytics.track('sign_up', { method: 'google' });
            router.replace('/complete-profile');
            return;
          }
        } catch (updateErr) {
          console.error('Failed to auto-complete OAuth username:', updateErr);
        }
      }
    } catch (err: any) {
      const message = typeof err?.message === 'string' ? err.message : '';
      if (message.toLowerCase().includes('already signed in')) {
        router.replace('/');
        return;
      }
      console.error('OAuth error', err);
      setError('Failed to sign up with Google.');
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, router, startSSOFlow]);

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

                <View className="mt-5 flex-row flex-wrap items-center justify-center">
                  <Text className="text-body-sm text-muted-foreground font-body">
                    By creating an account, you agree to our
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
