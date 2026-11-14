import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Flame, Zap, Bell, Sparkles, Sunrise, Sun, Moon, Star, TrendingUp, Circle } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { HabitItem } from '@/components/HabitItem';
import { Icon } from '@/components/IconHelper';
import { HabitType, RoutinePeriod } from '@/types';
import { getGreeting, formatDateLabel, todayKey, getLevelFromXP, isCompletionComplete } from '@/utils/date';
import { DAILY_CHALLENGES } from '@/data/achievements';
import { spacing } from '@/theme/tokens';

const ROUTINE_ICONS: Record<RoutinePeriod, any> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Moon,
  night: Star,
};

const MOTIVATIONAL = [
  "Every small step counts. You're doing great!",
  "Consistency is the key to transformation.",
  "Your future self will thank you for today.",
  "Small habits, big changes. Keep going!",
  "Progress, not perfection. You've got this!",
  "The best time to start was yesterday. The second best is now.",
  "You are building the person you want to become.",
];

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((s) => s.habits);
  const stats = useHabitStore((s) => s.stats);
  const preferences = useHabitStore((s) => s.preferences);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const logCompletion = useHabitStore((s) => s.logCompletion);
  const removeCompletion = useHabitStore((s) => s.removeCompletion);
  const getTodayCompletionRate = useHabitStore((s) => s.getTodayCompletionRate);
  const getScheduledHabitsForDate = useHabitStore((s) => s.getScheduledHabitsForDate);
  const getCompletionForHabitOnDate = useHabitStore((s) => s.getCompletionForHabitOnDate);
  const localNow = new Date();
  const dKey = todayKey();
  const today = new Date(`${dKey}T12:00:00`);
  const currentMinuteOfDay = localNow.getHours() * 60 + localNow.getMinutes();
  const completionRate = getTodayCompletionRate();
  const levelInfo = getLevelFromXP(stats.xp);
  const dailySeed = dKey.replace(/-/g, '').split('').reduce((sum, digit) => sum + Number(digit), 0);
  const motivational = MOTIVATIONAL[dailySeed % MOTIVATIONAL.length];

  const scheduledHabits = getScheduledHabitsForDate(today).sort((a, b) => a.order - b.order);

  const routines = (() => {
    const result: Record<RoutinePeriod, typeof scheduledHabits> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };
    scheduledHabits.forEach((h) => {
      if (h.routine) result[h.routine].push(h);
    });
    return result;
  })();

  const routineGroups = (() => {
    const groups: { period: RoutinePeriod | 'anytime'; habits: typeof scheduledHabits }[] =
      (['morning', 'afternoon', 'evening', 'night'] as RoutinePeriod[])
      .filter((period) => routines[period].length > 0)
      .map((period) => ({ period, habits: routines[period] }));
    const anytimeHabits = scheduledHabits.filter((habit) => !habit.routine);
    if (anytimeHabits.length > 0) groups.push({ period: 'anytime' as const, habits: anytimeHabits });
    return groups;
  })();

  const upcomingReminders = useMemo(() => {
    const all: { habitName: string; time: string; icon: string; color: string }[] = [];
    habits.forEach((h) => {
      if (h.archived || h.paused) return;
      h.reminders.forEach((r) => {
        if (!r.enabled) return;
        const [hh, mm] = r.time.split(':').map(Number);
        const tMin = hh * 60 + mm;
        if (tMin > currentMinuteOfDay) {
          all.push({ habitName: h.name, time: r.time, icon: h.icon, color: h.color });
        }
      });
    });
    return all.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 4);
  }, [habits, currentMinuteOfDay]);

  const todayCompletedCount = scheduledHabits.filter((habit) =>
    isCompletionComplete(habit, getCompletionForHabitOnDate(habit.id, dKey))
  ).length;
  const dailyChallenge = DAILY_CHALLENGES[0];
  const challengeProgress = Math.min(100, (todayCompletedCount / dailyChallenge.target) * 100);
  const challengeClaimed = stats.dailyChallengeClaimedDate === dKey;

  const handleToggle = (
    habitId: string,
    type: HabitType,
    target: number,
    currentVal: number | undefined
  ) => {
    if (type === 'boolean') {
      toggleCompletion(habitId);
    } else {
      if (currentVal !== undefined && currentVal >= target) {
        removeCompletion(habitId, dKey);
        return;
      }
      const next = currentVal ? currentVal + Math.max(1, Math.round(target * 0.1)) : Math.max(1, Math.round(target * 0.25));
      const final = Math.min(next, target);
      logCompletion(habitId, final);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}, {preferences.userName}</Text>
            <Text style={[styles.date, { color: theme.text }]}>{formatDateLabel(today)}</Text>
          </View>
        </Animated.View>

        {/* Progress card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Card style={{ marginBottom: 16 }}>
            <View style={styles.progressRow}>
              <CircularProgress size={110} strokeWidth={9} progress={completionRate}>
                <Text style={[styles.progressPercent, { color: theme.text }]}>{completionRate}%</Text>
                <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>today</Text>
              </CircularProgress>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressTitle, { color: theme.text }]}>Daily Progress</Text>
                <Text style={[styles.progressSub, { color: theme.textSecondary }]}>
                  {todayCompletedCount} of {scheduledHabits.length} habits completed
                </Text>
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Flame size={18} color={theme.warning} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.currentStreak}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>streak</Text>
                  </View>
                  <View style={[styles.statItem, { marginLeft: 16 }]}>
                    <Zap size={18} color={theme.accent} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{stats.xp}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>XP</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Level card */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <View style={styles.levelRow}>
              <View>
                <Text style={[styles.levelLabel, { color: theme.text }]}>LEVEL {levelInfo.level}</Text>
                <Text style={[styles.levelXP, { color: theme.textSecondary }]}>{levelInfo.currentLevelXP} / {levelInfo.nextLevelXP} XP</Text>
              </View>
              <View style={[styles.levelBar, { backgroundColor: theme.surfaceAlt }]}>
                <View style={[styles.levelFill, { width: `${levelInfo.progress * 100}%`, backgroundColor: theme.primary }]} />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Motivational quote */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <View style={[styles.quoteBox, { backgroundColor: theme.primaryDim, borderColor: theme.cardBorder }]}>
            <Sparkles size={18} color={theme.primary} />
            <Text style={[styles.quoteText, { color: theme.text }]}>{motivational}</Text>
          </View>
        </Animated.View>

        {/* Daily challenge */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <Card style={{ marginBottom: 16 }}>
            <View style={styles.challengeRow}>
              <View style={[styles.challengeIcon, { backgroundColor: theme.accentDim }]}>
                <TrendingUp size={20} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.challengeTitle, { color: theme.text }]}>{dailyChallenge.title}</Text>
                <Text style={[styles.challengeXP, { color: theme.textSecondary }]}>
                  {challengeClaimed
                    ? `Daily reward claimed · +${dailyChallenge.xp} XP`
                    : `+${dailyChallenge.xp} XP · ${Math.min(todayCompletedCount, dailyChallenge.target)} of ${dailyChallenge.target} habits`}
                </Text>
                <View style={[styles.challengeBar, { backgroundColor: theme.surfaceAlt }]}>
                  <View style={[styles.challengeFill, { width: `${challengeProgress}%`, backgroundColor: theme.accent }]} />
                </View>
              </View>
              <Text style={[styles.challengeProgress, { color: theme.primary }]}>{Math.round(challengeProgress)}%</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Today&apos;s habits */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today&apos;s Habits</Text>
          <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>{scheduledHabits.length}</Text>
        </View>
        {scheduledHabits.length === 0 ? (
          <View style={styles.habitList}>
            <Card style={{ marginBottom: 16, alignItems: 'center', paddingVertical: 28 }}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No habits scheduled for today</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>Add habits from the Habits tab</Text>
            </Card>
          </View>
        ) : (
          routineGroups.map(({ period, habits: groupHabits }, groupIndex) => {
            const IconComp = period === 'anytime' ? Circle : ROUTINE_ICONS[period];
            const title = period === 'anytime' ? 'Anytime' : `${period.charAt(0).toUpperCase()}${period.slice(1)} routine`;
            return (
              <View key={period}>
                <View style={[styles.routineHeader, { marginTop: groupIndex === 0 ? 0 : 16 }]}>
                  <IconComp size={18} color={theme.primary} />
                  <Text style={[styles.routineTitle, { color: theme.text }]}>{title}</Text>
                  <Text style={[styles.routineCount, { color: theme.textSecondary }]}>{groupHabits.length}</Text>
                </View>
                <View style={styles.habitList}>
                  {groupHabits.map((habit, habitIndex) => (
                    <Animated.View key={habit.id} entering={FadeInDown.delay(300 + groupIndex * 50 + habitIndex * 35).duration(350)} style={{ marginBottom: 8 }}>
                      <HabitItem
                        habit={habit}
                        completion={getCompletionForHabitOnDate(habit.id, dKey)}
                        onToggle={() =>
                          handleToggle(habit.id, habit.type, habit.target, getCompletionForHabitOnDate(habit.id, dKey)?.value)
                        }
                        compact
                      />
                    </Animated.View>
                  ))}
                </View>
              </View>
            );
          })
        )}

        {/* Upcoming reminders */}
        {upcomingReminders.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <View style={styles.sectionHeader}>
              <Bell size={18} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Reminders</Text>
            </View>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {upcomingReminders.map((r, i) => (
                <View
                  key={i}
                  style={[
                    styles.reminderRow,
                    { borderBottomColor: theme.border, borderBottomWidth: i < upcomingReminders.length - 1 ? 1 : 0 },
                  ]}
                >
                  <View style={[styles.reminderIcon, { backgroundColor: r.color + '22' }]}>
                    <Icon name={r.icon} size={18} color={r.color} />
                  </View>
                  <Text style={[styles.reminderName, { color: theme.text }]} numberOfLines={1}>{r.habitName}</Text>
                  <Text style={[styles.reminderTime, { color: theme.primary }]}>{r.time}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  date: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  progressPercent: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    fontWeight: '700',
  },
  progressLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    marginTop: 2,
  },
  progressInfo: { flex: 1 },
  progressTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  progressSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    fontWeight: '700',
  },
  levelXP: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  levelBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginLeft: 20,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 4,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: '700',
  },
  challengeXP: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  challengeBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  challengeFill: {
    height: '100%',
    borderRadius: 2,
  },
  challengeProgress: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  habitList: {
    gap: 0,
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    fontWeight: '500',
  },
  emptySub: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 4,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  routineTitle: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  routineCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderName: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '500',
  },
  reminderTime: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: '700',
  },
});
