import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Flame,
  Zap,
  Bell,
  Sparkles,
  Sunrise,
  Sun,
  Moon,
  Clock,
  TrendingUp,
  Plus,
  Trophy,
  CheckCircle2,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { WeeklyProgressStrip } from '@/components/ui/WeeklyProgressStrip';
import { HabitItem } from '@/components/HabitItem';
import { HabitDetailModal } from '@/components/HabitDetailModal';
import { HabitFormModal } from '@/components/HabitFormModal';
import { Icon } from '@/components/IconHelper';
import { Habit, HabitType, RoutinePeriod } from '@/types';
import {
  getGreeting,
  formatDateLabel,
  todayKey,
  getLevelFromXP,
  isCompletionComplete,
} from '@/utils/date';
import { DAILY_CHALLENGES } from '@/data/achievements';
import { spacing, radius } from '@/theme/tokens';

const ROUTINE_CONFIG: Record<
  RoutinePeriod,
  { label: string; icon: any; color: string }
> = {
  morning: { label: 'Morning Routine', icon: Sunrise, color: '#FFA07A' },
  afternoon: { label: 'Afternoon Routine', icon: Sun, color: '#F59E0B' },
  evening: { label: 'Evening Routine', icon: Moon, color: '#8B5CF6' },
  night: { label: 'Night Routine', icon: Moon, color: '#6366F1' },
};

