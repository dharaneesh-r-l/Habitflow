import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  onPress?: () => void;
  padding?: number;
}

export function Card({ children, style, gradient, onPress, padding = 16 }: CardProps) {
  const { theme } = useAppTheme();

  const content = gradient ? (
    <LinearGradient
      colors={[theme.primary, theme.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { padding, borderRadius: 20 }, style]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, padding, borderRadius: 20 }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={(state) => ({ opacity: state.pressed ? 0.85 : 1, ...(style as object) })}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
