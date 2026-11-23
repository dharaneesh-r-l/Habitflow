import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  TrendingUp,
  Flame,
  AlertTriangle,
  Lightbulb,
  Clock,
  Sunrise,
  Sparkles,
  ArrowRight,
  Target,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { HabitDetailModal } from '@/components/HabitDetailModal';
import { HabitFormModal } from '@/components/HabitFormModal';
import { Habit } from '@/types';
import {
  getLast7Days,
  getCompletedEntries,
  isCompletionComplete,
  dateKey,
} from '@/utils/date';
import { spacing, radius } from '@/theme/tokens';

export default function CoachScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const stats = useHabitStore((s) => s.stats);
  const getScheduledHabitsForDate = useHabitStore((s) => s.getScheduledHabitsForDate);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);

  const [inspectHabit, setInspectHabit] = useState<Habit | undefined>();
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived && !h.paused), [habits]);

  // Performance calculations for the past 7 days
  const coachingInsights = useMemo(() => {
    const last7 = getLast7Days();
    const insights: {
      id: string;
      category: 'strength' | 'attention' | 'routine' | 'streak' | 'tip';
      title: string;
      message: string;
      habit?: Habit;
      actionText?: string;
      icon: any;
      color: string;
    }[] = [];

    if (activeHabits.length === 0) {
      insights.push({
        id: 'no-habits',
        category: 'tip',
        title: 'Start Your First Habit',
        message: 'Building sustainable routines begins with one small daily commitment. Add your first habit today.',
        actionText: 'Browse Templates',
        icon: Target,
        color: theme.primaryLight,
      });
      return insights;
    }

    // Evaluate habit rates
    const habitStats = activeHabits.map((h) => {
      const habitComps = getCompletedEntries(h, completions).filter((c) => last7.includes(c.date));
      const scheduledDays = last7.filter((dKey) => {
        const date = new Date(dKey + 'T00:00:00');
        return getScheduledHabitsForDate(date).some((s) => s.id === h.id);
      });
      const rate = scheduledDays.length > 0 ? habitComps.length / scheduledDays.length : 0;
      return { habit: h, rate, count: habitComps.length, scheduledCount: scheduledDays.length };
    });

    const sortedByBest = [...habitStats].sort((a, b) => b.rate - a.rate);
    const best = sortedByBest[0];
    const worst = sortedByBest[sortedByBest.length - 1];

    // Strongest habit insight
    if (best && best.rate >= 0.7) {
      insights.push({
        id: 'best-habit',
        category: 'strength',
        title: 'Strongest Consistency',
        message: `"${best.habit.name}" has an exceptional ${Math.round(best.rate * 100)}% completion rate this week. This is an anchored habit—use it as a springboard to attach new habits.`,
        habit: best.habit,
        actionText: 'View Habit Stats',
        icon: TrendingUp,
        color: theme.success,
      });
    }

    // Habit needing attention
    if (worst && worst.rate < 0.5 && worst.habit.id !== best?.habit.id) {
      insights.push({
        id: 'worst-habit',
        category: 'attention',
        title: 'Friction Detected',
        message: `"${worst.habit.name}" is sitting at ${Math.round(worst.rate * 100)}% this week. Lower the initial barrier (e.g. reduce the target or shift the routine) to rebuild consistency.`,
        habit: worst.habit,
        actionText: 'Tune Goal or Time',
        icon: AlertTriangle,
        color: theme.warning,
      });
    }

    // Streak Analysis
    if (stats.currentStreak >= 3) {
      insights.push({
        id: 'streak-momentum',
        category: 'streak',
        title: `${stats.currentStreak}-Day Active Streak`,
        message: `You have locked in ${stats.currentStreak} consecutive days. Research shows habit automaticity increases significantly after 21 days—you are well on your way!`,
        actionText: 'Maintain Flow',
        icon: Flame,
        color: theme.streak,
      });
    } else {
      insights.push({
        id: 'streak-rebuild',
        category: 'tip',
        title: 'Streak Catalyst',
        message: 'Complete at least one habit today to ignite your streak counter. Remember: never miss two days in a row.',
        icon: Lightbulb,
        color: theme.xp,
      });
    }

    // Morning Routine Optimization
    const morningHabits = activeHabits.filter((h) => h.routine === 'morning');
    if (morningHabits.length > 0) {
      const todayK = dateKey(new Date());
      const completedMorning = morningHabits.filter((h) =>
        isCompletionComplete(
          h,
          completions.find((c) => c.habitId === h.id && c.date === todayK)
        )
      ).length;

      insights.push({
        id: 'morning-routine',
        category: 'routine',
        title: 'Morning Anchor',
        message: `You have ${morningHabits.length} habits in your morning stack (${completedMorning}/${morningHabits.length} completed today). A disciplined morning stack sets the cognitive tone for the whole day.`,
        icon: Sunrise,
        color: '#FFA07A',
      });
    }

    // Evening Habit Check
    const eveningHabits = activeHabits.filter((h) => h.routine === 'evening' || h.routine === 'night');
    if (eveningHabits.length >= 2) {
      insights.push({
        id: 'evening-routine',
        category: 'routine',
        title: 'Wind-Down Architecture',
        message: `You have ${eveningHabits.length} evening habits. Keep evening habits relaxing rather than mentally exhausting so they don't disrupt your sleep architecture.`,
        icon: Clock,
        color: theme.primaryLight,
      });
    }

    return insights;
  }, [activeHabits, completions, stats.currentStreak, theme, getScheduledHabitsForDate]);

  // Overall weekly score
  const weeklyScore = useMemo(() => {
    const last7 = getLast7Days();
    let totalScheduled = 0;
    let totalCompleted = 0;

    last7.forEach((dKey) => {
      const date = new Date(dKey + 'T00:00:00');
      const scheduled = getScheduledHabitsForDate(date);
      totalScheduled += scheduled.length;
      totalCompleted += scheduled.filter((h) =>
        isCompletionComplete(
          h,
          completions.find((c) => c.habitId === h.id && c.date === dKey)
        )
      ).length;
    });

    return totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
  }, [getScheduledHabitsForDate, completions]);

  const handleAction = (item: (typeof coachingInsights)[0]) => {
    if (item.habit) {
      setInspectHabit(item.habit);
    } else {
      setShowCreateModal(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 110 }}
      >
        <Text style={[styles.title, { color: theme.text }]}>Smart Habit Coach</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Evidence-based productivity coaching from your real data
        </Text>

        {/* Weekly Performance Score Card */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card
            highlight
            style={{
              marginVertical: spacing.md,
              padding: spacing.lg,
              backgroundColor: theme.surface,
            }}
          >
            <View style={styles.scoreRow}>
              <View style={[styles.scoreBadge, { backgroundColor: theme.primaryDim, borderColor: theme.primary }]}>
                <Text style={[styles.scoreVal, { color: theme.primaryLight }]}>{weeklyScore}%</Text>
                <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Weekly Flow</Text>
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.scoreTitle, { color: theme.text }]}>
                  {weeklyScore >= 80
                    ? 'Elite Weekly Consistency'
                    : weeklyScore >= 50
                    ? 'Healthy Progress'
                    : 'Momentum Building Phase'}
                </Text>
                <Text style={[styles.scoreDesc, { color: theme.textSecondary }]}>
                  {weeklyScore >= 80
                    ? 'Your daily habit execution is stellar. Keep protecting this rhythm.'
                    : weeklyScore >= 50
                    ? 'You are showing regular commitment. Focus on closing your morning stack.'
                    : 'Target just one keystone habit today to rebuild momentum.'}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Coach Recommendations Feed */}
        <View style={styles.sectionHeader}>
          <Sparkles size={16} color={theme.primaryLight} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Actionable Insights</Text>
        </View>

        <View style={{ gap: 12 }}>
          {coachingInsights.map((insight, idx) => {
            const InsightIcon = insight.icon;
            return (
              <Animated.View
                key={insight.id}
                entering={FadeInDown.delay(100 + idx * 45).duration(350)}
              >
                <Card
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.insightHeader}>
                    <View style={[styles.insightIconBadge, { backgroundColor: insight.color + '22' }]}>
                      <InsightIcon size={20} color={insight.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.insightTitle, { color: theme.text }]}>
                        {insight.title}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.insightMessage, { color: theme.textSecondary }]}>
                    {insight.message}
                  </Text>

                  {insight.actionText && (
                    <Pressable
                      onPress={() => handleAction(insight)}
                      style={[
                        styles.actionButton,
                        { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                      ]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.actionText, { color: theme.primaryLight }]}>
                        {insight.actionText}
                      </Text>
                      <ArrowRight size={14} color={theme.primaryLight} />
                    </Pressable>
                  )}
                </Card>
              </Animated.View>
            );
          })}
        </View>
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
          onSave={async (data) => {
            if (editingHabit) {
              await updateHabit(editingHabit.id, data);
            } else {
              await addHabit(data);
            }
            setShowCreateModal(false);
            setEditingHabit(undefined);
          }}
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
  container: { flex: 1 },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    fontWeight: '700',
    paddingTop: spacing.md,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreBadge: {
    width: 82,
    height: 82,
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  scoreVal: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    fontWeight: '800',
  },
  scoreLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    fontWeight: '600',
  },
  scoreTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  scoreDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    fontWeight: '700',
  },
  insightCard: {
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: 10,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightIconBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: '700',
  },
  insightMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: 2,
  },
  actionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '600',
  },
});
