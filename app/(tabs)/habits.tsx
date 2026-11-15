import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Plus, Archive, Pause, Play, Trash2, Edit3 } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { HabitFormModal } from '@/components/HabitFormModal';
import { HabitItem } from '@/components/HabitItem';
import { Icon } from '@/components/IconHelper';
import { Habit, CATEGORIES, HabitCategory } from '@/types';
import { calculateStreak, getCompletedEntries, isCompletionComplete, todayKey } from '@/utils/date';
import { spacing, typeScale } from '@/theme/tokens';

export default function HabitsScreen() {
  const { theme } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const pauseHabit = useHabitStore((s) => s.pauseHabit);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const logCompletion = useHabitStore((s) => s.logCompletion);
  const removeCompletion = useHabitStore((s) => s.removeCompletion);
  const getCompletionForHabitOnDate = useHabitStore((s) => s.getCompletionForHabitOnDate);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [menuHabit, setMenuHabit] = useState<Habit | undefined>();
  const [filterCategory, setFilterCategory] = useState<HabitCategory | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);

  const filteredHabits = useMemo(() => {
    return habits
      .filter((h) => (showArchived ? h.archived : !h.archived))
      .filter((h) => filterCategory === 'all' || h.category === filterCategory)
      .sort((a, b) => a.order - b.order);
  }, [habits, filterCategory, showArchived]);

  const handleSave = async (data: Omit<Habit, 'id' | 'createdAt' | 'order'>) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
    } else {
      await addHabit(data);
    }
    setEditingHabit(undefined);
  };

  const handleToggle = (habit: Habit) => {
    const date = todayKey();
    const comp = getCompletionForHabitOnDate(habit.id, date);
    if (habit.type === 'boolean') {
      toggleCompletion(habit.id);
    } else {
      if (isCompletionComplete(habit, comp)) {
        removeCompletion(habit.id, date);
        return;
      }
      const next = comp ? comp.value + Math.max(1, Math.round(habit.target * 0.1)) : Math.max(1, Math.round(habit.target * 0.25));
      logCompletion(habit.id, Math.min(next, habit.target));
    }
  };

  const confirmDelete = (habit: Habit) => {
    Alert.alert(
      'Delete habit?',
      `"${habit.name}" and its completion history will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteHabit(habit.id);
            setMenuHabit(undefined);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>My Habits</Text>
        <Pressable
          onPress={() => { setEditingHabit(undefined); setShowForm(true); }}
          style={(state) => ({ ...styles.addBtn, backgroundColor: theme.primary, opacity: state.pressed ? 0.85 : 1 })}
          accessibilityRole="button"
          accessibilityLabel="Create habit"
        >
          <Plus size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
        accessibilityLabel="Filter habits by category"
      >
        <Pressable
          onPress={() => setFilterCategory('all')}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: filterCategory === 'all' ? theme.primaryDim : theme.inputBg,
              borderColor: filterCategory === 'all' ? theme.primary : theme.border,
              opacity: pressed ? 0.76 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: filterCategory === 'all' }}
        >
          {filterCategory === 'all' && !reduceMotion ? (
            <Animated.Text entering={FadeIn.duration(150)} style={[styles.chipText, { color: theme.primary }]}>All</Animated.Text>
          ) : (
            <Text style={[styles.chipText, { color: filterCategory === 'all' ? theme.primary : theme.textSecondary }]}>All</Text>
          )}
        </Pressable>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setFilterCategory(cat)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: filterCategory === cat ? theme.primaryDim : theme.inputBg,
                borderColor: filterCategory === cat ? theme.primary : theme.border,
                opacity: pressed ? 0.76 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: filterCategory === cat }}
          >
            {filterCategory === cat && !reduceMotion ? (
              <Animated.Text entering={FadeIn.duration(150)} style={[styles.chipText, { color: theme.primary }]}>{cat}</Animated.Text>
            ) : (
              <Text style={[styles.chipText, { color: filterCategory === cat ? theme.primary : theme.textSecondary }]}>{cat}</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Toggle archived */}
      <Pressable
        onPress={() => setShowArchived(!showArchived)}
        style={({ pressed }) => [styles.archiveToggle, { opacity: pressed ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={showArchived ? 'Hide archived habits' : 'Show archived habits'}
        accessibilityState={{ selected: showArchived }}
      >
        <Archive size={16} color={theme.textSecondary} />
        <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Medium', fontSize: 13 }}>{showArchived ? 'Showing archived' : 'Show archived'}</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.habitList}>
        {filteredHabits.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 40, marginTop: 20 }}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {habits.length === 0
                ? 'Start with one small habit'
                : showArchived && !habits.some((habit) => habit.archived)
                ? 'No archived habits'
                : !showArchived && !habits.some((habit) => !habit.archived)
                ? 'All habits are archived'
                : 'No habits in this category'}
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              {habits.length === 0 ? 'Build a routine that fits your day.' : 'Try a different filter or create a new habit.'}
            </Text>
            <Button title="Create a habit" variant="outline" onPress={() => { setEditingHabit(undefined); setShowForm(true); }} style={{ marginTop: 16 }} />
          </Card>
        ) : (
          filteredHabits.map((habit, i) => {
            const streak = calculateStreak(getCompletedEntries(habit, completions), habit.id);
            const comp = getCompletionForHabitOnDate(habit.id, todayKey());
            const enabledReminders = habit.reminders.filter((reminder) => reminder.enabled);
            return (
              <Animated.View key={habit.id} entering={reduceMotion ? undefined : FadeInDown.delay(Math.min(i, 6) * 35).duration(220)}>
                  <HabitItem
                    habit={habit}
                    completion={comp}
                    onToggle={() => handleToggle(habit)}
                    onPress={() => setMenuHabit(habit)}
                    readOnly={showArchived || habit.paused}
                    dense
                    animateProgress
                    streak={streak}
                    reminderTime={enabledReminders[0]?.time}
                    reminderCount={enabledReminders.length}
                  />
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      {showForm && (
        <HabitFormModal
          initialHabit={editingHabit}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingHabit(undefined); }}
        />
      )}

      {/* Habit Menu */}
      <ModalSheet visible={!!menuHabit} onClose={() => setMenuHabit(undefined)} title={menuHabit?.name}>
        {menuHabit && (
          <View style={{ gap: 8 }}>
            <View style={[styles.menuHabitInfo, { backgroundColor: theme.inputBg }]}>
              <View style={[styles.menuIcon, { backgroundColor: menuHabit.color + '22' }]}>
                <Icon name={menuHabit.icon} size={24} color={menuHabit.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuName, { color: theme.text }]}>{menuHabit.name}</Text>
                <Text style={[styles.menuDesc, { color: theme.textSecondary }]}>{menuHabit.description}</Text>
                <Text style={[styles.menuCat, { color: menuHabit.color }]}>{menuHabit.category} · {menuHabit.type}</Text>
              </View>
            </View>

            <MenuRow icon={<Edit3 size={20} color={theme.primary} />} label="Edit Habit" color={theme.text} onPress={() => { setEditingHabit(menuHabit); setShowForm(true); setMenuHabit(undefined); }} bg={theme.inputBg} />
            <MenuRow icon={menuHabit.paused ? <Play size={20} color={theme.success} /> : <Pause size={20} color={theme.warning} />} label={menuHabit.paused ? 'Resume Habit' : 'Pause Habit'} color={theme.text} onPress={async () => { await pauseHabit(menuHabit.id, !menuHabit.paused); setMenuHabit(undefined); }} bg={theme.inputBg} />
            <MenuRow icon={<Archive size={20} color={theme.textSecondary} />} label={menuHabit.archived ? 'Unarchive' : 'Archive'} color={theme.text} onPress={async () => { await archiveHabit(menuHabit.id, !menuHabit.archived); setMenuHabit(undefined); }} bg={theme.inputBg} />
            <MenuRow icon={<Trash2 size={20} color={theme.error} />} label="Delete Habit" color={theme.error} onPress={() => confirmDelete(menuHabit)} bg={theme.inputBg} />
          </View>
        )}
      </ModalSheet>
    </SafeAreaView>
  );
}

function MenuRow({ icon, label, color, onPress, bg }: { icon: React.ReactNode; label: string; color: string; onPress: () => void; bg: string }) {
  return (
    <Pressable onPress={onPress} style={(state) => ({ opacity: state.pressed ? 0.7 : 1 })}>
      <View style={[styles.menuRow, { backgroundColor: bg }]}>
        {icon}
        <Text style={[styles.menuRowText, { color }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: typeScale.screenTitle,
    fontWeight: '700',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    height: 38,
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'visible',
  },
  chipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '500',
    includeFontPadding: false,
    flexShrink: 0,
    textAlign: 'center',
  },
  archiveToggle: {
    minHeight: 44,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  habitList: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 112,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  menuHabitInfo: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuName: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    fontWeight: '700',
  },
  menuDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  menuCat: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
  },
  menuRowText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    fontWeight: '500',
  },
});
