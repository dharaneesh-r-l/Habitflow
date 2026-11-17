import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Rect, Line, Text as SvgText } from 'react-native-svg';
import { Flame, Trophy, Target, CheckCircle2, TrendingUp, BarChart3, PieChart } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/IconHelper';
import {
  getLast7Days,
  getLast30Days,
  calculateStreak,
  calculateLongestStreak,
  getCompletedEntries,
  isCompletionComplete,
} from '@/utils/date';
import { CATEGORY_COLORS } from '@/types';
import { spacing, radius } from '@/theme/tokens';

type TabRange = 'week' | 'month';

export default function InsightsScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const stats = useHabitStore((s) => s.stats);
  const getScheduledHabitsForDate = useHabitStore((s) => s.getScheduledHabitsForDate);
  const [range, setRange] = useState<TabRange>('week');

  const days = range === 'week' ? getLast7Days() : getLast30Days();
  const { width: screenWidth } = useWindowDimensions();
  const chartViewportWidth = Math.max(260, screenWidth - 48);
  const chartWidth = range === 'week' ? chartViewportWidth : Math.max(chartViewportWidth, days.length * 22);
  const chartHeight = 170;
  const barWidth = Math.max(6, (chartWidth - 40) / days.length - 6);

  const dailyData = useMemo(() => {
    return days.map((dKey) => {
      const date = new Date(dKey + 'T00:00:00');
      const scheduled = getScheduledHabitsForDate(date);
      if (scheduled.length === 0) return { date: dKey, rate: 0, hasScheduledHabits: false };
      const completed = scheduled.filter((h) =>
        isCompletionComplete(
          h,
          completions.find((c) => c.habitId === h.id && c.date === dKey)
        )
      );
      return {
        date: dKey,
        rate: Math.round((completed.length / scheduled.length) * 100),
        hasScheduledHabits: true,
      };
    });
  }, [days, completions, getScheduledHabitsForDate]);

  const daysWithHabits = dailyData.filter((item) => item.hasScheduledHabits);
  const avgRate = daysWithHabits.length > 0
    ? Math.round(daysWithHabits.reduce((total, item) => total + item.rate, 0) / daysWithHabits.length)
    : 0;

  // 30-day heatmap data
  const heatmapDays = getLast30Days();
  const heatmapRates = heatmapDays.map((dKey) => {
    const date = new Date(dKey + 'T00:00:00');
    const scheduled = getScheduledHabitsForDate(date);
    if (scheduled.length === 0) return 0;
    const completed = scheduled.filter((h) =>
      isCompletionComplete(
        h,
        completions.find((c) => c.habitId === h.id && c.date === dKey)
      )
    );
    return completed.length / scheduled.length;
  });

  // Habit Performance ranking
  const habitPerformance = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archived && !h.paused);
    return activeHabits
      .map((h) => {
        const habitComps = getCompletedEntries(h, completions).filter((c) => days.includes(c.date));
        const scheduledDays = days.filter((dKey) => {
          const date = new Date(dKey + 'T00:00:00');
          const scheduled = getScheduledHabitsForDate(date);
          return scheduled.some((s) => s.id === h.id);
        });
        const rate = scheduledDays.length > 0 ? Math.round((habitComps.length / scheduledDays.length) * 100) : 0;
        const allComps = getCompletedEntries(h, completions);
        const streak = calculateStreak(allComps, h.id);
        const longest = calculateLongestStreak(allComps, h.id);
        return { habit: h, rate, streak, longest, count: habitComps.length };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [habits, completions, days, getScheduledHabitsForDate]);

  // Category distribution
  const categoryStats = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archived);
    const catMap: Record<string, number> = {};
    activeHabits.forEach((h) => {
      catMap[h.category] = (catMap[h.category] || 0) + 1;
    });
    return Object.entries(catMap).map(([category, count]) => ({
      category,
      count,
      percent: Math.round((count / Math.max(1, activeHabits.length)) * 100),
      color: (CATEGORY_COLORS as Record<string, string>)[category] || theme.primary,
    }));
  }, [habits, theme.primary]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 110 }}
      >
        <Text style={[styles.title, { color: theme.text }]}>Analytics & Insights</Text>

        {/* Overview Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.primaryDim }]}>
              <TrendingUp size={18} color={theme.primaryLight} />
            </View>
            <Text style={[styles.statVal, { color: theme.text }]}>{avgRate}%</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Average Rate</Text>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.streakDim }]}>
              <Flame size={18} color={theme.streak} />
            </View>
            <Text style={[styles.statVal, { color: theme.text }]}>{stats.currentStreak}d</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Current Streak</Text>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.xpDim }]}>
              <Trophy size={18} color={theme.xp} />
            </View>
            <Text style={[styles.statVal, { color: theme.text }]}>{stats.perfectDays}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Perfect Days</Text>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.accentDim }]}>
              <CheckCircle2 size={18} color={theme.accent} />
            </View>
            <Text style={[styles.statVal, { color: theme.text }]}>{stats.totalCompletions}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Done</Text>
          </Card>
        </View>

        {/* Chart Card */}
        <Card style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: theme.surface }}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Completion Trend</Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                {range === 'week' ? 'Past 7 Days Consistency' : 'Past 30 Days Consistency'}
              </Text>
            </View>

            {/* Range Toggle */}
            <View style={[styles.rangeToggle, { backgroundColor: theme.surfaceAlt }]}>
              <Pressable
                onPress={() => setRange('week')}
                style={[
                  styles.rangeBtn,
                  { backgroundColor: range === 'week' ? theme.surface : 'transparent' },
                ]}
              >
                <Text style={[styles.rangeText, { color: range === 'week' ? theme.primaryLight : theme.textMuted }]}>
                  7D
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setRange('month')}
                style={[
                  styles.rangeBtn,
                  { backgroundColor: range === 'month' ? theme.surface : 'transparent' },
                ]}
              >
                <Text style={[styles.rangeText, { color: range === 'month' ? theme.primaryLight : theme.textMuted }]}>
                  30D
                </Text>
              </Pressable>
            </View>
          </View>

          {/* SVG Chart */}
          <ScrollView horizontal={range === 'month'} showsHorizontalScrollIndicator={false}>
            <Svg width={chartWidth} height={chartHeight}>
              {/* Guidelines */}
              {[0, 25, 50, 75, 100].map((v) => {
                const y = chartHeight - (v / 100) * (chartHeight - 34) - 16;
                return (
                  <React.Fragment key={v}>
                    <Line
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke={theme.border}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <SvgText x="0" y={y - 4} fill={theme.textMuted} fontSize="9" fontFamily="Inter-Regular">
                      {v}%
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* Bars */}
              {dailyData.map((item, i) => {
                const barH = (item.rate / 100) * (chartHeight - 38);
                const x = i * (barWidth + 6) + 20;
                const y = chartHeight - barH - 16;
                const barColor = !item.hasScheduledHabits
                  ? theme.surfaceAlt
                  : item.rate === 100
                  ? theme.success
                  : item.rate >= 50
                  ? theme.primary
                  : theme.primaryLight;

                return (
                  <React.Fragment key={i}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(4, barH)}
                      rx={3}
                      fill={barColor}
                    />
                    <SvgText
                      x={x + barWidth / 2}
                      y={chartHeight - 2}
                      fill={theme.textMuted}
                      fontSize="9"
                      fontFamily="Inter-Medium"
                      textAnchor="middle"
                    >
                      {range === 'week'
                        ? item.date.slice(8)
                        : i % 5 === 0
                        ? item.date.slice(8)
                        : ''}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </ScrollView>
        </Card>

        {/* 30-Day Heatmap Card */}
        <Card style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: theme.surface }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>30-Day Activity Heatmap</Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary, marginBottom: 12 }]}>
            Consistency across your scheduled habits
          </Text>

          <View style={styles.heatmapGrid}>
            {heatmapRates.map((rate, idx) => {
              const bg =
                rate === 0
                  ? theme.surfaceAlt
                  : rate < 0.5
                  ? theme.primaryDim
                  : rate < 1
                  ? theme.primaryLight + '88'
                  : theme.primary;
              return <View key={idx} style={[styles.heatmapCell, { backgroundColor: bg }]} />;
            })}
          </View>
        </Card>

        {/* Habit Performance Leaderboard */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>Habit Consistency</Text>
        </View>

        <View style={{ gap: 8, marginBottom: spacing.lg }}>
          {habitPerformance.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ color: theme.textSecondary }}>No habits tracked in this period</Text>
            </Card>
          ) : (
            habitPerformance.map(({ habit, rate, streak }) => (
              <View
                key={habit.id}
                style={[styles.perfRow, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
              >
                <View style={[styles.perfIconWrap, { backgroundColor: habit.color + '22' }]}>
                  <Icon name={habit.icon} size={18} color={habit.color} />
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.perfName, { color: theme.text }]} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <Text style={[styles.perfRate, { color: theme.primaryLight }]}>{rate}%</Text>
                  </View>
                  <View style={[styles.perfTrack, { backgroundColor: theme.surfaceAlt }]}>
                    <View
                      style={[
                        styles.perfBar,
                        { width: `${rate}%`, backgroundColor: habit.color },
                      ]}
                    />
                  </View>
                </View>

                {streak > 0 && (
                  <View style={[styles.perfStreakBadge, { backgroundColor: theme.streakDim }]}>
                    <Flame size={12} color={theme.streak} />
                    <Text style={[styles.perfStreakText, { color: theme.streak }]}>{streak}d</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <Card style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: theme.surface }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Category Distribution</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {categoryStats.map((item) => (
                <View key={item.category} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.catName, { color: theme.text }]}>{item.category}</Text>
                    <Text style={[styles.catCount, { color: theme.textSecondary }]}>
                      {item.count} habits ({item.percent}%)
                    </Text>
                  </View>
                  <View style={[styles.perfTrack, { backgroundColor: theme.surfaceAlt }]}>
                    <View
                      style={[
                        styles.perfBar,
                        { width: `${item.percent}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
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
    paddingBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    padding: spacing.md,
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
  statVal: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  rangeToggle: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: radius.md,
  },
  rangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  rangeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  heatmapCell: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  sectionHeaderRow: {
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    fontWeight: '700',
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: 12,
  },
  perfIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perfName: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '600',
  },
  perfRate: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },
  perfTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  perfBar: {
    height: '100%',
    borderRadius: 3,
  },
  perfStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  perfStreakText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  catName: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  catCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
});
