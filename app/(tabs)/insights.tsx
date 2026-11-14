import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Rect, Line, Text as SvgText } from 'react-native-svg';
import { Flame, Trophy, Target, CheckCircle2, TrendingUp } from 'lucide-react-native';
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
import { spacing, typeScale } from '@/theme/tokens';

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
  const chartViewportWidth = Math.max(220, screenWidth - 80);
  const chartWidth = range === 'week' ? chartViewportWidth : Math.max(chartViewportWidth, days.length * 24);
  const chartHeight = 180;
  const barWidth = Math.max(4, (chartWidth - 20) / days.length - 6);

  const dailyData = useMemo(() => {
    return days.map((dKey) => {
      const date = new Date(dKey + 'T00:00:00');
      const scheduled = getScheduledHabitsForDate(date);
      if (scheduled.length === 0) return { date: dKey, rate: 0, hasScheduledHabits: false };
      const completed = scheduled.filter((habit) =>
        isCompletionComplete(
          habit,
          completions.find((completion) => completion.habitId === habit.id && completion.date === dKey)
        )
      );
      return {
        date: dKey,
        rate: Math.round((completed.length / scheduled.length) * 100),
        hasScheduledHabits: true,
      };
    });
  }, [days, completions, getScheduledHabitsForDate]);

  const dailyRates = dailyData.map((item) => item.rate);
  const daysWithHabits = dailyData.filter((item) => item.hasScheduledHabits);
  const avgRate = daysWithHabits.length > 0
    ? Math.round(daysWithHabits.reduce((total, item) => total + item.rate, 0) / daysWithHabits.length)
    : 0;
  const totalInRange = dailyData.reduce((total, item) => {
    if (!item.hasScheduledHabits) return total;
    const scheduled = getScheduledHabitsForDate(new Date(item.date + 'T00:00:00'));
    return total + scheduled.filter((habit) =>
      isCompletionComplete(
        habit,
        completions.find((completion) => completion.habitId === habit.id && completion.date === item.date)
      )
    ).length;
  }, 0);

  // Heatmap data - 30 days
  const heatmapDays = getLast30Days();
  const heatmapRates = heatmapDays.map((dKey) => {
    const date = new Date(dKey + 'T00:00:00');
    const scheduled = getScheduledHabitsForDate(date);
    if (scheduled.length === 0) return 0;
    const completed = scheduled.filter((habit) =>
      isCompletionComplete(
        habit,
        completions.find((completion) => completion.habitId === habit.id && completion.date === dKey)
      )
    );
    return completed.length / scheduled.length;
  });

  // Habit performance
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
        const completedEntries = getCompletedEntries(h, completions);
        const streak = calculateStreak(completedEntries, h.id);
        const longest = calculateLongestStreak(completedEntries, h.id);
        return { habit: h, rate, streak, longest, completions: habitComps.length };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [habits, completions, days, getScheduledHabitsForDate]);

  const renderChart = () => {
    const maxVal = 100;
    return (
      <Svg width={chartWidth} height={chartHeight}>
        {[0, 25, 50, 75, 100].map((v) => {
          const y = chartHeight - (v / maxVal) * (chartHeight - 30) - 15;
          return (
            <React.Fragment key={v}>
              <Line x1="0" y1={y} x2={chartWidth} y2={y} stroke={theme.border} strokeWidth="1" strokeDasharray="3,3" />
              <SvgText x="0" y={y - 4} fill={theme.textMuted} fontSize="9" fontFamily="Inter-Regular">{v}%</SvgText>
            </React.Fragment>
          );
        })}
        {dailyRates.map((rate, i) => {
          const barH = (rate / maxVal) * (chartHeight - 35);
          const x = i * (barWidth + 6) + 15;
          const y = chartHeight - barH - 15;
          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={!dailyData[i].hasScheduledHabits ? theme.surfaceAlt : rate >= 67 ? theme.success : rate >= 33 ? theme.warning : theme.primary}
                opacity={0.9}
              />
              <SvgText x={x + barWidth / 2} y={chartHeight - 3} fill={theme.textMuted} fontSize="8" fontFamily="Inter-Regular" textAnchor="middle">
                {range === 'week' ? days[i].slice(5) : (i % 5 === 0 ? days[i].slice(5) : '')}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    );
  };

  const renderHeatmap = () => {
    const columns = 7;
    const cellSize = Math.min(20, (chartViewportWidth - 40) / columns);
    const rows = Math.ceil(heatmapRates.length / columns);
    return (
      <Svg width={chartViewportWidth} height={rows * (cellSize + 4) + 10}>
        {heatmapRates.map((rate, i) => {
          const col = i % columns;
          const row = Math.floor(i / columns);
          const x = col * (cellSize + 4) + 10;
          const y = row * (cellSize + 4) + 5;
          const color = rate === 0 ? theme.surfaceAlt : rate <= 0.33 ? theme.primary + '40' : rate <= 0.66 ? theme.primary + '80' : theme.primary;
          return <Rect key={i} x={x} y={y} width={cellSize} height={cellSize} rx={4} fill={color} />;
        })}
      </Svg>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}>
        <Text style={[styles.title, { color: theme.text }]}>Insights</Text>

        {/* Range selector */}
        <View style={[styles.rangeRow, { backgroundColor: theme.inputBg }]}>
          {(['week', 'month'] as TabRange[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[
                styles.rangeBtn,
                { backgroundColor: range === r ? theme.primary : 'transparent' },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: range === r }}
            >
              <Text style={[styles.rangeText, { color: range === r ? '#fff' : theme.textSecondary }]}>
                {r === 'week' ? '7 Days' : '30 Days'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stat cards */}
        <View style={styles.statGrid}>
          <StatCard icon={<Flame size={20} color={theme.warning} />} value={`${stats.currentStreak}`} label="Current Streak" color={theme.warning} theme={theme} />
          <StatCard icon={<Trophy size={20} color={theme.primary} />} value={`${stats.longestStreak}`} label="Longest Streak" color={theme.primary} theme={theme} />
          <StatCard icon={<Target size={20} color={theme.accent} />} value={`${avgRate}%`} label="Avg Completion" color={theme.accent} theme={theme} />
          <StatCard icon={<CheckCircle2 size={20} color={theme.success} />} value={`${totalInRange}`} label="Completions" color={theme.success} theme={theme} />
        </View>

        {/* Completion chart */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Completion Rate</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>{range === 'week' ? 'Last 7 days' : 'Last 30 days'}</Text>
          {daysWithHabits.length === 0 ? (
            <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>Add an active habit to see your progress.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={range === 'month'} style={{ marginTop: 12 }}>
              {renderChart()}
            </ScrollView>
          )}
        </Card>

        {/* Consistency heatmap */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Consistency Heatmap</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Last 30 days activity</Text>
          {habits.some((habit) => !habit.archived && !habit.paused) ? (
            <View style={{ alignItems: 'center', marginTop: 12 }}>{renderHeatmap()}</View>
          ) : (
            <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>Your activity will appear here once you start tracking.</Text>
          )}
          <View style={styles.heatLegend}>
            <Text style={[styles.heatLegendText, { color: theme.textMuted }]}>Less</Text>
            {[theme.surfaceAlt, theme.primary + '40', theme.primary + '80', theme.primary].map((c, i) => (
              <View key={i} style={[styles.heatCell, { backgroundColor: c, borderColor: theme.border, borderWidth: 0.5 }]} />
            ))}
            <Text style={[styles.heatLegendText, { color: theme.textMuted }]}>More</Text>
          </View>
        </Card>

        {/* Habit performance */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Habit Performance</Text>
        <View style={{ gap: 8, marginBottom: 16 }}>
          {habitPerformance.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No data yet</Text>
            </Card>
          ) : (
            habitPerformance.map((perf) => (
              <Card key={perf.habit.id} style={{ padding: 14 }}>
                <View style={styles.perfRow}>
                  <View style={[styles.perfIcon, { backgroundColor: perf.habit.color + '22' }]}>
                    <Icon name={perf.habit.icon} size={18} color={perf.habit.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.perfName, { color: theme.text }]} numberOfLines={1}>{perf.habit.name}</Text>
                    <Text style={[styles.perfStreak, { color: theme.textSecondary }]}>🔥 {perf.streak}d · Best: {perf.longest}d</Text>
                  </View>
                  <Text style={[styles.perfRate, { color: perf.rate >= 67 ? theme.success : perf.rate >= 33 ? theme.warning : theme.error }]}>{perf.rate}%</Text>
                </View>
                <View style={[styles.perfBar, { backgroundColor: theme.surfaceAlt }]}>
                  <View style={[styles.perfFill, { width: `${perf.rate}%`, backgroundColor: perf.habit.color }]} />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Perfect days */}
        <Card style={{ marginBottom: 16, padding: 20 }}>
          <View style={styles.perfectRow}>
            <TrendingUp size={28} color={theme.success} />
            <View>
              <Text style={[styles.perfectValue, { color: theme.text }]}>{stats.perfectDays}</Text>
              <Text style={[styles.perfectLabel, { color: theme.textSecondary }]}>Perfect Days</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, color, theme }: { icon: React.ReactNode; value: string; label: string; color: string; theme: any }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>{icon}</View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
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
  emptyChartText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
    marginBottom: 8,
  },
  rangeRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  rangeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '500',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  cardTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 12,
  },
  heatLegendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  heatCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
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
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  perfIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perfName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '500',
  },
  perfStreak: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  perfRate: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  perfBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  perfFill: {
    height: '100%',
    borderRadius: 3,
  },
  perfectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  perfectValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    fontWeight: '700',
  },
  perfectLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});
