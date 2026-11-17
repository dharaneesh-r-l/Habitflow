import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { format, isSameDay, startOfWeek, addDays } from 'date-fns';
import { Check } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { dateKey } from '@/utils/date';
import { radius, spacing } from '@/theme/tokens';

interface WeeklyProgressStripProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

export function WeeklyProgressStrip({
  selectedDate,
  onSelectDate,
}: WeeklyProgressStripProps) {
  const { theme } = useAppTheme();
  const preferences = useHabitStore((s) => s.preferences);
  const getCompletionRateForDate = useHabitStore((s) => s.getCompletionRateForDate);
  const getScheduledHabitsForDate = useHabitStore((s) => s.getScheduledHabitsForDate);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: preferences.weekStart as 0 | 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
      <View style={styles.daysRow}>
        {weekDays.map((date, idx) => {
          const dKey = dateKey(date);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : isToday;
          const scheduled = getScheduledHabitsForDate(date);
          const rate = getCompletionRateForDate(dKey);
          const hasHabits = scheduled.length > 0;
          const isPerfect = hasHabits && rate === 100;

          return (
            <Pressable
              key={idx}
              onPress={() => onSelectDate?.(date)}
              style={({ pressed }) => [
                styles.dayCol,
                {
                  backgroundColor: isSelected ? theme.primaryDim : 'transparent',
                  borderColor: isToday ? theme.primary : isSelected ? theme.primaryLight : 'transparent',
                  borderWidth: isToday || isSelected ? 1.5 : 0,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${format(date, 'EEEE, MMM d')}, ${rate}% complete`}
            >
              <Text style={[styles.dayLabel, { color: isToday ? theme.primaryLight : theme.textMuted }]}>
                {format(date, 'EEEEE')}
              </Text>

              <Text
                style={[
                  styles.dateNum,
                  {
                    color: isToday ? theme.text : theme.textSecondary,
                    fontWeight: isToday || isSelected ? '700' : '500',
                  },
                ]}
              >
                {format(date, 'd')}
              </Text>

              {/* Status indicator dot */}
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: !hasHabits
                      ? theme.surfaceAlt
                      : isPerfect
                      ? theme.success
                      : rate > 0
                      ? theme.primary
                      : theme.surfaceAlt,
                  },
                ]}
              >
                {isPerfect && <Check size={8} color="#FFFFFF" strokeWidth={3} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.card,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
    borderRadius: radius.md,
    gap: 4,
  },
  dayLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateNum: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  statusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
