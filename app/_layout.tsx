import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useLoadFonts } from '@/theme/ThemeBootstrap';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();
  const { fontsLoaded, fontError } = useLoadFonts();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const { mode, theme } = useAppTheme();
  const router = useRouter();
  const segments = useSegments();
  const loaded = useHabitStore((s) => s.loaded);
  const onboardingCompleted = useHabitStore(
    (s) => s.preferences.onboardingCompleted
  );

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync().catch(() => {});

    const inOnboarding = (segments as string[])[0] === 'onboarding';
    if (!onboardingCompleted && !inOnboarding) {
      router.replace('/onboarding' as any);
    } else if (onboardingCompleted && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [loaded, onboardingCompleted, segments, router]);

  if (!loaded) {
    return <View style={[styles.container, { backgroundColor: theme.background }]} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
