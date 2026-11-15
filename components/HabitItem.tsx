import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, useReducedMotion } from 'react-native-reanimated';
import { Bell, Check, Flame, Plus } from 'lucide-react-native';
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
  compact,
  readOnly,
  dense,
  animateProgress,
  streak = 0,
  reminderTime,
  reminderCount = 0,
}: HabitItemProps) {
  const { theme } = useAppTheme();
  const hapticsEnabled = useHabitStore((state) => state.preferences.hapticsEnabled);
  const reduceMotion = useReducedMotion();
  const isComplete = habit.type === 'boolean'
    ? !!completion
    : !!completion && completion.value >= habit.target;
  const scale = useSharedValue(1);
  const progressValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  const handlePress = () => {
    if (!reduceMotion) {
      // Reanimated shared values are intentionally updated from this press handler.
      // eslint-disable-next-line react-hooks/immutability
      scale.value = withSpring(0.96, { damping: 15 }, () => {
        scale.value = withSpring(1);
      });
    }
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((error) =>
        console.warn('Habit completion haptic failed', error)
      );
    }
    onToggle();
  };

  const progress =
    habit.type === 'boolean'
      ? isComplete
        ? 100
        : 0
      : completion
      ? Math.min(100, (completion.value / Math.max(1, habit.target)) * 100)
      : 0;
  const statusLabel = habit.archived
    ? 'Archived'
    : habit.paused
    ? 'Paused'
    : isComplete
    ? 'Complete'
    : progress > 0
    ? 'In progress'
    : 'Not started';

  useEffect(() => {
    if (!animateProgress || reduceMotion) {
      progressValue.value = progress;
      return;
    }
    progressValue.value = withTiming(progress, { duration: 220 });
  }, [animateProgress, progress, progressValue, reduceMotion]);

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.card,
            borderColor: isComplete ? (dense ? theme.primary : habit.color) : theme.cardBorder,
            borderWidth: dense ? 1 : 1.5,
            paddingVertical: dense || compact ? 10 : 14,
            paddingHorizontal: dense || compact ? 12 : 16,
          },
        ]}
      >
        <Pressable
          onPress={onPress || handlePress}
          style={({ pressed }) => [styles.main, dense && styles.denseMain, pressed && { opacity: 0.84 }]}
          accessibilityRole="button"
          accessibilityLabel={`${habit.name}${onPress ? ', habit options' : ', log completion'}`}
        >
          <View style={[styles.iconWrap, dense && styles.denseIconWrap, { backgroundColor: habit.color + '22' }]}>
            <Icon name={habit.icon} size={dense ? 20 : 22} color={habit.color} />
          </View>

          <View style={[styles.content, dense && styles.denseContent]}>
            <Text
              style={[styles.name, { color: theme.text, fontSize: compact || dense ? 14 : 15 }]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
            {habit.type !== 'boolean' && (
              <Text style={[styles.target, { color: theme.textSecondary }]} numberOfLines={1}>
                {completion ? completion.value : 0}/{habit.target} {habit.unit}
              </Text>
            )}
            {habit.type === 'boolean' && !compact && (
              <Text style={[styles.target, { color: theme.textSecondary }]} numberOfLines={1}>
                {habit.description}
              </Text>
            )}
            {habit.type !== 'boolean' && (
              <View
                style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}
                accessible
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
                accessibilityLabel={`${habit.name} progress`}
              >
              {animateProgress ? (
                <Animated.View style={[styles.progressFill, animatedProgressStyle, { backgroundColor: theme.primary }]} />
              ) : (
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: habit.color }]} />
              )}
              </View>
            )}
            {dense && (
              <View style={styles.denseMeta}>
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isComplete
                      ? theme.success
                      : progress > 0
                      ? theme.primary
                      : theme.textMuted,
                  },
                ]}
                numberOfLines={1}
              >
                {statusLabel}
              </Text>
              {!!streak && (
                <View style={styles.metaItem}>
                  <Flame size={12} color={theme.warning} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>{streak}d</Text>
                </View>
              )}
              {!!reminderTime && (
                <View style={styles.metaItem}>
                  <Bell size={12} color={theme.textMuted} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {reminderTime}{reminderCount > 1 ? ` +${reminderCount - 1}` : ''}
                  </Text>
                </View>
              )}
              </View>
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={handlePress}
          disabled={readOnly}
          style={({ pressed }) => [styles.checkBtn, dense && styles.denseCheckBtn, {
            backgroundColor: isComplete ? habit.color : theme.surfaceAlt,
            borderColor: isComplete ? habit.color : theme.border,
          }, (pressed || readOnly) && { opacity: 0.55 }]}
          accessibilityRole="button"
          accessibilityLabel={
            isComplete ? `Undo ${habit.name}` : `Log ${habit.name}${habit.type === 'boolean' ? '' : ' progress'}`
          }
          accessibilityState={{ checked: isComplete }}
        >
          {isComplete ? (
            <Check size={18} color="#fff" strokeWidth={3} />
          ) : (
            <Plus size={18} color={theme.textSecondary} strokeWidth={2.5} />
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.card,
    gap: spacing.md,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  denseMain: {
    gap: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  denseIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  denseContent: {
    gap: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  name: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  target: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  denseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 16,
    gap: spacing.sm,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    flexShrink: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  denseCheckBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
});
