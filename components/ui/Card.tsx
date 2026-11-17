import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gradient?: boolean;
  elevated?: boolean;
  highlight?: boolean;
  onPress?: () => void;
  padding?: number;
}

export function Card({
  children,
  style,
  gradient,
  elevated = false,
  highlight = false,
  onPress,
  padding = 16,
}: CardProps) {
  const { theme } = useAppTheme();

  const borderColor = highlight
    ? theme.cardBorderHighlight
    : theme.cardBorder;

  const backgroundColor = elevated ? theme.surfaceElevated : theme.card;

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
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
          padding,
          borderRadius: radius.card,
          shadowColor: theme.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
      >
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
    elevation: 3,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
