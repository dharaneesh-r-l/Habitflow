import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sparkles, TrendingUp, Lightbulb, Target, Zap } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/IconHelper';
import { getLast7Days, dateKey, getCompletedEntries, isCompletionComplete } from '@/utils/date';

export default function CoachScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const stats = useHabitStore((s) => s.stats);
  const getScheduledHabitsForDate = useHabitStore((s) => s.getScheduledHabitsForDate);

  const insights = useMemo(() => {
    const result: { type: 'success' | 'warning' | 'tip'; icon: string; title: string; message: string }[] = [];
    const activeHabits = habits.filter((h) => !h.archived);

    // Top performing habit
    const perfData = activeHabits.map((h) => {
      const last7 = getLast7Days();
      const comps = getCompletedEntries(h, completions).filter((c) => last7.includes(c.date));
      const scheduledDays = last7.filter((dKey) => {
        const date = new Date(dKey + 'T00:00:00');
        return getScheduledHabitsForDate(date).some((s) => s.id === h.id);
      });
      return { habit: h, rate: scheduledDays.length > 0 ? comps.length / scheduledDays.length : 0, comps: comps.length };
    });
    const best = perfData.sort((a, b) => b.rate - a.rate)[0];
    const worst = perfData.sort((a, b) => a.rate - b.rate)[0];

    if (best && best.rate > 0) {
      result.push({
        type: 'success',
        icon: 'TrendingUp',
        title: 'Your strongest habit',
        message: `"${best.habit.name}" has a ${Math.round(best.rate * 100)}% completion rate this week. You're building real consistency here!`,
      });
    }

    if (worst && worst.rate < 0.5 && worst.habit.id !== best?.habit.id) {
      result.push({
        type: 'warning',
        icon: 'AlertTriangle',
        title: 'Needs attention',
        message: `"${worst.habit.name}" is at ${Math.round(worst.rate * 100)}% this week. Try scheduling it at a different time or reducing the target.`,
      });
    }

    if (stats.currentStreak >= 7) {
      result.push({
        type: 'success',
        icon: 'Flame',
        title: 'Streak power',
        message: `You're on a ${stats.currentStreak}-day streak! That's ${stats.currentStreak * 10} XP earned through consistency alone.`,
      });
    } else if (stats.currentStreak === 0 && activeHabits.length > 0) {
      result.push({
        type: 'tip',
        icon: 'Lightbulb',
        title: 'Start a streak today',
        message: 'Complete just one habit today to start building momentum. Small wins compound into big results.',
      });
    }

    // Category distribution
    const categoryCount: Record<string, number> = {};
    activeHabits.forEach((h) => {
      categoryCount[h.category] = (categoryCount[h.category] || 0) + 1;
    });
    const topCat = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      result.push({
        type: 'tip',
        icon: 'BarChart3',
        title: 'Your focus area',
        message: `You have ${topCat[1]} habits in ${topCat[0]}. This is where you're investing the most energy right now.`,
      });
    }

    // Morning routine check
    const morningHabits = activeHabits.filter((h) => h.routine === 'morning');
    if (morningHabits.length > 0) {
      const todayKey = dateKey(new Date());
      const morningDone = morningHabits.filter((habit) =>
        isCompletionComplete(
          habit,
          completions.find((completion) => completion.habitId === habit.id && completion.date === todayKey)
        )
      );
      if (morningDone.length === morningHabits.length) {
        result.push({
          type: 'success',
          icon: 'Sunrise',
          title: 'Morning wins',
          message: 'You completed your entire morning routine today. Starting strong sets the tone for everything else!',
        });
      }
    }

    // Level insight
    if (stats.xp > 0) {
      result.push({
        type: 'tip',
        icon: 'Zap',
        title: `Level ${stats.level} progress`,
        message: `You've earned ${stats.xp} XP total. Each completed habit gives 10 XP — keep stacking those wins!`,
      });
    }

    // Perfect day suggestion
    if (stats.perfectDays > 0) {
      result.push({
        type: 'success',
        icon: 'CheckCircle',
        title: 'Perfectionist',
        message: `You've had ${stats.perfectDays} perfect days where every habit was completed. Aim for another one today!`,
      });
    }

    return result;
  }, [habits, completions, stats, getScheduledHabitsForDate]);

  const recommendations = useMemo(() => {
    const activeCategories = new Set(habits.filter((h) => !h.archived).map((h) => h.category));
    const recs: { category: string; title: string; reason: string; icon: string; color: string }[] = [];

    if (!activeCategories.has('Mental Wellness')) {
      recs.push({ category: 'Mental Wellness', title: 'Add a mindfulness habit', reason: 'Mental wellness habits help reduce stress and improve focus.', icon: 'Brain', color: '#B084F2' });
    }
    if (!activeCategories.has('Health')) {
      recs.push({ category: 'Health', title: 'Track your water intake', reason: 'Staying hydrated improves energy and cognitive function.', icon: 'Droplets', color: '#4ECDC4' });
    }
    if (!activeCategories.has('Learning')) {
      recs.push({ category: 'Learning', title: 'Start reading daily', reason: 'Even 15 minutes of reading builds knowledge over time.', icon: 'BookOpen', color: '#45B7D1' });
    }
    if (habits.filter((h) => !h.archived).length < 5) {
      recs.push({ category: 'Productivity', title: 'Add a deep work habit', reason: 'Focused work sessions boost productivity significantly.', icon: 'Target', color: '#06D6A0' });
    }
    return recs.slice(0, 4);
  }, [habits]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {/* AI Coach header */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={[styles.coachHeader, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.coachAvatar, { backgroundColor: theme.primaryDim }]}>
              <Sparkles size={28} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.coachTitle, { color: theme.text }]}>Habit Coach</Text>
              <Text style={[styles.coachSub, { color: theme.textSecondary }]}>Personalized insights from your routines</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Zap size={18} color={theme.accent} />
            <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.xp}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total XP</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Target size={18} color={theme.primary} />
            <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.totalCompletions}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Completions</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TrendingUp size={18} color={theme.success} />
            <Text style={[styles.summaryValue, { color: theme.text }]}>{stats.perfectDays}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Perfect Days</Text>
          </View>
        </View>

        {/* Insights */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Insights</Text>
        <View style={{ gap: 10, marginBottom: 16 }}>
          {insights.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Start tracking habits to get insights</Text>
            </Card>
          ) : (
            insights.map((insight, i) => {
              const colorMap = { success: theme.success, warning: theme.warning, tip: theme.primary };
              const color = colorMap[insight.type];
              return (
                <Animated.View key={i} entering={FadeInDown.delay(i * 80).duration(400)}>
                  <Card style={{ padding: 16 }}>
                    <View style={styles.insightRow}>
                      <View style={[styles.insightIcon, { backgroundColor: color + '22' }]}>
                        <Icon name={insight.icon} size={20} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.insightTitle, { color: theme.text }]}>{insight.title}</Text>
                        <Text style={[styles.insightMessage, { color: theme.textSecondary }]}>{insight.message}</Text>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              );
            })
          )}
        </View>

        {/* Recommendations */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recommendations</Text>
        <View style={{ gap: 10 }}>
          {recommendations.map((rec, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 80).duration(400)}>
              <Card style={{ padding: 16 }}>
                <View style={styles.insightRow}>
                  <View style={[styles.insightIcon, { backgroundColor: rec.color + '22' }]}>
                    <Icon name={rec.icon} size={20} color={rec.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.insightTitle, { color: theme.text }]}>{rec.title}</Text>
                    <Text style={[styles.insightMessage, { color: theme.textSecondary }]}>{rec.reason}</Text>
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>

        <View style={styles.aiNote}>
          <Lightbulb size={14} color={theme.textMuted} />
          <Text style={[styles.aiNoteText, { color: theme.textMuted }]}>
            Insights are generated locally from your habit data. AI integration coming soon.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    marginTop: 12,
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    fontWeight: '700',
  },
  coachSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  summaryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    marginTop: 4,
    lineHeight: 19,
  },
  aiNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  aiNoteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    flex: 1,
  },
});
