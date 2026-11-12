import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { getLevelFromXP } from '@/utils/date';
import { useHabitStore } from '@/store/habitStore';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { ThemeProvider as NavThemeProvider } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

export function ThemeBootstrap({ children }: { children: React.ReactNode }) {
  return <NavThemeProvider>{children}</NavThemeProvider>;
}

export function useLoadFonts() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return { fontsLoaded, fontError };
}
