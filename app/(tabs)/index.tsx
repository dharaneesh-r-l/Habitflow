import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Flame, Zap, Bell, ChevronRight, Sparkles, Sunrise, Sun, Moon, Star, TrendingUp } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { HabitItem } from '@/components/HabitItem';
import { Icon } from '@/components/IconHelper';
import { RoutinePeriod } from '@/types';
import { getGreeting, formatDateLabel, todayKey, getLevelFromXP } from '@/utils/date';
import { DAILY_CHALLENGES } from '@/data/achievements';

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
  const completions = useHabitStore((s) => s.completions);
  const stats = useHabitStore((s) => s.stats);
  const preferences = useHabitStore((s) => s.preferences);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const logCompletion = useHabitStore((s) => s.logCompletion);
  const getTodayCompletionRate = useHabitStore((s) => s.getTodayCompletionRate);
  const getScheduledHabitsForDate = useHabitStore((s) => s.getScheduledHabitsForDate);
  const getCompletionForHabitOnDate = useHabitStore((s) => s.getCompletionForHabitOnDate);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const dKey = todayKey();
  const completionRate = getTodayCompletionRate();
  const levelInfo = getLevelFromXP(stats.xp);
  const motivational = useMemo(() => MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)], [dKey]);

  const scheduledHabits = useMemo(
    () => getScheduledHabitsForDate(today).sort((a, b) => a.order - b.order),
    [habits, getScheduledHabitsForDate]
  );

  const routines = useMemo(() => {
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
  }, [scheduledHabits]);

  const upcomingReminders = useMemo(() => {
    const now = today.getHours() * 60 + today.getMinutes();
    const all: { habitName: string; time: string; icon: string; color: string }[] = [];
    habits.forEach((h) => {
      if (h.archived || h.paused) return;
      h.reminders.forEach((r) => {
        if (!r.enabled) return;
        const [hh, mm] = r.time.split(':').map(Number);
        const tMin = hh * 60 + mm;
        if (tMin > now) {
          all.push({ habitName: h.name, time: r.time, icon: h.icon, color: h.color });
        }
      });
    });
    return all.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 4);
  }, [habits]);

  const todayCompletedCount = scheduledHabits.filter((h) => getCompletionForHabitOnDate(h.id, dKey)).length;
  const dailyChallenge = DAILY_CHALLENGES[0];
  const challengeProgress = Math.min(100, (todayCompletedCount / dailyChallenge.target) * 100);

  const handleToggle = useCallback(
    (habitId: string, type: string, target: number, currentVal: number | undefined) => {
      if (type === 'boolean') {
        toggleCompletion(habitId);
      } else {
        const next = currentVal ? currentVal + Math.max(1, Math.round(target * 0.1)) : Math.max(1, Math.round(target * 0.25));
        const final = Math.min(next, target);
        logCompletion(habitId, final);
      }
    },
    [toggleCompletion, logCompletion]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
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
          <Card gradient style={{ marginBottom: 16, padding: 16 }}>
            <View style={styles.levelRow}>
              <View>
                <Text style={styles.levelLabel}>LEVEL {levelInfo.level}</Text>
                <Text style={styles.levelXP}>{levelInfo.currentLevelXP} / {levelInfo.nextLevelXP} XP</Text>
              </View>
              <View style={styles.levelBar}>
                <View style={[styles.levelFill, { width: `${levelInfo.progress * 100}%` }]} />
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
                <Text style={[styles.challengeXP, { color: theme.textSecondary }]}>+{dailyChallenge.xp} XP</Text>
              </View>
              <Text style={[styles.challengeProgress, { color: theme.primary }]}>{Math.round(challengeProgress)}%</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Today's habits */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Habits</Text>
          <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>{scheduledHabits.length}</Text>
        </View>
        <View style={styles.habitList}>
          {scheduledHabits.length === 0 ? (
            <Card style={{ marginBottom: 16, alignItems: 'center', paddingVertical: 28 }}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No habits scheduled for today</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>Add habits from the Habits tab</Text>
            </Card>
          ) : (
            scheduledHabits.map((habit, i) => (
              <Animated.View key={habit.id} entering={FadeInDown.delay(300 + i * 50).duration(400)} style={{ marginBottom: 10 }}>
                <HabitItem
                  habit={habit}
                  completion={getCompletionForHabitOnDate(habit.id, dKey)}
                  onToggle={() =>
                    handleToggle(habit.id, habit.type, habit.target, getCompletionForHabitOnDate(habit.id, dKey)?.value)
                  }
                />
              </Animated.View>
            ))
          )}
        </View>

        {/* Routines */}
        {(['morning', 'afternoon', 'evening', 'night'] as RoutinePeriod[]).map((period) => {
          const periodHabits = routines[period];
          if (periodHabits.length === 0) return null;
          const IconComp = ROUTINE_ICONS[period];
          return (
            <View key={period}>
              <View style={[styles.routineHeader, { marginTop: 16 }]}>
                <IconComp size={18} color={theme.primary} />
                <Text style={[styles.routineTitle, { color: theme.text }]}>{period.charAt(0).toUpperCase() + period.slice(1)} Routine</Text>
                <Text style={[styles.routineCount, { color: theme.textSecondary }]}>{periodHabits.length}</Text>
              </View>
              <View style={styles.habitList}>
                {periodHabits.map((habit) => (
                  <View key={habit.id} style={{ marginBottom: 8 }}>
                    <HabitItem
                      habit={habit}
                      completion={getCompletionForHabitOnDate(habit.id, dKey)}
                      onToggle={() =>
                        handleToggle(habit.id, habit.type, habit.target, getCompletionForHabitOnDate(habit.id, dKey)?.value)
                      }
                      compact
                    />
                  </View>
                ))}
              </View>
            </View>
          );
        })}

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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
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
    gap: 20,
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
    color: '#fff',
  },
  levelXP: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  levelBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginLeft: 20,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#fff',
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
    paddingHorizontal: 4,
    marginBottom: 10,
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