const MOTIVATIONAL_QUOTES = [
  "Small daily improvements over time lead to stunning results.",
  "Consistency is the playground of mastery.",
  "Your habits shape your identity. Build what matters.",
  "Focus on progress, not perfection.",
  "The secret of your future is hidden in your daily routine.",
  "One habit at a time. You have complete momentum.",
];

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((s) => s.habits);
  const stats = useHabitStore((s) => s.stats);
  const preferences = useHabitStore((s) => s.preferences);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const logCompletion = useHabitStore((s) => s.logCompletion);
  const removeCompletion = useHabitStore((s) => s.removeCompletion);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const getTodayCompletionRate = useHabitStore((s) => s.getTodayCompletionRate);
  const getScheduledHabitsForDate = useHabitStore((s) => s.getScheduledHabitsForDate);
  const getCompletionForHabitOnDate = useHabitStore((s) => s.getCompletionForHabitOnDate);

  const [inspectHabit, setInspectHabit] = useState<Habit | undefined>();
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const localNow = new Date();
  const dKey = todayKey();
  const today = new Date(`${dKey}T12:00:00`);
  const currentMinuteOfDay = localNow.getHours() * 60 + localNow.getMinutes();

  const completionRate = getTodayCompletionRate();
  const levelInfo = getLevelFromXP(stats.xp);

  // Daily dynamic motivational quote
  const dailySeed = dKey.replace(/-/g, '').split('').reduce((sum, d) => sum + Number(d), 0);
  const motivational = MOTIVATIONAL_QUOTES[dailySeed % MOTIVATIONAL_QUOTES.length];

  const scheduledHabits = useMemo(() => {
    return getScheduledHabitsForDate(today).sort((a, b) => a.order - b.order);
  }, [getScheduledHabitsForDate, today, habits]);

  // Group by routine
  const routineGroups = useMemo(() => {
    const routineOrder: RoutinePeriod[] = ['morning', 'afternoon', 'evening', 'night'];
    const groups: {
      period: RoutinePeriod | 'anytime';
      title: string;
      icon: any;
      habits: Habit[];
      completedCount: number;
    }[] = [];

    routineOrder.forEach((period) => {
      const match = scheduledHabits.filter((h) => h.routine === period);
      if (match.length > 0) {
        const completedCount = match.filter((h) =>
          isCompletionComplete(h, getCompletionForHabitOnDate(h.id, dKey))
        ).length;
        groups.push({
          period,
          title: ROUTINE_CONFIG[period].label,
          icon: ROUTINE_CONFIG[period].icon,
          habits: match,
          completedCount,
        });
      }
    });

    const anytime = scheduledHabits.filter((h) => !h.routine);
    if (anytime.length > 0) {
      const completedCount = anytime.filter((h) =>
        isCompletionComplete(h, getCompletionForHabitOnDate(h.id, dKey))
      ).length;
      groups.push({
        period: 'anytime',
        title: 'Anytime Habits',
        icon: Clock,
        habits: anytime,
        completedCount,
      });
    }

    return groups;
  }, [scheduledHabits, getCompletionForHabitOnDate, dKey]);

  // Upcoming reminders for today
  const upcomingReminders = useMemo(() => {
    const all: { habitName: string; time: string; icon: string; color: string; habit: Habit }[] = [];
    habits.forEach((h) => {
      if (h.archived || h.paused) return;
      h.reminders.forEach((r) => {
        if (!r.enabled) return;
        const [hh, mm] = r.time.split(':').map(Number);
        const tMin = hh * 60 + mm;
        if (tMin > currentMinuteOfDay) {
          all.push({ habitName: h.name, time: r.time, icon: h.icon, color: h.color, habit: h });
        }
      });
    });
    return all.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 3);
  }, [habits, currentMinuteOfDay]);

  const todayCompletedCount = useMemo(() => {
    return scheduledHabits.filter((h) =>
      isCompletionComplete(h, getCompletionForHabitOnDate(h.id, dKey))
    ).length;
  }, [scheduledHabits, getCompletionForHabitOnDate, dKey]);

  const dailyChallenge = DAILY_CHALLENGES[0];
  const challengeProgress = Math.min(100, Math.round((todayCompletedCount / dailyChallenge.target) * 100));
  const challengeClaimed = stats.dailyChallengeClaimedDate === dKey;

  const handleToggleHabit = (habit: Habit) => {
    const comp = getCompletionForHabitOnDate(habit.id, dKey);
    if (habit.type === 'boolean') {
      toggleCompletion(habit.id);
    } else {
      if (isCompletionComplete(habit, comp)) {
        removeCompletion(habit.id, dKey);
      } else {
        const next = comp
          ? comp.value + Math.max(1, Math.round(habit.target * 0.2))
          : Math.max(1, Math.round(habit.target * 0.25));
        logCompletion(habit.id, Math.min(next, habit.target));
      }
    }
  };

  const handleSaveHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'order'>) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, habitData);
    } else {
      await addHabit(habitData);
    }
    setEditingHabit(undefined);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 110 }}
      >
        {/* Top Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {getGreeting()}, {preferences.userName === 'there' ? 'Leader' : preferences.userName}
            </Text>
            <Text style={[styles.todayDate, { color: theme.text }]}>
              {formatDateLabel(today)}
            </Text>
          </View>

          <View style={styles.headerBadges}>
            {/* Streak Pill */}
            <View style={[styles.headerPill, { backgroundColor: theme.streakDim, borderColor: theme.streak + '40' }]}>
              <Flame size={14} color={theme.streak} />
              <Text style={[styles.headerPillText, { color: theme.streak }]}>
                {stats.currentStreak}d
              </Text>
            </View>

            {/* Level Pill */}
            <View style={[styles.headerPill, { backgroundColor: theme.primaryDim, borderColor: theme.primary + '40' }]}>
              <Zap size={14} color={theme.primaryLight} />
              <Text style={[styles.headerPillText, { color: theme.primaryLight }]}>
                Lv {levelInfo.level}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Compact Weekly Progress Strip */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <WeeklyProgressStrip />
        </Animated.View>

        {/* Hero Daily Progress Card */}
        <Animated.View entering={FadeInDown.delay(120).duration(500)}>
          <Card
            highlight
            style={{
              marginBottom: spacing.lg,
              padding: spacing.lg,
              backgroundColor: theme.surface,
            }}
          >
            <View style={styles.heroRow}>
              {/* Circular Progress Ring */}
              <CircularProgress
                size={118}
                strokeWidth={10}
                progress={completionRate}
                gradientColors={[theme.primaryLight, theme.primary]}
              >
                <Text style={[styles.heroPercent, { color: theme.text }]}>
                  {completionRate}%
                </Text>
                <Text style={[styles.heroRatio, { color: theme.textSecondary }]}>
                  {todayCompletedCount}/{scheduledHabits.length}
                </Text>
              </CircularProgress>

              {/* Progress Summary and Stats */}
              <View style={styles.heroDetails}>
                <View style={styles.heroStatusRow}>
                  <Text style={[styles.heroStatusTitle, { color: theme.text }]}>
                    {completionRate === 100
                      ? 'Perfect Day Achieved!'
                      : completionRate >= 50
                      ? 'Outstanding Momentum!'
                      : 'Build Today’s Flow'}
                  </Text>
                  {completionRate === 100 && (
                    <CheckCircle2 size={18} color={theme.success} />
                  )}
                </View>

                <Text style={[styles.heroSubText, { color: theme.textSecondary }]}>
                  {scheduledHabits.length === 0
                    ? 'No habits scheduled today'
                    : todayCompletedCount === scheduledHabits.length
                    ? 'All scheduled habits completed today. Well done!'
                    : `${scheduledHabits.length - todayCompletedCount} habits remaining to complete today.`}
                </Text>

                {/* Level XP mini track */}
                <View style={styles.xpMiniWrap}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.xpText, { color: theme.textMuted }]}>Level {levelInfo.level}</Text>
                    <Text style={[styles.xpText, { color: theme.xp }]}>{levelInfo.currentLevelXP}/{levelInfo.nextLevelXP} XP</Text>
                  </View>
                  <View style={[styles.xpMiniTrack, { backgroundColor: theme.surfaceAlt }]}>
                    <View
                      style={[
                        styles.xpMiniFill,
                        { width: `${Math.round(levelInfo.progress * 100)}%`, backgroundColor: theme.xp },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Motivational Sparks Banner */}
        <Animated.View entering={FadeInDown.delay(180).duration(450)}>
          <View
            style={[
              styles.sparkBox,
              { backgroundColor: theme.primaryDim, borderColor: theme.cardBorderHighlight },
            ]}
          >
            <Sparkles size={16} color={theme.primaryLight} />
            <Text style={[styles.sparkText, { color: theme.textSecondary }]}>{motivational}</Text>
          </View>
        </Animated.View>

        {/* Daily Challenge Card */}
        <Animated.View entering={FadeInDown.delay(220).duration(450)}>
          <Card style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: theme.surface }}>
            <View style={styles.challengeRow}>
              <View style={[styles.challengeIcon, { backgroundColor: theme.accentDim }]}>
                <Trophy size={20} color={theme.accent} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.challengeTitle, { color: theme.text }]}>
                    {dailyChallenge.title}
                  </Text>
                  <Text style={[styles.challengeReward, { color: theme.accent }]}>
                    +{dailyChallenge.xp} XP
                  </Text>
                </View>
                <Text style={[styles.challengeDesc, { color: theme.textSecondary }]}>
                  {challengeClaimed
                    ? 'Challenge completed! Bonus XP added to profile.'
                    : `Complete ${dailyChallenge.target} habits today (${Math.min(todayCompletedCount, dailyChallenge.target)}/${dailyChallenge.target})`}
                </Text>
                <View style={[styles.challengeTrack, { backgroundColor: theme.surfaceAlt }]}>
                  <View
                    style={[
                      styles.challengeFill,
                      { width: `${challengeProgress}%`, backgroundColor: theme.accent },
                    ]}
                  />
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Upcoming Reminders (if any) */}
        {upcomingReminders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(260).duration(450)} style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Bell size={16} color={theme.primaryLight} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Reminders</Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              {upcomingReminders.map((r, i) => (
                <Pressable
                  key={i}
                  onPress={() => setInspectHabit(r.habit)}
                  style={[
                    styles.reminderCard,
                    { backgroundColor: theme.surface, borderColor: theme.cardBorder },
                  ]}
                >
                  <View style={[styles.reminderIcon, { backgroundColor: r.color + '22' }]}>
                    <Icon name={r.icon} size={18} color={r.color} />
                  </View>
                  <Text style={[styles.reminderName, { color: theme.text }]} numberOfLines={1}>
                    {r.habitName}
                  </Text>
                  <View style={[styles.timeBadge, { backgroundColor: theme.primaryDim }]}>
                    <Text style={[styles.timeBadgeText, { color: theme.primaryLight }]}>{r.time}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Routine Sections */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Routine</Text>
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={styles.newHabitLink}
            accessibilityRole="button"
            accessibilityLabel="Add new habit"
          >
            <Plus size={16} color={theme.primaryLight} />
            <Text style={[styles.newHabitText, { color: theme.primaryLight }]}>New Habit</Text>
          </Pressable>
        </View>

        {scheduledHabits.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 32, backgroundColor: theme.surface }}>
            <Icon name="Target" size={36} color={theme.primaryLight} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Habits Scheduled</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Start building your ideal daily flow by adding a habit.
            </Text>
            <Button
              title="Create a Habit"
              variant="primary"
              size="md"
              onPress={() => setShowCreateModal(true)}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : (
          routineGroups.map((group, groupIdx) => {
            const GroupIcon = group.icon;
            return (
              <View key={group.period} style={{ marginBottom: spacing.lg }}>
                <View style={styles.routineHeader}>
                  <View style={styles.routineTitleWrap}>
                    <GroupIcon size={16} color={theme.primaryLight} />
                    <Text style={[styles.routineHeading, { color: theme.text }]}>
                      {group.title}
                    </Text>
                  </View>
                  <Text style={[styles.routineCountBadge, { color: theme.textSecondary }]}>
                    {group.completedCount}/{group.habits.length} done
                  </Text>
                </View>

                <View style={{ gap: 8 }}>
                  {group.habits.map((habit, hIdx) => {
                    const comp = getCompletionForHabitOnDate(habit.id, dKey);
                    return (
                      <Animated.View
                        key={habit.id}
                        entering={FadeInDown.delay(100 + groupIdx * 40 + hIdx * 25).duration(300)}
                      >
                        <HabitItem
                          habit={habit}
                          completion={comp}
                          onToggle={() => handleToggleHabit(habit)}
                          onPress={() => setInspectHabit(habit)}
                          streak={stats.currentStreak}
                          reminderTime={habit.reminders[0]?.time}
                        />
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Habit Details Modal */}
      <HabitDetailModal
        habit={inspectHabit}
        visible={!!inspectHabit}
        onClose={() => setInspectHabit(undefined)}
        onEdit={(habit) => {
          setInspectHabit(undefined);
          setEditingHabit(habit);
          setShowCreateModal(true);
        }}
      />

      {/* Habit Form Modal */}
      {showCreateModal && (
        <HabitFormModal
          initialHabit={editingHabit}
          onSave={handleSaveHabit}
          onClose={() => {
            setShowCreateModal(false);
            setEditingHabit(undefined);
          }}
        />
      )}
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
    paddingBottom: spacing.md,
  },
  greeting: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  todayDate: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  headerPillText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroPercent: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    fontWeight: '800',
  },
  heroRatio: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginTop: 1,
  },
  heroDetails: {
    flex: 1,
    gap: 6,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatusTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  heroSubText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  xpMiniWrap: {
    marginTop: 4,
    gap: 4,
  },
  xpText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
  },
  xpMiniTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpMiniFill: {
    height: '100%',
    borderRadius: 3,
  },
  sparkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  sparkText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  challengeReward: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '700',
  },
  challengeDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  challengeTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  challengeFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    fontWeight: '700',
  },
  newHabitLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newHabitText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '600',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: 12,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderName: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  timeBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  routineTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routineHeading: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  routineCountBadge: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.lg,
  },
});
