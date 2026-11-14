import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/IconHelper';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  addMonths,
  isSameDay,
  isSameMonth,
  isAfter,
  startOfDay,
  subMonths,
} from 'date-fns';
import { dateKey, isCompletionComplete } from '@/utils/date';
import { spacing, typeScale } from '@/theme/tokens';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const { theme } = useAppTheme();
  const completions = useHabitStore((s) => s.completions);
  const getScheduledHabitsForDate = useHabitStore((s) => s.getScheduledHabitsForDate);
  const getCompletionsForDate = useHabitStore((s) => s.getCompletionsForDate);
  const getCompletionRateForDate = useHabitStore((s) => s.getCompletionRateForDate);
  const preferences = useHabitStore((s) => s.preferences);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: preferences.weekStart as 0 | 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: preferences.weekStart as 0 | 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth, preferences.weekStart]);

  const selectedKey = dateKey(selectedDate);
  const selectedCompletions = getCompletionsForDate(selectedKey);
  const selectedScheduled = getScheduledHabitsForDate(selectedDate);
  const selectedRate = getCompletionRateForDate(selectedKey);
  const selectedCompletedCount = selectedScheduled.filter((habit) =>
    isCompletionComplete(
      habit,
      selectedCompletions.find((completion) => completion.habitId === habit.id)
    )
  ).length;

  const getDayColor = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return 'transparent';
    const dKey = dateKey(date);
    const scheduled = getScheduledHabitsForDate(date);
    if (scheduled.length === 0) return theme.surfaceAlt;
    const completed = scheduled.filter((habit) =>
      isCompletionComplete(
        habit,
        completions.find((completion) => completion.habitId === habit.id && completion.date === dKey)
      )
    );
    const rate = completed.length / scheduled.length;
    if (rate === 0) return theme.surfaceAlt;
    if (rate <= 0.33) return theme.primary + '40';
    if (rate <= 0.66) return theme.primary + '80';
    return theme.primary;
  };

  const getTextColor = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return theme.textMuted;
    const rate = getCompletionRateForDate(dateKey(date));
    if (rate >= 67) return '#fff';
    return theme.text;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}>
        <Text style={[styles.title, { color: theme.text }]}>Calendar</Text>

        {/* Month navigation */}
        <Card style={{ marginBottom: 16 }}>
          <View style={styles.monthNav}>
            <Pressable onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} hitSlop={12} accessibilityRole="button" accessibilityLabel="Previous month">
              <ChevronLeft size={24} color={theme.text} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: theme.text }]}>{format(currentMonth, 'MMMM yyyy')}</Text>
            <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} hitSlop={12} accessibilityRole="button" accessibilityLabel="Next month">
              <ChevronRight size={24} color={theme.text} />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekHeader}>
            {WEEKDAYS.map((d, i) => {
              const dayIndex = preferences.weekStart === 1 ? (i + 1) % 7 : i;
              return (
                <Text key={i} style={[styles.weekDayText, { color: theme.textMuted }]}>{WEEKDAYS[dayIndex]}</Text>
              );
            })}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {monthDays.map((date, i) => {
              const isToday = isSameDay(date, new Date());
              const isSelected = isSameDay(date, selectedDate);
              const bgColor = getDayColor(date);
              const txtColor = getTextColor(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              return (
                <Pressable
                  key={i}
                  onPress={() => setSelectedDate(date)}
                  accessibilityRole="button"
                  accessibilityLabel={`${format(date, 'EEEE, MMMM d')}, ${getCompletionRateForDate(dateKey(date))}% complete`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isCurrentMonth ? bgColor : 'transparent',
                      borderColor: isSelected ? theme.accent : isToday ? theme.primary : 'transparent',
                      borderWidth: isSelected || isToday ? 2 : 0,
                    },
                  ]}
                >
                  <Text style={[styles.dayText, { color: isCurrentMonth ? txtColor : theme.textMuted, fontWeight: isToday ? '700' : '400' }]}>
                    {format(date, 'd')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Complete</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.primary + '80' }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Partial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: 1 }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Missed</Text>
            </View>
          </View>
        </Card>

        {/* Selected date details */}
        <View style={styles.sectionHeader}>
          <CalIcon size={18} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{format(selectedDate, 'EEEE, MMM d')}</Text>
        </View>

        <Card style={{ marginBottom: 16, alignItems: 'center', paddingVertical: 24 }}>
          <Text style={[styles.ratePercent, { color: theme.text }]}>{selectedRate}%</Text>
          <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>completion rate</Text>
          <Text style={[styles.rateDetail, { color: theme.textMuted, marginTop: 8 }]}>
            {selectedCompletedCount} of {selectedScheduled.length} habits completed
          </Text>
        </Card>

        {/* Habit list for selected date */}
        <View style={{ gap: 8 }}>
          {selectedScheduled.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No habits scheduled</Text>
            </Card>
          ) : (
            selectedScheduled.map((habit) => {
              const comp = selectedCompletions.find((c) => c.habitId === habit.id);
              const isComplete = isCompletionComplete(habit, comp);
              const isFuture = isAfter(startOfDay(selectedDate), startOfDay(new Date()));
              const status = isComplete
                ? 'Done'
                : comp
                ? `${Math.min(comp.value, habit.target)}/${habit.target} ${habit.unit}`
                : isFuture
                ? 'Upcoming'
                : 'Missed';
              return (
                <View
                  key={habit.id}
                  style={[styles.historyRow, { backgroundColor: theme.card, borderColor: isComplete ? habit.color : theme.cardBorder }]}
                >
                  <View style={[styles.habitIcon, { backgroundColor: habit.color + '22' }]}>
                    <Icon name={habit.icon} size={18} color={habit.color} />
                  </View>
                  <Text style={[styles.habitName, { color: theme.text }]} numberOfLines={1}>{habit.name}</Text>
                  {isComplete ? (
                    <View style={[styles.statusBadge, { backgroundColor: habit.color }]}>
                      <Text style={styles.statusText}>Done</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: theme.surfaceAlt }]}>
                      <Text style={[styles.statusText, { color: isFuture ? theme.textSecondary : theme.textMuted }]} numberOfLines={1}>{status}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: typeScale.screenTitle,
    fontWeight: '700',
    paddingTop: 12,
    paddingBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    fontWeight: '500',
    width: 36,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '13.5%',
    aspectRatio: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopColor: 'rgba(148,163,184,0.1)',
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    fontWeight: '700',
  },
  ratePercent: {
    fontFamily: 'Inter-Bold',
    fontSize: 40,
    fontWeight: '700',
  },
  rateLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  rateDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  habitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitName: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});
