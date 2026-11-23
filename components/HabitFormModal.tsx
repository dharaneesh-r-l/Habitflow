import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Switch,
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
  CATEGORY_COLORS,
} from '@/types';
import { HABIT_LIBRARY } from '@/data/habitLibrary';
import { Icon } from '@/components/IconHelper';
import { uid } from '@/utils/date';
import {
  Plus,
  Trash2,
  BookOpen,
  Clock,
  Sunrise,
  Sun,
  Moon,
  Star,
  Sparkles,
  Dumbbell,
  Heart,
  TrendingUp,
  Zap,
  Apple,
  Wallet,
  Smile,
  Bell,
  Check,
  Calendar,
  Layers,
  Palette,
} from 'lucide-react-native';
import { radius } from '@/theme/tokens';
import {
  ClockTimePickerModal,
  format12Hour,
} from '@/components/ui/ClockTimePickerModal';

interface HabitFormProps {
  initialHabit?: Habit;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'order'>) => void | Promise<void>;
  onClose: () => void;
}

const HABIT_TYPES: { value: HabitType; label: string; description: string }[] = [
  { value: 'boolean', label: 'Simple (Yes/No)', description: 'Done or not done' },
  { value: 'count', label: 'Count', description: 'Track number of times' },
  { value: 'duration', label: 'Duration', description: 'Track time in minutes' },
  { value: 'target', label: 'Target', description: 'Reach a specific goal' },
];

const ROUTINE_OPTIONS: { period: RoutinePeriod | null; label: string; icon: any }[] = [
  { period: null, label: 'Anytime', icon: Clock },
  { period: 'morning', label: 'Morning', icon: Sunrise },
  { period: 'afternoon', label: 'Afternoon', icon: Sun },
  { period: 'evening', label: 'Evening', icon: Moon },
  { period: 'night', label: 'Night', icon: Star },
];

