import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Archive, Pause, Play, Trash2, Edit3, MoreVertical, Filter } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { HabitFormModal } from '@/components/HabitFormModal';
import { HabitItem } from '@/components/HabitItem';
import { Icon } from '@/components/IconHelper';
import { Habit, CATEGORIES, HabitCategory, CATEGORY_COLORS } from '@/types';
import { calculateStreak } from '@/utils/date';

export default function HabitsScreen() {
  const { theme } = useAppTheme();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const pauseHabit = useHabitStore((s) => s.pauseHabit);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const logCompletion = useHabitStore((s) => s.logCompletion);
  const getCompletionForHabitOnDate = useHabitStore((s) => s.getCompletionForHabitOnDate);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [menuHabit, setMenuHabit] = useState<Habit | undefined>();
  const [filterCategory, setFilterCategory] = useState<HabitCategory | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);

  const filteredHabits = useMemo(() => {
    return habits
      .filter((h) => (showArchived ? true : !h.archived))
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
    const comp = getCompletionForHabitOnDate(habit.id, new Date().toISOString().slice(0, 10));
    if (habit.type === 'boolean') {
      toggleCompletion(habit.id);
    } else {
      const next = comp ? comp.value + Math.max(1, Math.round(habit.target * 0.1)) : Math.max(1, Math.round(habit.target * 0.25));
      logCompletion(habit.id, Math.min(next, habit.target));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>My Habits</Text>
        <Pressable
          onPress={() => { setEditingHabit(undefined); setShowForm(true); }}
          style={(state) => ({ ...styles.addBtn, backgroundColor: theme.primary, opacity: state.pressed ? 0.85 : 1 })}
        >
          <Plus size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}>
        <Pressable
          onPress={() => setFilterCategory('all')}
          style={[styles.chip, { backgroundColor: filterCategory === 'all' ? theme.primary : theme.inputBg, borderColor: filterCategory === 'all' ? theme.primary : theme.border }]}
        >
          <Text style={[styles.chipText, { color: filterCategory === 'all' ? '#fff' : theme.textSecondary }]}>All</Text>
        </Pressable>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setFilterCategory(cat)}
            style={[styles.chip, { backgroundColor: filterCategory === cat ? CATEGORY_COLORS[cat] + '22' : theme.inputBg, borderColor: filterCategory === cat ? CATEGORY_COLORS[cat] : theme.border }]}
          >
            <Text style={[styles.chipText, { color: filterCategory === cat ? CATEGORY_COLORS[cat] : theme.textSecondary }]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Toggle archived */}
      <Pressable
        onPress={() => setShowArchived(!showArchived)}
        style={{ paddingHorizontal: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <Archive size={16} color={theme.textSecondary} />
        <Text style={{ color: theme.textSecondary, fontFamily: 'Inter-Medium', fontSize: 13 }}>{showArchived ? 'Showing archived' : 'Show archived'}</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 10 }}>
        {filteredHabits.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 40, marginTop: 20 }}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No habits yet</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Tap the + button to create your first habit</Text>
            <Button title="Browse Library" variant="outline" onPress={() => { setEditingHabit(undefined); setShowForm(true); }} style={{ marginTop: 16 }} />
          </Card>
        ) : (
          filteredHabits.map((habit, i) => {
            const streak = calculateStreak(completions, habit.id);
            const comp = getCompletionForHabitOnDate(habit.id, new Date().toISOString().slice(0, 10));
            return (
              <Animated.View key={habit.id} entering={FadeInDown.delay(i * 50).duration(400)}>
                <View>
                  <HabitItem
                    habit={habit}
                    completion={comp}
                    onToggle={() => handleToggle(habit)}
                    onPress={() => setMenuHabit(habit)}
                  />
                  {(streak > 0 || habit.reminders.length > 0) && (
                    <View style={styles.metaRow}>
                      {streak > 0 && (
                        <View style={styles.metaItem}>
                          <Text style={{ color: theme.warning, fontSize: 11, fontFamily: 'Inter-Medium' }}>🔥 {streak}d streak</Text>
                        </View>
                      )}
                      {habit.reminders.length > 0 && (
                        <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: 'Inter-Regular' }}>{habit.reminders.filter(r => r.enabled).length} reminders</Text>
                      )}
                      {habit.paused && <Text style={{ color: theme.warning, fontSize: 11 }}>Paused</Text>}
                      {habit.archived && <Text style={{ color: theme.textMuted, fontSize: 11 }}>Archived</Text>}
                    </View>
                  )}
                </View>
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
            <MenuRow icon={<Trash2 size={20} color={theme.error} />} label="Delete Habit" color={theme.error} onPress={() => { deleteHabit(menuHabit.id); setMenuHabit(undefined); }} bg={theme.inputBg} />
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    fontWeight: '700',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '500',
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
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  metaItem: {},
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
