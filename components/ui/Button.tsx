import React from 'react';
import { StyleSheet, Pressable, Text, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/theme/ThemeContext';
import { pressedOpacity } from '@/utils/style';

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

  if (variant === 'primary' && !disabled) {
    return (
      <Pressable onPress={onPress} disabled={disabled || loading} style={(state) => pressedOpacity(state.pressed, [styles.button, style])}>
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, { paddingVertical: sizeStyles[size].paddingVertical, paddingHorizontal: sizeStyles[size].paddingHorizontal, borderRadius: 14 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize, color: '#fff' }]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    variant === 'secondary'
      ? theme.surfaceAlt
      : variant === 'outline'
      ? 'transparent'
      : 'transparent';

  const textColor =
    variant === 'outline' ? theme.primary : variant === 'ghost' ? theme.textSecondary : theme.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={(state) => ({
        ...styles.button,
        backgroundColor: bg,
        borderColor: variant === 'outline' ? theme.primary : 'transparent',
        borderWidth: variant === 'outline' ? 1.5 : 0,
        paddingVertical: sizeStyles[size].paddingVertical,
        paddingHorizontal: sizeStyles[size].paddingHorizontal,
        borderRadius: 14,
        opacity: state.pressed ? 0.7 : disabled ? 0.4 : 1,
        ...(style as object),
      })}
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
  },
  text: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
});
