import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Rect, Line, Text as SvgText, Path } from 'react-native-svg';
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
  dateKey,
  subDays,
} from '@/utils/date';

type TabRange = 'week' | 'month';

export default function InsightsScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const stats = useHabitStore((s) => s.stats);
  const getScheduledHabitsForDate = useHabitStore((s) => s.getScheduledHabitsForDate);
  const [range, setRange] = useState<TabRange>('week');

  const days = range === 'week' ? getLast7Days() : getLast30Days();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 56;
  const chartHeight = 180;
  const barWidth = chartWidth / days.length - 6;

  const dailyRates = useMemo(() => {
    return days.map((dKey) => {
      const date = new Date(dKey + 'T00:00:00');
      const scheduled = getScheduledHabitsForDate(date);
      if (scheduled.length === 0) return 0;
      const completed = completions.filter((c) => c.date === dKey && scheduled.some((h) => h.id === c.habitId));
      return Math.round((completed.length / scheduled.length) * 100);
    });
  }, [days, completions, getScheduledHabitsForDate]);

  const avgRate = Math.round(dailyRates.reduce((a, b) => a + b, 0) / days.length);
  const bestDay = Math.max(...dailyRates);
  const totalInRange = completions.filter((c) => days.includes(c.date)).length;

  // Heatmap data - 30 days
  const heatmapDays = getLast30Days();
  const heatmapColors = heatmapDays.map((dKey) => {
    const date = new Date(dKey + 'T00:00:00');
    const scheduled = getScheduledHabitsForDate(date);
    if (scheduled.length === 0) return 0;
    const completed = completions.filter((c) => c.date === dKey && scheduled.some((h) => h.id === c.habitId));
    return completed.length / scheduled.length;
  });

  // Habit performance
  const habitPerformance = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archived);
    return activeHabits
      .map((h) => {
        const habitComps = completions.filter((c) => c.habitId === h.id && days.includes(c.date));
        const scheduledDays = days.filter((dKey) => {
          const date = new Date(dKey + 'T00:00:00');
          const scheduled = getScheduledHabitsForDate(date);
          return scheduled.some((s) => s.id === h.id);
        });
        const rate = scheduledDays.length > 0 ? Math.round((habitComps.length / scheduledDays.length) * 100) : 0;
        const streak = calculateStreak(completions, h.id);
        const longest = calculateLongestStreak(completions, h.id);
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
              <Rect x={x} y={y} width={barWidth} height={barH} rx={4} fill={rate >= 67 ? theme.success : rate >= 33 ? theme.warning : theme.error} opacity={0.85} />
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
    const cellSize = (chartWidth - 20) / 15;
    const rows = 3;
    return (
      <Svg width={chartWidth} height={rows * (cellSize + 4) + 10}>
        {heatmapColors.map((rate, i) => {
          const col = i % 15;
          const row = Math.floor(i / 15);
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <Text style={[styles.title, { color: theme.text }]}>Insights</Text>

        {/* Range selector */}
        <View style={[styles.rangeRow, { backgroundColor: theme.inputBg }]}>
          {(['week', 'month'] as TabRange[]).map((r) => (
            <View
              key={r}
              style={[
                styles.rangeBtn,
                { backgroundColor: range === r ? theme.primary : 'transparent' },
              ]}
            >
              <Text
                style={[styles.rangeText, { color: range === r ? '#fff' : theme.textSecondary }]}
                onPress={() => setRange(r)}
              >
                {r === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </View>
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
          <View style={{ alignItems: 'center', marginTop: 12 }}>{renderChart()}</View>
        </Card>

        {/* Consistency heatmap */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Consistency Heatmap</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Last 30 days activity</Text>
          <View style={{ alignItems: 'center', marginTop: 12 }}>{renderHeatmap()}</View>
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
        <Card gradient style={{ marginBottom: 16, padding: 20 }}>
          <View style={styles.perfectRow}>
            <TrendingUp size={28} color="#fff" />
            <View>
              <Text style={styles.perfectValue}>{stats.perfectDays}</Text>
              <Text style={styles.perfectLabel}>Perfect Days</Text>
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
    fontSize: 26,
    fontWeight: '700',
    paddingTop: 12,
    paddingBottom: 16,
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
    color: '#fff',
  },
  perfectLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
});
