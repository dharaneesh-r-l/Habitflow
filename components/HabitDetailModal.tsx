import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import {
  Flame,
  Trophy,
  Calendar,
  Clock,
  Edit3,
  Pause,
  Play,
  Archive,
  Trash2,
  Plus,
  Minus,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/IconHelper';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Habit, CompletionEntry } from '@/types';
import {
  calculateStreak,
  calculateLongestStreak,
  getCompletedEntries,
  isCompletionComplete,
  todayKey,
  dateKey,
} from '@/utils/date';
import { subDays, format } from 'date-fns';
import { radius, spacing } from '@/theme/tokens';

interface HabitDetailModalProps {
  habit?: Habit;
  visible: boolean;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
}

export function HabitDetailModal({
  habit,
  visible,
  onClose,
  onEdit,
}: HabitDetailModalProps) {
  const { theme } = useAppTheme();
  const completions = useHabitStore((s) => s.completions);
  const logCompletion = useHabitStore((s) => s.logCompletion);
  const removeCompletion = useHabitStore((s) => s.removeCompletion);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const pauseHabit = useHabitStore((s) => s.pauseHabit);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  if (!habit) return null;

  const dKey = todayKey();
  const currentCompletion = completions.find((c) => c.habitId === habit.id && c.date === dKey);
  const isDoneToday = isCompletionComplete(habit, currentCompletion);

  const habitCompletions = getCompletedEntries(habit, completions);
  const currentStreak = calculateStreak(habitCompletions, habit.id);
  const longestStreak = calculateLongestStreak(habitCompletions, habit.id);

  // Past 14 days history matrix
  const historyDays = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dayKey = dateKey(date);
    const comp = completions.find((c) => c.habitId === habit.id && c.date === dayKey);
    const completed = isCompletionComplete(habit, comp);
    return { date, dayKey, completed, value: comp?.value || 0 };
  });

  const completionRateLast14 = Math.round(
    (historyDays.filter((d) => d.completed).length / 14) * 100
  );

  const handleIncrement = () => {
    const curVal = currentCompletion?.value || 0;
    const step = Math.max(1, Math.round(habit.target * 0.1));
    const nextVal = Math.min(curVal + step, habit.target * 3);
    logCompletion(habit.id, nextVal);
  };

  const handleDecrement = () => {
    const curVal = currentCompletion?.value || 0;
    const step = Math.max(1, Math.round(habit.target * 0.1));
    const nextVal = Math.max(0, curVal - step);
    if (nextVal === 0) {
      removeCompletion(habit.id, dKey);
    } else {
      logCompletion(habit.id, nextVal);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete habit?',
      `Are you sure you want to permanently delete "${habit.name}" and all historical data?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteHabit(habit.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Habit Details">
      <View style={{ gap: spacing.lg }}>
        {/* Habit Header Banner */}
        <View style={[styles.headerBanner, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: habit.color + '25', borderColor: habit.color + '55' }]}>
            <Icon name={habit.icon} size={28} color={habit.color} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.habitName, { color: theme.text }]} numberOfLines={1}>
              {habit.name}
            </Text>
            {habit.description ? (
              <Text style={[styles.habitDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                {habit.description}
              </Text>
            ) : null}
            <View style={styles.badgeRow}>
              <View style={[styles.pillBadge, { backgroundColor: habit.color + '20' }]}>
                <Text style={[styles.pillText, { color: habit.color }]}>{habit.category}</Text>
              </View>
              {habit.routine && (
                <View style={[styles.pillBadge, { backgroundColor: theme.primaryDim }]}>
                  <Text style={[styles.pillText, { color: theme.primaryLight }]}>
                    {habit.routine.charAt(0).toUpperCase() + habit.routine.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Quick Today Logger */}
        <View style={[styles.loggerCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.loggerTitle, { color: theme.textSecondary }]}>Today&apos;s Status</Text>
            <Text style={[styles.loggerVal, { color: isDoneToday ? theme.success : theme.text }]}>
              {habit.type === 'boolean'
                ? isDoneToday
                  ? 'Completed today'
                  : 'Not completed yet'
                : `${currentCompletion?.value || 0} / ${habit.target} ${habit.unit}`}
            </Text>
          </View>

          {habit.type === 'boolean' ? (
            <Button
              title={isDoneToday ? 'Completed' : 'Mark Done'}
              variant={isDoneToday ? 'accent' : 'primary'}
              size="sm"
              icon={isDoneToday ? <Check size={16} color="#090D16" /> : undefined}
              onPress={() => toggleCompletion(habit.id)}
            />
          ) : (
            <View style={styles.stepperRow}>
              <Pressable
                onPress={handleDecrement}
                style={[styles.stepperBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                accessibilityRole="button"
                accessibilityLabel="Decrease progress"
              >
                <Minus size={16} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={handleIncrement}
                style={[styles.stepperBtn, { backgroundColor: theme.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Increase progress"
              >
                <Plus size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.streakDim }]}>
              <Flame size={18} color={theme.streak} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{currentStreak} days</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current Streak</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.xpDim }]}>
              <Trophy size={18} color={theme.xp} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{longestStreak} days</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Best Streak</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.accentDim }]}>
              <Check size={18} color={theme.accent} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{habitCompletions.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Finished</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.primaryDim }]}>
              <Calendar size={18} color={theme.primaryLight} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{completionRateLast14}%</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>14-Day Rate</Text>
          </View>
        </View>

        {/* 14 Days History Strip */}
        <View style={[styles.historyCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[styles.historyTitle, { color: theme.text }]}>14-Day Consistency</Text>
          <View style={styles.historyGrid}>
            {historyDays.map((day, idx) => (
              <View key={idx} style={styles.historyCol}>
                <View
                  style={[
                    styles.historyDot,
                    {
                      backgroundColor: day.completed
                        ? habit.color
                        : day.value > 0
                        ? habit.color + '60'
                        : theme.surface,
                      borderColor: day.completed ? habit.color : theme.border,
                    },
                  ]}
                >
                  {day.completed && <Check size={8} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.historyDayName, { color: theme.textMuted }]}>
                  {format(day.date, 'EEEEE')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reminder Information */}
        {habit.reminders.length > 0 && (
          <View style={[styles.reminderCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Clock size={18} color={theme.primaryLight} />
            <Text style={[styles.reminderText, { color: theme.text }]}>
              Scheduled for {habit.reminders.filter((r) => r.enabled).map((r) => r.time).join(', ')}
            </Text>
          </View>
        )}

        {/* Actions Grid */}
        <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
          <Button
            title="Edit Habit"
            variant="secondary"
            icon={<Edit3 size={18} color={theme.text} />}
            onPress={() => {
              onClose();
              onEdit(habit);
            }}
          />

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                title={habit.paused ? 'Resume' : 'Pause'}
                variant="secondary"
                icon={habit.paused ? <Play size={18} color={theme.success} /> : <Pause size={18} color={theme.warning} />}
                onPress={async () => {
                  await pauseHabit(habit.id, !habit.paused);
                  onClose();
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={habit.archived ? 'Unarchive' : 'Archive'}
                variant="secondary"
                icon={<Archive size={18} color={theme.textSecondary} />}
                onPress={async () => {
                  await archiveHabit(habit.id, !habit.archived);
                  onClose();
                }}
              />
            </View>
          </View>

          <Button
            title="Delete Habit"
            variant="danger"
            icon={<Trash2 size={18} color={theme.error} />}
            onPress={handleDelete}
          />
        </View>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  habitDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '600',
  },
  loggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  loggerTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  loggerVal: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: '46%',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: 4,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  historyCard: {
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: 12,
  },
  historyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  historyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyCol: {
    alignItems: 'center',
    gap: 4,
  },
  historyDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyDayName: {
    fontFamily: 'Inter-Medium',
    fontSize: 9,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  reminderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
});
