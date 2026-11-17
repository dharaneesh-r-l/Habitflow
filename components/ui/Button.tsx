import React from 'react';
import { StyleSheet, Pressable, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { radius } from '@/theme/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled,
  loading,
  icon,
}: ButtonProps) {
  const { theme } = useAppTheme();
  const hapticsEnabled = useHabitStore((s) => s.preferences.hapticsEnabled);

  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13, minHeight: 36 },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15, minHeight: 46 },
    lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 16, minHeight: 52 },
  };

  let bg = theme.primary;
  let textColor = '#FFFFFF';
  let borderColor = 'transparent';
  let borderWidth = 0;

  switch (variant) {
    case 'primary':
      bg = theme.primary;
      textColor = '#FFFFFF';
      break;
    case 'secondary':
      bg = theme.surfaceAlt;
      textColor = theme.text;
      borderColor = theme.border;
      borderWidth = 1;
      break;
    case 'outline':
      bg = 'transparent';
      textColor = theme.primary;
      borderColor = theme.primary;
      borderWidth = 1.5;
      break;
    case 'accent':
      bg = theme.accent;
      textColor = '#090D16';
      break;
    case 'danger':
      bg = theme.errorDim;
      textColor = theme.error;
      borderColor = theme.error;
      borderWidth = 1;
      break;
    case 'ghost':
      bg = 'transparent';
      textColor = theme.textSecondary;
      break;
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth,
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          minHeight: sizeStyles[size].minHeight,
          borderRadius: radius.md,
          opacity: pressed ? 0.8 : disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { fontSize: sizeStyles[size].fontSize, color: textColor },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
