import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { Icon } from '@/components/IconHelper';
import { Habit, CompletionEntry } from '@/types';

interface HabitItemProps {
  habit: Habit;
  completion?: CompletionEntry;
  onToggle: () => void;
  onLog?: (value: number) => void;
  onPress?: () => void;
  compact?: boolean;
}

export function HabitItem({ habit, completion, onToggle, onLog, onPress, compact }: HabitItemProps) {
  const { theme } = useAppTheme();
  const isComplete = !!completion;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.92, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    onToggle();
  };

  const progress =
    habit.type === 'boolean'
      ? isComplete
        ? 100
        : 0
      : completion
      ? Math.min(100, (completion.value / habit.target) * 100)
      : 0;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={onPress ? onPress : handlePress} style={(state) => ({ opacity: state.pressed ? 0.85 : 1 })}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.card,
              borderColor: isComplete ? habit.color : theme.cardBorder,
              paddingVertical: compact ? 10 : 14,
              paddingHorizontal: compact ? 12 : 16,
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: habit.color + '22' }]}>
            <Icon name={habit.icon} size={22} color={habit.color} />
          </View>

          <View style={styles.content}>
            <Text
              style={[styles.name, { color: theme.text, fontSize: compact ? 14 : 15 }]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
            {habit.type !== 'boolean' && (
              <Text style={[styles.target, { color: theme.textSecondary }]}>
                {completion ? completion.value : 0}/{habit.target} {habit.unit}
              </Text>
            )}
            {habit.type === 'boolean' && !compact && (
              <Text style={[styles.target, { color: theme.textSecondary }]} numberOfLines={1}>
                {habit.description}
              </Text>
            )}
          </View>

          <Pressable onPress={handlePress} hitSlop={10}>
            <View
              style={[
                styles.checkBtn,
                {
                  backgroundColor: isComplete ? habit.color : 'transparent',
                  borderColor: isComplete ? habit.color : theme.border,
                },
              ]}
            >
              {isComplete && <Check size={18} color="#fff" strokeWidth={3} />}
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  target: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
