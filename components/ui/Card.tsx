import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/tokens';

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
      colors={[theme.gradientStart, theme.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { padding, borderRadius: radius.card }, style]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, padding, borderRadius: radius.card, shadowColor: theme.shadow }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={(state) => ({ opacity: state.pressed ? 0.88 : 1 })}>
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
    elevation: 2,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
