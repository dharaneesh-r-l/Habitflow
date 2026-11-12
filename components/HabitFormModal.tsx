import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Switch, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/theme/ThemeContext';
import { Habit, HabitCategory, HabitType, Frequency, DayOfWeek, RoutinePeriod, Reminder, CATEGORIES, CATEGORY_COLORS } from '@/types';
import { HABIT_LIBRARY } from '@/data/habitLibrary';
import { Icon } from '@/components/IconHelper';
import { uid } from '@/utils/date';
import { Plus, Clock, Bell, Trash2, X, Check } from 'lucide-react-native';

interface HabitFormProps {
  initialHabit?: Habit;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'order'>) => void;
  onClose: () => void;
}

const HABIT_TYPES: { value: HabitType; label: string }[] = [
  { value: 'boolean', label: 'Yes / No' },
  { value: 'count', label: 'Count' },
  { value: 'duration', label: 'Duration' },
  { value: 'target', label: 'Target' },
];

const ROUTINE_OPTIONS: (RoutinePeriod | null)[] = [null, 'morning', 'afternoon', 'evening', 'night'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ICON_CHOICES = [
  'Footprints', 'Dumbbell', 'Flower2', 'Activity', 'Droplets', 'Moon', 'Pill', 'Brain',
  'Wind', 'BookOpen', 'Languages', 'Code', 'PlayCircle', 'PenLine', 'ClipboardList',
  'Users', 'TrendingUp', 'FileText', 'Inbox', 'Target', 'CheckSquare', 'Zap', 'Clock',
  'Mail', 'Heart', 'Sparkles', 'Smartphone', 'Smile', 'Mood', 'Coffee', 'Apple', 'Ban',
  'ChefHat', 'Scale', 'Receipt', 'PiggyBank', 'Wallet', 'LineChart', 'Scissors', 'Trash2',
];

export function HabitFormModal({ initialHabit, onSave, onClose }: HabitFormProps) {
  const { theme } = useAppTheme();
  const [name, setName] = useState(initialHabit?.name || '');
  const [description, setDescription] = useState(initialHabit?.description || '');
  const [category, setCategory] = useState<HabitCategory>(initialHabit?.category || 'Fitness');
  const [type, setType] = useState<HabitType>(initialHabit?.type || 'boolean');
  const [frequency, setFrequency] = useState<Frequency>(initialHabit?.frequency || 'daily');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(initialHabit?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
  const [target, setTarget] = useState(String(initialHabit?.target || 1));
  const [unit, setUnit] = useState(initialHabit?.unit || 'done');
  const [color, setColor] = useState(initialHabit?.color || '#7C5CFC');
  const [icon, setIcon] = useState(initialHabit?.icon || 'Target');
  const [routine, setRoutine] = useState<RoutinePeriod | null>(initialHabit?.routine || null);
  const [reminders, setReminders] = useState<Reminder[]>(initialHabit?.reminders || []);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addReminder = () => {
    setReminders([...reminders, { id: uid(), time: '08:00', days: [], enabled: true, title: name || 'Habit', message: `Time for ${name}`, sound: true }]);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const applyLibraryHabit = (lib: typeof HABIT_LIBRARY[0]) => {
    setName(lib.name);
    setDescription(lib.description);
    setCategory(lib.category);
    setType(lib.type);
    setFrequency(lib.frequency);
    setDaysOfWeek(lib.daysOfWeek as DayOfWeek[]);
    setTarget(String(lib.target));
    setUnit(lib.unit);
    setColor(lib.color);
    setIcon(lib.icon);
    setRoutine(lib.routine);
    setReminders(lib.suggestedReminders.map((r) => ({ id: uid(), time: r.time, days: lib.daysOfWeek as DayOfWeek[], enabled: true, title: lib.name, message: r.message, sound: true })));
    setShowLibrary(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      category,
      type,
      frequency,
      daysOfWeek: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : daysOfWeek,
      target: parseInt(target) || 1,
      unit: unit.trim() || 'done',
      color,
      icon,
      routine,
      startDate: initialHabit?.startDate || new Date().toISOString().slice(0, 10),
      archived: initialHabit?.archived || false,
      paused: initialHabit?.paused || false,
      reminders,
    });
    onClose();
  };

  return (
    <ModalSheet visible onClose={onClose} title={initialHabit ? 'Edit Habit' : 'New Habit'}>
      <View style={{ gap: 18 }}>
        {/* Library button */}
        {!initialHabit && (
          <Button title="Browse Habit Library" variant="outline" onPress={() => setShowLibrary(true)} />
        )}

        {/* Name */}
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning Run"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {/* Description */}
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="What does this habit help with?"
            placeholderTextColor={theme.textMuted}
            multiline
          />
        </View>

        {/* Category */}
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ gap: 8, flexDirection: 'row' }}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => {
                    setCategory(cat);
                    setColor(CATEGORY_COLORS[cat]);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: category === cat ? CATEGORY_COLORS[cat] + '22' : theme.inputBg,
                      borderColor: category === cat ? CATEGORY_COLORS[cat] : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: category === cat ? CATEGORY_COLORS[cat] : theme.textSecondary }]}>{cat}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Type */}
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Habit Type</Text>
          <View style={styles.typeRow}>
            {HABIT_TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                style={[
                  styles.typeChip,
                  { backgroundColor: type === t.value ? theme.primary : theme.inputBg, borderColor: type === t.value ? theme.primary : theme.border },
                ]}
              >
                <Text style={[styles.chipText, { color: type === t.value ? '#fff' : theme.textSecondary }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Target & Unit for non-boolean */}
        {type !== 'boolean' && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Target</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, marginTop: 4 }]}
                value={target}
                onChangeText={setTarget}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Unit</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, marginTop: 4 }]}
                value={unit}
                onChangeText={setUnit}
                placeholder="minutes, reps..."
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>
        )}

        {/* Frequency */}
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Frequency</Text>
          <View style={styles.typeRow}>
            {(['daily', 'weekly', 'custom'] as Frequency[]).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFrequency(f)}
                style={[
                  styles.typeChip,
                  { backgroundColor: frequency === f ? theme.primary : theme.inputBg, borderColor: frequency === f ? theme.primary : theme.border },
                ]}
              >
                <Text style={[styles.chipText, { color: frequency === f ? '#fff' : theme.textSecondary, textTransform: 'capitalize' }]}>{f}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Days for custom/weekly */}
        {frequency !== 'daily' && (
          <View>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Days of Week</Text>
            <View style={styles.daysRow}>
              {DAYS.map((d, i) => (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i as DayOfWeek)}
                  style={[
                    styles.dayBtn,
                    { backgroundColor: daysOfWeek.includes(i as DayOfWeek) ? theme.primary : theme.inputBg, borderColor: daysOfWeek.includes(i as DayOfWeek) ? theme.primary : theme.border },
                  ]}
                >
                  <Text style={[styles.dayText, { color: daysOfWeek.includes(i as DayOfWeek) ? '#fff' : theme.textSecondary }]}>{d}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Routine */}
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Routine Period</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ gap: 8, flexDirection: 'row' }}>
              {ROUTINE_OPTIONS.map((r) => (
                <Pressable
                  key={String(r)}
                  onPress={() => setRoutine(r)}
                  style={[
                    styles.chip,
                    { backgroundColor: routine === r ? theme.primary + '22' : theme.inputBg, borderColor: routine === r ? theme.primary : theme.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: routine === r ? theme.primary : theme.textSecondary }]}>{r ? r.charAt(0).toUpperCase() + r.slice(1) : 'None'}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Color & Icon */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => setShowColorPicker(!showColorPicker)} style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Color</Text>
            <View style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }]}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color }} />
              <Text style={{ color: theme.text, fontFamily: 'Inter-Regular' }}>{color}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => setShowIconPicker(!showIconPicker)} style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Icon</Text>
            <View style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }]}>
              <Icon name={icon} size={20} color={color} />
              <Text style={{ color: theme.text, fontFamily: 'Inter-Regular' }}>{icon}</Text>
            </View>
          </Pressable>
        </View>

        {showColorPicker && (
          <View style={styles.pickerGrid}>
            {[...new Set(Object.values(CATEGORY_COLORS)), '#7C5CFC', '#22D3EE', '#3B82F6', '#06D6A0', '#FF6B6B', '#F7B801', '#B084F2', '#F6416C'].map((c) => (
              <Pressable key={c} onPress={() => { setColor(c); setShowColorPicker(false); }} style={[styles.colorSwatch, { backgroundColor: c, borderColor: color === c ? '#fff' : 'transparent', borderWidth: 3 }]} />
            ))}
          </View>
        )}

        {showIconPicker && (
          <View style={styles.pickerGrid}>
            {ICON_CHOICES.map((ic) => (
              <Pressable
                key={ic}
                onPress={() => { setIcon(ic); setShowIconPicker(false); }}
                style={[styles.iconSwatch, { backgroundColor: icon === ic ? theme.primaryDim : theme.inputBg, borderColor: icon === ic ? theme.primary : theme.border }]}
              >
                <Icon name={ic} size={22} color={color} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Reminders */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Reminders</Text>
            <Pressable onPress={addReminder} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Plus size={16} color={theme.primary} />
              <Text style={{ color: theme.primary, fontFamily: 'Inter-Medium', fontSize: 13 }}>Add</Text>
            </Pressable>
          </View>
          {reminders.map((r) => (
            <View key={r.id} style={[styles.reminderCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TextInput
                  style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]}
                  value={r.time}
                  onChangeText={(v) => updateReminder(r.id, { time: v })}
                  placeholder="HH:mm"
                />
                <Switch
                  value={r.enabled}
                  onValueChange={(v) => updateReminder(r.id, { enabled: v })}
                  trackColor={{ true: theme.primary, false: theme.border }}
                />
                <Pressable onPress={() => removeReminder(r.id)} hitSlop={8}>
                  <Trash2 size={18} color={theme.error} />
                </Pressable>
              </View>
              <TextInput
                style={[styles.reminderInput, { color: theme.text, borderColor: theme.border }]}
                value={r.message}
                onChangeText={(v) => updateReminder(r.id, { message: v, title: name })}
                placeholder="Reminder message"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          ))}
        </View>

        {/* Save */}
        <Button title={initialHabit ? 'Save Changes' : 'Create Habit'} onPress={handleSave} disabled={!name.trim()} style={{ marginTop: 4 }} />
      </View>

      {/* Library Modal */}
      <ModalSheet visible={showLibrary} onClose={() => setShowLibrary(false)} title="Habit Library" maxHeight={80}>
        <FlatList
          data={HABIT_LIBRARY}
          keyExtractor={(item, i) => i.toString()}
          numColumns={2}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => applyLibraryHabit(item)}
              style={(state) => ({ ...styles.libCard, backgroundColor: theme.card, borderColor: theme.cardBorder, opacity: state.pressed ? 0.7 : 1, flex: 1, margin: 4 })}
            >
              <View style={[styles.libIcon, { backgroundColor: item.color + '22' }]}>
                <Icon name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={[styles.libName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.libDesc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
            </Pressable>
          )}
        />
      </ModalSheet>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
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
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  dayBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  iconSwatch: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  timeInput: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
    marginRight: 8,
  },
  reminderInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  libCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  libIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  libName: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  libDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 4,
  },
});
