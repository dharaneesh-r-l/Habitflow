import React from 'react';
import { StyleSheet, Pressable, Text, ViewStyle, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
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
  disabled,
  loading,
  icon,
}: ButtonProps) {
  const { theme } = useAppTheme();

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 17 },
  };

  const bg =
    variant === 'primary'
      ? theme.primary
      : variant === 'secondary'
      ? theme.surfaceAlt
      : variant === 'outline'
      ? 'transparent'
      : 'transparent';

  const textColor =
    variant === 'primary'
      ? '#fff'
      : variant === 'outline'
      ? theme.primary
      : variant === 'ghost'
      ? theme.textSecondary
      : theme.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={(state) => ({
        ...styles.button,
        backgroundColor: bg,
        borderColor: variant === 'outline' ? theme.primary : 'transparent',
        borderWidth: variant === 'outline' ? 1 : 0,
        paddingVertical: sizeStyles[size].paddingVertical,
        paddingHorizontal: sizeStyles[size].paddingHorizontal,
        borderRadius: radius.md,
        opacity: state.pressed ? 0.7 : disabled ? 0.4 : 1,
        ...style,
      })}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize, color: textColor }]}>{title}</Text>
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
    borderRadius: radius.md,
    minHeight: 44,
    opacity: 1,
  },
  text: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
});
