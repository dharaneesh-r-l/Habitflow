import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { useAppTheme } from '@/theme/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  color?: string;
  gradientColors?: [string, string];
  trackColor?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  size = 120,
  strokeWidth = 10,
  progress,
  color,
  gradientColors,
  trackColor,
  children,
}: CircularProgressProps) {
  const { theme } = useAppTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const normalizedProgress = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    animatedProgress.value = reduceMotion
      ? normalizedProgress
      : withTiming(normalizedProgress, {
          duration: 900,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
  }, [animatedProgress, normalizedProgress, reduceMotion]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (animatedProgress.value / 100) * circumference;
    return { strokeDashoffset };
  });

  const gradientId = `circleGradient_${size}_${Math.round(circumference)}`;

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(normalizedProgress) }}
      accessibilityLabel="Daily completion progress"
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors ? gradientColors[0] : (color || theme.primaryLight)} />
            <Stop offset="100%" stopColor={gradientColors ? gradientColors[1] : (color || theme.primary)} />
          </LinearGradient>
        </Defs>
        {/* Track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor || theme.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.children}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  children: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