const CATEGORY_ICON_MAP: Record<HabitCategory, any> = {
  Fitness: Dumbbell,
  Health: Heart,
  Learning: BookOpen,
  Career: TrendingUp,
  Productivity: Zap,
  'Mental Wellness': Sparkles,
  Nutrition: Apple,
  Finance: Wallet,
  'Personal Care': Smile,
};

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

  // Clock picker state for editing reminder time
  const [clockPickerVisible, setClockPickerVisible] = useState(false);
  const [activeReminderId, setActiveReminderId] = useState<string | null>(null);

  const toggleDay = (day: DayOfWeek) => {
    setDaysOfWeek((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      return next.sort((a, b) => a - b);
    });
  };

  const selectAllDays = () => {
    setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    setFrequency('daily');
  };

  const selectWeekdays = () => {
    setDaysOfWeek([1, 2, 3, 4, 5]);
    setFrequency('custom');
  };

  const selectWeekends = () => {
    setDaysOfWeek([0, 6]);
    setFrequency('custom');
  };

  const addReminder = () => {
    const newRem: Reminder = {
      id: uid(),
      time: '08:00',
      days: frequency === 'daily' ? [] : daysOfWeek,
      enabled: true,
      title: name.trim() || 'Habit Reminder',
      message: `Time for ${name.trim() || 'your habit'}!`,
      sound: true,
    };
    setReminders([...reminders, newRem]);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const openClockPickerForReminder = (reminderId: string) => {
    setActiveReminderId(reminderId);
    setClockPickerVisible(true);
  };

  const handleTimeConfirm = (time24: string) => {
    if (activeReminderId) {
      updateReminder(activeReminderId, { time: time24 });
    }
    setClockPickerVisible(false);
    setActiveReminderId(null);
  };

  const applyLibraryHabit = (lib: (typeof HABIT_LIBRARY)[0]) => {
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
      Alert.alert('Habit Name Required', 'Please enter a name for your habit.');
      return;
    }
    const targetValue = Number(target);
    if (type !== 'boolean' && (!Number.isFinite(targetValue) || targetValue <= 0)) {
      Alert.alert('Invalid Target', 'Please enter a valid target greater than zero.');
      return;
    }
    if (daysOfWeek.length === 0) {
      Alert.alert('Schedule Required', 'Please select at least one day for this habit.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        category,
        type,
        frequency: daysOfWeek.length === 7 ? 'daily' : frequency,
        daysOfWeek,
        target: type === 'boolean' ? 1 : targetValue,
        unit: type === 'boolean' ? 'done' : unit.trim() || 'times',
        color,
        icon,
        routine,
        startDate: initialHabit?.startDate || new Date().toISOString().split('T')[0],
        archived: initialHabit?.archived ?? false,
        paused: initialHabit?.paused ?? false,
        reminders,
      });
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save habit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentReminder = reminders.find((r) => r.id === activeReminderId);

  return (
    <ModalSheet
      visible={true}
      onClose={onClose}
      title={initialHabit ? 'Edit Habit' : 'Create New Habit'}
      maxHeight={92}
    >
      <View style={styles.formContainer}>
        {/* Template Quick Selection Banner */}
        {!initialHabit && (
          <Pressable
            onPress={() => setShowLibrary(!showLibrary)}
            style={[
              styles.libraryBanner,
              {
                backgroundColor: theme.primaryDim,
                borderColor: theme.primary,
              },
            ]}
          >
            <Sparkles size={16} color={theme.primaryLight} />
            <Text style={[styles.libraryBannerText, { color: theme.primaryLight }]}>
              {showLibrary ? 'Hide Habit Ideas' : 'Choose from Habit Ideas & Templates'}
            </Text>
          </Pressable>
        )}

        {/* Library Accordion */}
        {showLibrary && (
          <View
            style={[
              styles.libraryBox,
              {
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.libraryTitle, { color: theme.textSecondary }]}>
              Tap any template to auto-fill:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {HABIT_LIBRARY.slice(0, 10).map((lib) => (
                <Pressable
                  key={lib.name}
                  onPress={() => applyLibraryHabit(lib)}
                  style={[
                    styles.libraryChip,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <Icon name={lib.icon} size={15} color={lib.color} />
                  <Text style={[styles.libraryChipText, { color: theme.text }]}>
                    {lib.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* SECTION 1: BASIC DETAILS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Layers size={16} color={theme.primaryLight} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              1. Basic Details
            </Text>
          </View>

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>
              Habit Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Morning Jog, Read 20 pages"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              maxLength={50}
            />
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const CatIcon = CATEGORY_ICON_MAP[cat] || Sparkles;
                const catColor = CATEGORY_COLORS[cat];

                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: isSelected ? theme.primaryDim : theme.surfaceAlt,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <CatIcon size={16} color={isSelected ? theme.primaryLight : catColor} />
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color: isSelected ? theme.primaryLight : theme.textSecondary,
                          fontFamily: isSelected ? 'Inter-Bold' : 'Inter-Medium',
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Why does this habit matter to you?"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              maxLength={120}
            />
          </View>
        </View>

        {/* SECTION 2: HABIT TYPE & GOAL */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Check size={16} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              2. Goal & Measurement
            </Text>
          </View>

          {/* Habit Type selector */}
          <View style={styles.typeGrid}>
            {HABIT_TYPES.map((t) => {
              const isSelected = type === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => {
                    setType(t.value);
                    if (t.value === 'boolean') {
                      setUnit('done');
                      setTarget('1');
                    } else if (unit === 'done') {
                      setUnit(COMMON_UNITS[t.value][0] || 'times');
                      setTarget(t.value === 'duration' ? '30' : '5');
                    }
                  }}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor: isSelected ? theme.primaryDim : theme.surfaceAlt,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeTitle,
                      {
                        color: isSelected ? theme.primaryLight : theme.text,
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                  <Text
                    style={[
                      styles.typeDesc,
                      {
                        color: isSelected ? theme.primaryLight + 'CC' : theme.textMuted,
                      },
                    ]}
                  >
                    {t.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Numeric config when measurable */}
          {type !== 'boolean' && (
            <View style={styles.numericRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>
                  Daily Target
                </Text>
                <TextInput
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="numeric"
                  placeholder="30"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              </View>

              <View style={{ flex: 1.2 }}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Unit</Text>
                <TextInput
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="e.g. pages, mins"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Unit suggestion chips */}
          {type !== 'boolean' && (
            <View style={styles.unitChipsRow}>
              {COMMON_UNITS[type].map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[
                    styles.unitChip,
                    {
                      backgroundColor: unit === u ? theme.primaryDim : theme.surfaceAlt,
                      borderColor: unit === u ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      {
                        color: unit === u ? theme.primaryLight : theme.textSecondary,
                      },
                    ]}
                  >
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* SECTION 3: SCHEDULE & ROUTINE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={16} color={theme.streak} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              3. Schedule & Routine
            </Text>
          </View>

          {/* Quick preset filters */}
          <View style={styles.quickScheduleRow}>
            <Pressable
              onPress={selectAllDays}
              style={[
                styles.quickScheduleBtn,
                {
                  backgroundColor: daysOfWeek.length === 7 ? theme.primaryDim : theme.surfaceAlt,
                  borderColor: daysOfWeek.length === 7 ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.quickScheduleText,
                  {
                    color: daysOfWeek.length === 7 ? theme.primaryLight : theme.textSecondary,
                  },
                ]}
              >
                Everyday
              </Text>
            </Pressable>

            <Pressable
              onPress={selectWeekdays}
              style={[
                styles.quickScheduleBtn,
                {
                  backgroundColor:
                    daysOfWeek.length === 5 && !daysOfWeek.includes(0) && !daysOfWeek.includes(6)
                      ? theme.primaryDim
                      : theme.surfaceAlt,
                  borderColor:
                    daysOfWeek.length === 5 && !daysOfWeek.includes(0) && !daysOfWeek.includes(6)
                      ? theme.primary
                      : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.quickScheduleText,
                  {
                    color:
                      daysOfWeek.length === 5 && !daysOfWeek.includes(0) && !daysOfWeek.includes(6)
                        ? theme.primaryLight
                        : theme.textSecondary,
                  },
                ]}
              >
                Weekdays
              </Text>
            </Pressable>

            <Pressable
              onPress={selectWeekends}
              style={[
                styles.quickScheduleBtn,
                {
                  backgroundColor:
                    daysOfWeek.length === 2 && daysOfWeek.includes(0) && daysOfWeek.includes(6)
                      ? theme.primaryDim
                      : theme.surfaceAlt,
                  borderColor:
                    daysOfWeek.length === 2 && daysOfWeek.includes(0) && daysOfWeek.includes(6)
                      ? theme.primary
                      : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.quickScheduleText,
                  {
                    color:
                      daysOfWeek.length === 2 && daysOfWeek.includes(0) && daysOfWeek.includes(6)
                        ? theme.primaryLight
                        : theme.textSecondary,
                  },
                ]}
              >
                Weekends
              </Text>
            </Pressable>
          </View>

          {/* Weekday pills */}
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
                  <Text
                    style={[
                      styles.dayPillText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {dayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Routine Time of Day */}
          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Routine Period
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
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
                    <OptIcon
                      size={15}
                      color={isSelected ? theme.primaryLight : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.routineChipText,
                        {
                          color: isSelected ? theme.primaryLight : theme.textSecondary,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* SECTION 4: SMART CLOCK REMINDERS */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Bell size={16} color={theme.primaryLight} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                4. Reminders
              </Text>
            </View>
            <Pressable
              onPress={addReminder}
              style={[
                styles.addReminderBtn,
                {
                  backgroundColor: theme.primaryDim,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Plus size={14} color={theme.primaryLight} />
              <Text style={[styles.addReminderText, { color: theme.primaryLight }]}>
                Add Reminder
              </Text>
            </Pressable>
          </View>

          {reminders.length === 0 ? (
            <View
              style={[
                styles.emptyRemindersBox,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
              ]}
            >
              <Clock size={20} color={theme.textMuted} />
              <Text style={[styles.emptyRemindersText, { color: theme.textMuted }]}>
                No reminder set. Tap &apos;Add Reminder&apos; to get smart alerts.
              </Text>
            </View>
          ) : (
            reminders.map((rem, idx) => (
              <View
                key={rem.id}
                style={[
                  styles.reminderCard,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: rem.enabled ? theme.cardBorderHighlight : theme.border,
                  },
                ]}
              >
                <View style={styles.reminderCardLeft}>
                  {/* Tap time to open Circular Clock Dialer */}
                  <Pressable
                    onPress={() => openClockPickerForReminder(rem.id)}
                    style={[
                      styles.timePickerTrigger,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.primary,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Change reminder time from ${format12Hour(rem.time)}`}
                  >
                    <Clock size={16} color={theme.primaryLight} />
                    <Text style={[styles.timePickerTriggerText, { color: theme.text }]}>
                      {format12Hour(rem.time)}
                    </Text>
                  </Pressable>

                  <View style={styles.reminderInfo}>
                    <Text style={[styles.reminderLabel, { color: theme.textSecondary }]}>
                      Reminder #{idx + 1}
                    </Text>
                    <Text style={[styles.reminderDaysBadge, { color: theme.textMuted }]}>
                      {daysOfWeek.length === 7 ? 'Everyday' : `${daysOfWeek.length} days / week`}
                    </Text>
                  </View>
                </View>

                <View style={styles.reminderCardRight}>
                  {/* Enabled switch */}
                  <Switch
                    value={rem.enabled}
                    onValueChange={(val) => updateReminder(rem.id, { enabled: val })}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor="#FFFFFF"
                  />

                  {/* Remove reminder */}
                  <Pressable
                    onPress={() => removeReminder(rem.id)}
                    style={styles.deleteReminderBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Delete reminder"
                  >
                    <Trash2 size={16} color={theme.error} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* SECTION 5: APPEARANCE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={16} color={theme.xp} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              5. Appearance
            </Text>
          </View>

          {/* Color palette */}
          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Accent Color
            </Text>
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

          {/* Icon picker */}
          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Icon</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
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
                    <Icon
                      name={ic}
                      size={20}
                      color={isSelected ? color : theme.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Button
            title="Cancel"
            variant="ghost"
            size="lg"
            onPress={onClose}
            style={{ flex: 1 }}
          />

          <Button
            title={initialHabit ? 'Save Changes' : 'Create Habit'}
            variant="primary"
            size="lg"
            loading={saving}
            onPress={handleSave}
            style={{ flex: 2 }}
          />
        </View>
      </View>

      {/* Circular Clock Dialer Modal */}
      {clockPickerVisible && (
        <ClockTimePickerModal
          visible={clockPickerVisible}
          initialTime={currentReminder?.time || '08:00'}
          title="Select Reminder Time"
          onConfirm={handleTimeConfirm}
          onClose={() => {
            setClockPickerVisible(false);
            setActiveReminderId(null);
          }}
        />
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: 20,
    paddingBottom: 24,
  },
  libraryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  libraryBannerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '600',
  },
  libraryBox: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
  },
  libraryTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  libraryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  libraryChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: '700',
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 3,
  },
  typeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    fontWeight: '700',
  },
  typeDesc: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  numericRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  unitChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  quickScheduleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickScheduleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  quickScheduleText: {
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
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  dayPillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '600',
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
  addReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  addReminderText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyRemindersBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  emptyRemindersText: {
    fontSize: 12,
    flex: 1,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  reminderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1.5,
  },
  timePickerTriggerText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
  reminderInfo: {
    gap: 2,
  },
  reminderLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  reminderDaysBadge: {
    fontSize: 11,
  },
  reminderCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteReminderBtn: {
    padding: 6,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  iconChoice: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
