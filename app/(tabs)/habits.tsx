import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Filter, CheckCircle2, PauseCircle, Archive } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HabitItem } from '@/components/HabitItem';
import { HabitDetailModal } from '@/components/HabitDetailModal';
import { HabitFormModal } from '@/components/HabitFormModal';
import { Habit, CATEGORIES, HabitCategory } from '@/types';
import {
  calculateStreak,
  getCompletedEntries,
  isCompletionComplete,
  todayKey,
} from '@/utils/date';
import { spacing, radius } from '@/theme/tokens';

type StatusFilter = 'active' | 'paused' | 'archived';

export default function HabitsScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const logCompletion = useHabitStore((s) => s.logCompletion);
  const removeCompletion = useHabitStore((s) => s.removeCompletion);
  const getCompletionForHabitOnDate = useHabitStore((s) => s.getCompletionForHabitOnDate);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [inspectHabit, setInspectHabit] = useState<Habit | undefined>();
  const [filterCategory, setFilterCategory] = useState<HabitCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  const dKey = todayKey();

  const filteredHabits = useMemo(() => {
    return habits
      .filter((h) => {
        if (statusFilter === 'active') return !h.archived && !h.paused;
        if (statusFilter === 'paused') return !h.archived && h.paused;
        if (statusFilter === 'archived') return h.archived;
        return true;
      })
      .filter((h) => filterCategory === 'all' || h.category === filterCategory)
      .sort((a, b) => a.order - b.order);
  }, [habits, filterCategory, statusFilter]);

  const activeCount = habits.filter((h) => !h.archived && !h.paused).length;
  const pausedCount = habits.filter((h) => !h.archived && h.paused).length;
  const archivedCount = habits.filter((h) => h.archived).length;

  const handleSave = async (data: Omit<Habit, 'id' | 'createdAt' | 'order'>) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
    } else {
      await addHabit(data);
    }
    setEditingHabit(undefined);
  };

  const handleToggle = (habit: Habit) => {
    const comp = getCompletionForHabitOnDate(habit.id, dKey);
    if (habit.type === 'boolean') {
      toggleCompletion(habit.id);
    } else {
      if (isCompletionComplete(habit, comp)) {
        removeCompletion(habit.id, dKey);
        return;
      }
      const next = comp
        ? comp.value + Math.max(1, Math.round(habit.target * 0.15))
        : Math.max(1, Math.round(habit.target * 0.25));
      logCompletion(habit.id, Math.min(next, habit.target));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Habit Library</Text>
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
            {activeCount} active · {habits.length} total habits
          </Text>
        </View>

        <Pressable
          onPress={() => {
            setEditingHabit(undefined);
            setShowForm(true);
          }}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add new habit"
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Status Segment Control (Active / Paused / Archived) */}
      <View style={[styles.statusSegment, { backgroundColor: theme.surfaceAlt }]}>
        <Pressable
          onPress={() => setStatusFilter('active')}
          style={[
            styles.statusBtn,
            { backgroundColor: statusFilter === 'active' ? theme.surface : 'transparent' },
          ]}
        >
          <CheckCircle2
            size={14}
            color={statusFilter === 'active' ? theme.primaryLight : theme.textMuted}
          />
          <Text
            style={[
              styles.statusText,
              { color: statusFilter === 'active' ? theme.text : theme.textMuted },
            ]}
          >
            Active ({activeCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setStatusFilter('paused')}
          style={[
            styles.statusBtn,
            { backgroundColor: statusFilter === 'paused' ? theme.surface : 'transparent' },
          ]}
        >
          <PauseCircle
            size={14}
            color={statusFilter === 'paused' ? theme.warning : theme.textMuted}
          />
          <Text
            style={[
              styles.statusText,
              { color: statusFilter === 'paused' ? theme.text : theme.textMuted },
            ]}
          >
            Paused ({pausedCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setStatusFilter('archived')}
          style={[
            styles.statusBtn,
            { backgroundColor: statusFilter === 'archived' ? theme.surface : 'transparent' },
          ]}
        >
          <Archive
            size={14}
            color={statusFilter === 'archived' ? theme.textSecondary : theme.textMuted}
          />
          <Text
            style={[
              styles.statusText,
              { color: statusFilter === 'archived' ? theme.text : theme.textMuted },
            ]}
          >
            Archived ({archivedCount})
          </Text>
        </Pressable>
      </View>

      {/* Category Filter Chips */}
      <View style={{ marginBottom: spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <Pressable
            onPress={() => setFilterCategory('all')}
            style={[
              styles.chip,
              {
                backgroundColor: filterCategory === 'all' ? theme.primaryDim : theme.surfaceAlt,
                borderColor: filterCategory === 'all' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: filterCategory === 'all' ? theme.primaryLight : theme.textSecondary },
              ]}
            >
              All Categories
            </Text>
          </Pressable>

          {CATEGORIES.map((cat) => {
            const isSelected = filterCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setFilterCategory(cat)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? theme.primaryDim : theme.surfaceAlt,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? theme.primaryLight : theme.textSecondary },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Habits List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 110 }}
      >
        {filteredHabits.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 36, marginTop: spacing.md, backgroundColor: theme.surface }}>
            <Filter size={32} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Habits Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {filterCategory !== 'all'
                ? `No habits under "${filterCategory}" in ${statusFilter}.`
                : `You don't have any ${statusFilter} habits yet.`}
            </Text>
            <Button
              title="Add a Habit"
              variant="primary"
              size="md"
              onPress={() => {
                setEditingHabit(undefined);
                setShowForm(true);
              }}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : (
          <View style={{ gap: 10, marginTop: spacing.xs }}>
            {filteredHabits.map((habit, index) => {
              const comp = getCompletionForHabitOnDate(habit.id, dKey);
              const streak = calculateStreak(getCompletedEntries(habit, completions), habit.id);
              return (
                <Animated.View
                  key={habit.id}
                  entering={FadeInDown.delay(index * 35).duration(300)}
                >
                  <HabitItem
                    habit={habit}
                    completion={comp}
                    streak={streak}
                    reminderTime={habit.reminders[0]?.time}
                    onToggle={() => handleToggle(habit)}
                    onPress={() => setInspectHabit(habit)}
                  />
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Detail / Inspector Modal */}
      <HabitDetailModal
        habit={inspectHabit}
        visible={!!inspectHabit}
        onClose={() => setInspectHabit(undefined)}
        onEdit={(habit) => {
          setInspectHabit(undefined);
          setEditingHabit(habit);
          setShowForm(true);
        }}
      />

      {/* Create / Edit Form Modal */}
      {showForm && (
        <HabitFormModal
          initialHabit={editingHabit}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    fontWeight: '700',
  },
  subTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  statusSegment: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    padding: 3,
    borderRadius: radius.md,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryScrollContent: {
    paddingHorizontal: spacing.xl,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '600',
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
    paddingHorizontal: spacing.xl,
  },
});
