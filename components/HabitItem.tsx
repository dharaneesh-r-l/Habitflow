import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { Check, Flame, Plus, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/theme/ThemeContext';
import { Icon } from '@/components/IconHelper';
import { Habit, CompletionEntry } from '@/types';
import { useHabitStore } from '@/store/habitStore';
import { radius, spacing } from '@/theme/tokens';

interface HabitItemProps {
  habit: Habit;
  completion?: CompletionEntry;
  onToggle: () => void;
  onPress?: () => void;
  compact?: boolean;
  readOnly?: boolean;
  dense?: boolean;
  animateProgress?: boolean;
  streak?: number;
  reminderTime?: string;
  reminderCount?: number;
}

export function HabitItem({
  habit,
  completion,
  onToggle,
  onPress,
  compact = false,
  readOnly = false,
  dense = false,
  animateProgress = true,
  streak = 0,
  reminderTime,
}: HabitItemProps) {
  const { theme } = useAppTheme();
  const hapticsEnabled = useHabitStore((state) => state.preferences.hapticsEnabled);
  const reduceMotion = useReducedMotion();

  const isComplete =
    habit.type === 'boolean'
      ? !!completion
      : !!completion && completion.value >= habit.target;

  const currentVal = completion?.value || 0;
  const progressPercent =
    habit.type === 'boolean'
      ? isComplete
        ? 100
        : 0
      : Math.min(100, Math.round((currentVal / Math.max(1, habit.target)) * 100));

  const scale = useSharedValue(1);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    if (!animateProgress || reduceMotion) {
      progressAnim.value = progressPercent;
      return;
    }
    progressAnim.value = withTiming(progressPercent, { duration: 300 });
  }, [animateProgress, progressPercent, progressAnim, reduceMotion]);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  const handleToggle = () => {
    if (readOnly) return;
    if (!reduceMotion) {
      scale.value = withSpring(0.85, { damping: 10, stiffness: 300 }, (finished) => {
        if (finished) scale.value = withSpring(1);
      });
    }
    if (hapticsEnabled) {
      void Haptics.impactAsync(
        isComplete ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
      ).catch(() => {});
    }
    onToggle();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: isComplete
            ? 'rgba(124, 92, 252, 0.45)'
            : theme.cardBorder,
          shadowColor: isComplete ? theme.primaryGlow : theme.shadow,
        },
      ]}
    >
      {/* Main pressable body */}
      <Pressable
        onPress={onPress || handleToggle}
        style={({ pressed }) => [styles.mainPressable, { opacity: pressed ? 0.82 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${isComplete ? 'completed' : 'not completed'}`}
      >
        {/* Habit Icon Badge with gradient-like background */}
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: habit.color + '22',
              borderColor: isComplete ? habit.color : habit.color + '44',
            },
          ]}
        >
          <Icon name={habit.icon} size={22} color={habit.color} strokeWidth={2.2} />
        </View>

        {/* Content details */}
        <View style={styles.contentWrap}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.habitName,
                {
                  color: isComplete ? theme.textSecondary : theme.text,
                  textDecorationLine: isComplete && habit.type === 'boolean' ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>

            {/* Streak flame pill if active */}
            {streak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: theme.streakDim }]}>
                <Flame size={12} color={theme.streak} />
                <Text style={[styles.streakText, { color: theme.streak }]}>{streak}d</Text>
              </View>
            )}
          </View>

          {/* Subtitle / Numeric Progress */}
          {habit.type !== 'boolean' ? (
            <View style={styles.numericWrap}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    animatedProgressStyle,
                    { backgroundColor: isComplete ? theme.success : habit.color },
                  ]}
                />
              </View>
              <Text style={[styles.numericText, { color: theme.textSecondary }]}>
                {currentVal}/{habit.target} {habit.unit}
              </Text>
            </View>
          ) : !compact && habit.description ? (
            <Text style={[styles.descText, { color: theme.textMuted }]} numberOfLines={1}>
              {habit.description}
            </Text>
          ) : (
            <View style={styles.metaRow}>
              <Text style={[styles.catLabel, { color: habit.color }]}>
                {habit.category}
              </Text>
              {reminderTime && (
                <View style={styles.reminderRow}>
                  <Clock size={11} color={theme.textMuted} />
                  <Text style={[styles.reminderText, { color: theme.textMuted }]}>
                    {reminderTime}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Pressable>

      {/* Checkbox button */}
      <Animated.View style={animatedCheckStyle}>
        <Pressable
          onPress={handleToggle}
          disabled={readOnly}
          style={({ pressed }) => [
            styles.checkButton,
            {
              backgroundColor: isComplete
                ? theme.primary
                : theme.surfaceAlt,
              borderColor: isComplete
                ? theme.primary
                : theme.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isComplete }}
          accessibilityLabel={`Mark ${habit.name} as ${isComplete ? 'incomplete' : 'complete'}`}
        >
          {isComplete ? (
            <Check size={16} color="#FFFFFF" strokeWidth={3} />
          ) : habit.type !== 'boolean' ? (
            <Plus size={15} color={theme.textSecondary} strokeWidth={2.5} />
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1.2,
    elevation: 2,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  mainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginRight: spacing.sm,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrap: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  habitName: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  streakText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    fontWeight: '700',
  },
  numericWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  numericText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500',
  },
  descText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reminderText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  checkButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
