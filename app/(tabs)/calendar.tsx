import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  CheckCircle2,
  Clock,
  Flame,
  Check,
} from 'lucide-react-native';
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
  subMonths,
  isSameDay,
  isSameMonth,
  isAfter,
  startOfDay,
} from 'date-fns';
import { dateKey, isCompletionComplete } from '@/utils/date';
import { spacing, radius } from '@/theme/tokens';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const getScheduledHabitsForDate = useHabitStore((s) => s.getScheduledHabitsForDate);
  const getCompletionsForDate = useHabitStore((s) => s.getCompletionsForDate);
  const getCompletionRateForDate = useHabitStore((s) => s.getCompletionRateForDate);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const logCompletion = useHabitStore((s) => s.logCompletion);
  const removeCompletion = useHabitStore((s) => s.removeCompletion);
  const preferences = useHabitStore((s) => s.preferences);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), {
      weekStartsOn: preferences.weekStart as 0 | 1,
    });
    const end = endOfWeek(endOfMonth(currentMonth), {
      weekStartsOn: preferences.weekStart as 0 | 1,
    });
    return eachDayOfInterval({ start, end });
  }, [currentMonth, preferences.weekStart]);

  const selectedKey = dateKey(selectedDate);
  const selectedCompletions = getCompletionsForDate(selectedKey);
  const selectedScheduled = getScheduledHabitsForDate(selectedDate);
  const selectedRate = getCompletionRateForDate(selectedKey);
  const selectedCompletedCount = selectedScheduled.filter((habit) =>
    isCompletionComplete(
      habit,
      selectedCompletions.find((c) => c.habitId === habit.id)
    )
  ).length;

  // Monthly summary metrics
  const monthStats = useMemo(() => {
    const daysInCurrentMonth = monthDays.filter((d) => isSameMonth(d, currentMonth));
    let totalScheduledCount = 0;
    let totalCompletedCount = 0;
    let perfectDays = 0;

    daysInCurrentMonth.forEach((d) => {
      const scheduled = getScheduledHabitsForDate(d);
      if (scheduled.length > 0) {
        totalScheduledCount += scheduled.length;
        const dKey = dateKey(d);
        const dayComps = getCompletionsForDate(dKey);
        const done = scheduled.filter((h) =>
          isCompletionComplete(h, dayComps.find((c) => c.habitId === h.id))
        ).length;
        totalCompletedCount += done;
        if (done === scheduled.length) perfectDays++;
      }
    });

    const avgRate = totalScheduledCount > 0 ? Math.round((totalCompletedCount / totalScheduledCount) * 100) : 0;
    return { avgRate, perfectDays, totalCompletedCount };
  }, [monthDays, currentMonth, getScheduledHabitsForDate, getCompletionsForDate, completions]);

  const getDayStyle = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) {
      return { bg: 'transparent', text: theme.textMuted + '60', border: 'transparent' };
    }

    const dKey = dateKey(date);
    const scheduled = getScheduledHabitsForDate(date);
    const isToday = isSameDay(date, new Date());
    const isSelected = isSameDay(date, selectedDate);
    const isFuture = isAfter(startOfDay(date), startOfDay(new Date()));

    if (scheduled.length === 0) {
      return {
        bg: theme.surfaceAlt,
        text: theme.textMuted,
        border: isSelected ? theme.accent : isToday ? theme.primary : 'transparent',
      };
    }

    const completed = scheduled.filter((h) =>
      isCompletionComplete(
        h,
        completions.find((c) => c.habitId === h.id && c.date === dKey)
      )
    ).length;

    const rate = completed / scheduled.length;

    if (rate === 1) {
      return {
        bg: theme.primary,
        text: '#FFFFFF',
        border: isSelected ? theme.accent : 'transparent',
      };
    }
    if (rate > 0) {
      return {
        bg: theme.primaryDim,
        text: theme.primaryLight,
        border: isSelected ? theme.accent : 'transparent',
      };
    }
    if (!isFuture) {
      return {
        bg: theme.errorDim,
        text: theme.textSecondary,
        border: isSelected ? theme.accent : 'transparent',
      };
    }

    return {
      bg: theme.surfaceAlt,
      text: theme.textSecondary,
      border: isSelected ? theme.accent : isToday ? theme.primary : 'transparent',
    };
  };

  const handleToggleHabitOnDate = (habit: (typeof habits)[0]) => {
    const comp = selectedCompletions.find((c) => c.habitId === habit.id);
    if (habit.type === 'boolean') {
      if (comp) {
        removeCompletion(habit.id, selectedKey);
      } else {
        logCompletion(habit.id, 1);
      }
    } else {
      if (isCompletionComplete(habit, comp)) {
        removeCompletion(habit.id, selectedKey);
      } else {
        const next = comp ? comp.value + Math.max(1, Math.round(habit.target * 0.25)) : Math.max(1, Math.round(habit.target * 0.25));
        logCompletion(habit.id, Math.min(next, habit.target));
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 110 }}
      >
        {/* Screen Title & Today Quick Jump */}
        <View style={styles.topHeader}>
          <Text style={[styles.title, { color: theme.text }]}>History & Calendar</Text>
          <Pressable
            onPress={() => {
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
            }}
            style={[styles.todayJumpPill, { backgroundColor: theme.primaryDim, borderColor: theme.primaryLight }]}
          >
            <Text style={[styles.todayJumpText, { color: theme.primaryLight }]}>Jump to Today</Text>
          </Pressable>
        </View>

        {/* Monthly Performance Summary Bar */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryVal, { color: theme.primaryLight }]}>{monthStats.avgRate}%</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Monthly Rate</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryVal, { color: theme.accent }]}>{monthStats.perfectDays}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Perfect Days</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryVal, { color: theme.streak }]}>{monthStats.totalCompletedCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Completions</Text>
          </View>
        </View>

        {/* Monthly Calendar View Card */}
        <Card style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: theme.surface }}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <Pressable
              onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
              hitSlop={12}
              style={[styles.navArrowBtn, { backgroundColor: theme.surfaceAlt }]}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <ChevronLeft size={20} color={theme.text} />
            </Pressable>

            <Text style={[styles.monthLabel, { color: theme.text }]}>
              {format(currentMonth, 'MMMM yyyy')}
            </Text>

            <Pressable
              onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
              hitSlop={12}
              style={[styles.navArrowBtn, { backgroundColor: theme.surfaceAlt }]}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <ChevronRight size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekHeader}>
            {WEEKDAYS.map((_, i) => {
              const dayIndex = preferences.weekStart === 1 ? (i + 1) % 7 : i;
              return (
                <Text key={i} style={[styles.weekDayText, { color: theme.textMuted }]}>
                  {WEEKDAYS[dayIndex].charAt(0)}
                </Text>
              );
            })}
          </View>

          {/* Calendar Heatmap Grid */}
          <View style={styles.calendarGrid}>
            {monthDays.map((date, i) => {
              const { bg, text, border } = getDayStyle(date);
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              const isCurrentMonth = isSameMonth(date, currentMonth);

              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    setSelectedDate(date);
                    if (!isCurrentMonth) setCurrentMonth(date);
                  }}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: bg,
                      borderColor: border,
                      borderWidth: border !== 'transparent' ? 1.8 : 0,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={format(date, 'EEEE, MMMM d')}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: text,
                        fontWeight: isToday || isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {format(date, 'd')}
                  </Text>
                  {isToday && (
                    <View style={[styles.todayIndicatorDot, { backgroundColor: theme.primaryLight }]} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Legend */}
          <View style={[styles.legend, { borderTopColor: theme.border }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.primaryDim }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Partial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.errorDim }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Missed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.surfaceAlt }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Rest / None</Text>
            </View>
          </View>
        </Card>

        {/* Selected Date Header */}
        <View style={styles.selectedDateHeader}>
          <CalIcon size={18} color={theme.primaryLight} />
          <Text style={[styles.selectedDateTitle, { color: theme.text }]}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          <View style={[styles.rateBadge, { backgroundColor: selectedRate === 100 ? theme.successDim : theme.primaryDim }]}>
            <Text style={[styles.rateBadgeText, { color: selectedRate === 100 ? theme.success : theme.primaryLight }]}>
              {selectedRate}% complete
            </Text>
          </View>
        </View>

        {/* Selected Date Habits List */}
        <View style={{ gap: 8 }}>
          {selectedScheduled.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 24, backgroundColor: theme.surface }}>
              <Text style={[styles.emptyLabel, { color: theme.textSecondary }]}>
                No habits scheduled for this day
              </Text>
            </Card>
          ) : (
            selectedScheduled.map((habit) => {
              const comp = selectedCompletions.find((c) => c.habitId === habit.id);
              const isDone = isCompletionComplete(habit, comp);
              const isFuture = isAfter(startOfDay(selectedDate), startOfDay(new Date()));

              return (
                <View
                  key={habit.id}
                  style={[
                    styles.dayHabitCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isDone ? habit.color + '55' : theme.cardBorder,
                    },
                  ]}
                >
                  <View style={[styles.habitIconWrap, { backgroundColor: habit.color + '22' }]}>
                    <Icon name={habit.icon} size={20} color={habit.color} />
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.dayHabitName, { color: theme.text }]} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <Text style={[styles.dayHabitGoal, { color: theme.textSecondary }]}>
                      {habit.type === 'boolean'
                        ? habit.category
                        : `${comp?.value || 0}/${habit.target} ${habit.unit}`}
                    </Text>
                  </View>

                  {/* Status button */}
                  <Pressable
                    onPress={() => handleToggleHabitOnDate(habit)}
                    style={[
                      styles.toggleBtn,
                      {
                        backgroundColor: isDone
                          ? theme.success
                          : isFuture
                          ? theme.surfaceAlt
                          : theme.surfaceAlt,
                        borderColor: isDone ? theme.success : theme.border,
                      },
                    ]}
                  >
                    {isDone ? (
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    ) : isFuture ? (
                      <Clock size={14} color={theme.textMuted} />
                    ) : (
                      <Text style={[styles.missedText, { color: theme.textMuted }]}>Missed</Text>
                    )}
                  </Pressable>
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
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    fontWeight: '700',
  },
  todayJumpPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  todayJumpText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryVal: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  summaryDivider: {
    width: 1,
    height: 28,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    fontWeight: '700',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekDayText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayCell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 2,
  },
  dayText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  todayIndicatorDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  selectedDateTitle: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  rateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  rateBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  emptyLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  dayHabitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: 12,
  },
  habitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayHabitName: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: '600',
  },
  dayHabitGoal: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  missedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
  },
});
