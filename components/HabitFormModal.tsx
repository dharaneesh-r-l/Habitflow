import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/theme/ThemeContext';
import {
  Habit,
  HabitCategory,
  HabitType,
  Frequency,
  DayOfWeek,
  RoutinePeriod,
  Reminder,
  CATEGORIES,
} from '@/types';
import { HABIT_LIBRARY } from '@/data/habitLibrary';
import { Icon } from '@/components/IconHelper';
import { uid } from '@/utils/date';
import { Plus, Trash2, BookOpen, Clock, Sunrise, Sun, Moon, Star } from 'lucide-react-native';
import { spacing, radius } from '@/theme/tokens';

interface HabitFormProps {
  initialHabit?: Habit;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'order'>) => void | Promise<void>;
  onClose: () => void;
}

const HABIT_TYPES: { value: HabitType; label: string }[] = [
  { value: 'boolean', label: 'Yes / No' },
  { value: 'count', label: 'Count' },
  { value: 'duration', label: 'Duration' },
  { value: 'target', label: 'Target' },
];

const ROUTINE_OPTIONS: { period: RoutinePeriod | null; label: string; icon: any }[] = [
  { period: null, label: 'Anytime', icon: Clock },
  { period: 'morning', label: 'Morning', icon: Sunrise },
  { period: 'afternoon', label: 'Afternoon', icon: Sun },
  { period: 'evening', label: 'Evening', icon: Moon },
  { period: 'night', label: 'Night', icon: Star },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const COLOR_CHOICES = [
  '#7C5CFC', // HabitFlow Violet
  '#06D6A0', // Emerald Cyan
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Mint Turquoise
  '#45B7D1', // Sky Cerulean
  '#FFA07A', // Warm Salmon
  '#B084F2', // Lavender
  '#F7B801', // Golden Amber
  '#F6416C', // Rose Pink
  '#3B82F6', // Royal Blue
];

const ICON_CHOICES = [
  'Target', 'Zap', 'Flame', 'Activity', 'Footprints', 'Dumbbell', 'Flower2',
  'Droplets', 'Moon', 'Pill', 'Brain', 'Wind', 'BookOpen', 'Languages',
  'Code', 'PlayCircle', 'PenLine', 'ClipboardList', 'Users', 'TrendingUp',
  'FileText', 'Inbox', 'CheckSquare', 'Clock', 'Mail', 'Heart', 'Sparkles',
  'Smartphone', 'Smile', 'SmilePlus', 'Coffee', 'Apple', 'Ban', 'ChefHat',
  'Scale', 'PiggyBank', 'Wallet', 'LineChart', 'Trash2',
];

const COMMON_UNITS: Record<HabitType, string[]> = {
  boolean: ['done'],
  count: ['times', 'reps', 'glasses', 'pages', 'items'],
  duration: ['minutes', 'hours', 'sessions'],
  target: ['steps', 'calories', 'words', 'points'],
};

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
  const [color, setColor] = useState(initialHabit?.color || theme.primary);
  const [icon, setIcon] = useState(initialHabit?.icon || 'Target');
  const [routine, setRoutine] = useState<RoutinePeriod | null>(initialHabit?.routine || null);
  const [reminders, setReminders] = useState<Reminder[]>(initialHabit?.reminders || []);
  const [showLibrary, setShowLibrary] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addReminder = () => {
    setReminders([
      ...reminders,
      {
        id: uid(),
        time: '08:00',
        days: frequency === 'daily' ? [] : daysOfWeek,
        enabled: true,
        title: name || 'Habit',
        message: `Time for ${name || 'your habit'}`,
        sound: true,
      },
    ]);
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
    setReminders(
      lib.suggestedReminders.map((r) => ({
        id: uid(),
        time: r.time,
        days: lib.daysOfWeek as DayOfWeek[],
        enabled: true,
        title: lib.name,
        message: r.message,
        sound: true,
      }))
    );
    setShowLibrary(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Habit name required', 'Please enter a name for this habit.');
      return;
    }
    const targetValue = Number(target);
    if (type !== 'boolean' && (!Number.isFinite(targetValue) || targetValue <= 0)) {
      Alert.alert('Check your goal', 'Enter a numeric target greater than zero.');
      return;
    }
    if (frequency !== 'daily' && daysOfWeek.length === 0) {
      Alert.alert('Choose a schedule', 'Select at least one day for this habit.');
      return;
    }
    if (reminders.some((r) => r.enabled && !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time))) {
      Alert.alert('Check reminder time', 'Please use 24-hour format (e.g. 08:30).');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        category,
        type,
        frequency,
        daysOfWeek: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : daysOfWeek,
        target: type === 'boolean' ? 1 : targetValue,
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
    } catch {
      Alert.alert('Could not save', 'Please check your inputs and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (showLibrary) {
    return (
      <ModalSheet visible onClose={() => setShowLibrary(false)} title="Habit Templates">
        <View style={{ gap: spacing.md }}>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Pick from curated, science-backed habits to get started instantly.
          </Text>
          {HABIT_LIBRARY.map((lib, i) => (
            <Pressable
              key={i}
              onPress={() => applyLibraryHabit(lib)}
              style={({ pressed }) => [
                styles.libCard,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[styles.libIconWrap, { backgroundColor: lib.color + '22' }]}>
                <Icon name={lib.icon} size={22} color={lib.color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.libName, { color: theme.text }]}>{lib.name}</Text>
                <Text style={[styles.libDesc, { color: theme.textSecondary }]}>{lib.description}</Text>
                <Text style={[styles.libMeta, { color: lib.color }]}>
                  {lib.category} · {lib.type === 'boolean' ? 'Daily check-in' : `${lib.target} ${lib.unit}`}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ModalSheet>
    );
  }

  return (
    <ModalSheet visible onClose={onClose} title={initialHabit ? 'Edit Habit' : 'Create New Habit'}>
      <View style={{ gap: spacing.lg }}>
        {!initialHabit && (
          <Button
            title="Browse Habit Templates"
            variant="secondary"
            icon={<BookOpen size={18} color={theme.primaryLight} />}
            onPress={() => setShowLibrary(true)}
          />
        )}

        {/* Habit Name */}
        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Habit Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Read 30 minutes, Morning workout..."
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
          />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Motivation / Description (Optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Why do you want to build this habit?"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
          />
        </View>

        {/* Habit Type Segmented Control */}
        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Habit Type</Text>
          <View style={[styles.segmentContainer, { backgroundColor: theme.surfaceAlt }]}>
            {HABIT_TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => {
                  setType(t.value);
                  setUnit(COMMON_UNITS[t.value][0]);
                }}
                style={[
                  styles.segmentBtn,
                  {
                    backgroundColor: type === t.value ? theme.primary : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: type === t.value ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: type === t.value ? '700' : '500',
                    },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Numeric Target Configuration */}
        {type !== 'boolean' && (
          <View style={styles.numericConfigRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Daily Target</Text>
              <TextInput
                value={target}
                onChangeText={setTarget}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Unit</Text>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="reps, mins..."
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              />
            </View>
          </View>
        )}

        {/* Routine Placement */}
        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Routine Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {ROUTINE_OPTIONS.map((opt) => {
              const isSelected = routine === opt.period;
              const OptIcon = opt.icon;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => setRoutine(opt.period)}
                  style={[
                    styles.routineChip,
                    {
                      backgroundColor: isSelected ? theme.primaryDim : theme.surfaceAlt,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <OptIcon size={14} color={isSelected ? theme.primaryLight : theme.textMuted} />
                  <Text style={[styles.routineChipText, { color: isSelected ? theme.primaryLight : theme.textSecondary }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Schedule / Repeat Days */}
        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Repeat Schedule</Text>
          <View style={styles.daysRow}>
            {DAYS.map((dayName, idx) => {
              const isSelected = daysOfWeek.includes(idx as DayOfWeek);
              return (
                <Pressable
                  key={dayName}
                  onPress={() => toggleDay(idx as DayOfWeek)}
                  style={[
                    styles.dayPill,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surfaceAlt,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.dayPillText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                    {dayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Category Picker */}
        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.routineChip,
                    {
                      backgroundColor: isSelected ? theme.primaryDim : theme.surfaceAlt,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.routineChipText, { color: isSelected ? theme.primaryLight : theme.textSecondary }]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Color Palette */}
        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Accent Color</Text>
          <View style={styles.paletteRow}>
            {COLOR_CHOICES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: c,
                    borderColor: color === c ? '#FFFFFF' : 'transparent',
                    borderWidth: color === c ? 2.5 : 0,
                    transform: [{ scale: color === c ? 1.15 : 1 }],
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Icon Picker Grid */}
        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {ICON_CHOICES.map((ic) => {
              const isSelected = icon === ic;
              return (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={[
                    styles.iconChoice,
                    {
                      backgroundColor: isSelected ? color + '30' : theme.surfaceAlt,
                      borderColor: isSelected ? color : theme.border,
                    },
                  ]}
                >
                  <Icon name={ic} size={20} color={isSelected ? color : theme.textSecondary} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Reminders section */}
        <View style={styles.formGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Reminders</Text>
            <Pressable onPress={addReminder} style={styles.addReminderBtn}>
              <Plus size={14} color={theme.primary} />
              <Text style={[styles.addReminderText, { color: theme.primary }]}>Add Reminder</Text>
            </Pressable>
          </View>

          {reminders.map((rem) => (
            <View key={rem.id} style={[styles.reminderRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Clock size={16} color={theme.primaryLight} />
              <TextInput
                value={rem.time}
                onChangeText={(t) => updateReminder(rem.id, { time: t })}
                placeholder="08:00"
                placeholderTextColor={theme.textMuted}
                style={[styles.reminderInput, { color: theme.text }]}
              />
              <Pressable onPress={() => removeReminder(rem.id)} hitSlop={8}>
                <Trash2 size={16} color={theme.error} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Save button */}
        <Button
          title={initialHabit ? 'Save Changes' : 'Create Habit'}
          variant="primary"
          size="lg"
          loading={saving}
          onPress={handleSave}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  numericConfigRow: {
    flexDirection: 'row',
    gap: 12,
  },
  routineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  routineChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayPill: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '600',
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconChoice: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addReminderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
  },
  reminderInput: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    padding: 0,
  },
  libCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: 12,
  },
  libIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  libName: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: '700',
  },
  libDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  libMeta: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
