import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  ZoomIn,
} from 'react-native-reanimated';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sunrise,
  Moon,
  Bell,
  ChevronRight,
  Flame,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Button } from '@/components/ui/Button';
import {
  ClockTimePickerModal,
  format12Hour,
} from '@/components/ui/ClockTimePickerModal';
import {
  Habit,
  HabitCategory,
  HabitType,
  DayOfWeek,
  CATEGORIES,
  CATEGORY_COLORS,
} from '@/types';
import { uid } from '@/utils/date';
import { spacing, radius } from '@/theme/tokens';
import { Icon } from '@/components/IconHelper';

interface SuggestedHabit {
  name: string;
  category: HabitCategory;
  type: HabitType;
  target: number;
  unit: string;
  icon: string;
  color: string;
  suggestedReminder: string;
}

const SUGGESTED_HABITS: SuggestedHabit[] = [
  {
    name: 'Drink Water',
    category: 'Health',
    type: 'count',
    target: 8,
    unit: 'glasses',
    icon: 'Droplets',
    color: '#4ECDC4',
    suggestedReminder: '09:00',
  },
  {
    name: 'Exercise',
    category: 'Fitness',
    type: 'duration',
    target: 30,
    unit: 'minutes',
    icon: 'Dumbbell',
    color: '#FF6B6B',
    suggestedReminder: '07:00',
  },
  {
    name: 'Read a Book',
    category: 'Learning',
    type: 'duration',
    target: 20,
    unit: 'minutes',
    icon: 'BookOpen',
    color: '#45B7D1',
    suggestedReminder: '20:30',
  },
  {
    name: 'Meditate',
    category: 'Mental Wellness',
    type: 'duration',
    target: 10,
    unit: 'minutes',
    icon: 'Brain',
    color: '#B084F2',
    suggestedReminder: '07:30',
  },
  {
    name: 'Sleep on Time',
    category: 'Health',
    type: 'boolean',
    target: 1,
    unit: 'done',
    icon: 'Moon',
    color: '#6366F1',
    suggestedReminder: '22:30',
  },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const completeOnboarding = useHabitStore((s) => s.completeOnboarding);
  const addHabit = useHabitStore((s) => s.addHabit);

  // Current Step: 1 = Welcome, 2 = Personal Details, 3 = First Habit, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Screen 2: Personal Details
  const [firstName, setFirstName] = useState('');
  const [nickname, setNickname] = useState('');
  const [wakeUpTime, setWakeUpTime] = useState('07:00');
  const [hasWakeUpTime, setHasWakeUpTime] = useState(false);
  const [bedTime, setBedTime] = useState('23:00');
  const [hasBedTime, setHasBedTime] = useState(false);
  const [nameError, setNameError] = useState('');

  // Clock picker for personal times
  const [clockPickerTarget, setClockPickerTarget] = useState<
    'wakeup' | 'bedtime' | 'reminder' | null
  >(null);

  // Screen 3: First Habit Creation
  const [habitName, setHabitName] = useState('Drink Water');
  const [category, setCategory] = useState<HabitCategory>('Health');
  const [description, setDescription] = useState('Stay hydrated with 8 glasses of water');
  const [type, setType] = useState<HabitType>('count');
  const [target, setTarget] = useState('8');
  const [unit, setUnit] = useState('glasses');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([0, 1, 2, 3, 4, 5, 6]);
  const [color, setColor] = useState('#4ECDC4');
  const [icon, setIcon] = useState('Droplets');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [habitCreated, setHabitCreated] = useState<Habit | null>(null);
  const [skippedHabit, setSkippedHabit] = useState(false);
  const [habitNameError, setHabitNameError] = useState('');

  // Step 2 Validation & Continue
  const handleDetailsContinue = () => {
    if (!firstName.trim()) {
      setNameError('Please enter your first name to continue');
      return;
    }
    setNameError('');
    setStep(3);
  };

  // Step 3: Select Suggested Habit
  const handleSelectSuggestedHabit = (suggested: SuggestedHabit) => {
    setHabitName(suggested.name);
    setCategory(suggested.category);
    setType(suggested.type);
    setTarget(String(suggested.target));
    setUnit(suggested.unit);
    setColor(suggested.color);
    setIcon(suggested.icon);
    setReminderTime(suggested.suggestedReminder);
    setDescription(
      suggested.type === 'boolean'
        ? `Consistently build ${suggested.name.toLowerCase()}`
        : `Aim for ${suggested.target} ${suggested.unit} daily`
    );
    setHabitNameError('');
  };

  // Toggle Day
  const toggleDay = (day: DayOfWeek) => {
    setDaysOfWeek((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      return next.sort((a, b) => a - b);
    });
  };

  // Step 3: Create Habit & Proceed
  const handleCreateHabit = async () => {
    if (!habitName.trim()) {
      setHabitNameError('Please give your habit a name');
      return;
    }
    if (daysOfWeek.length === 0) {
      setHabitNameError('Please select at least one day for your habit');
      return;
    }

    const targetVal = type === 'boolean' ? 1 : Number(target) || 1;

    const created = await addHabit({
      name: habitName.trim(),
      description: description.trim(),
      category,
      type,
      frequency: daysOfWeek.length === 7 ? 'daily' : 'custom',
      daysOfWeek,
      target: targetVal,
      unit: type === 'boolean' ? 'done' : unit.trim() || 'times',
      color,
      icon,
      routine: null,
      startDate: new Date().toISOString().split('T')[0],
      archived: false,
      paused: false,
      reminders: reminderEnabled
        ? [
            {
              id: uid(),
              time: reminderTime,
              days: daysOfWeek.length === 7 ? [] : daysOfWeek,
              enabled: true,
              title: habitName.trim(),
              message: `Time for ${habitName.trim()}!`,
              sound: true,
            },
          ]
        : [],
    });

    setHabitCreated(created);
    setSkippedHabit(false);
    setStep(4);
  };

  // Step 3: Skip
  const handleSkipHabit = () => {
    setHabitCreated(null);
    setSkippedHabit(true);
    setStep(4);
  };

  // Step 4: Finalize & Navigate to Dashboard
  const handleFinishOnboarding = async () => {
    await completeOnboarding({
      firstName: firstName.trim(),
      nickname: nickname.trim() || undefined,
      wakeUpTime: hasWakeUpTime ? wakeUpTime : undefined,
      bedTime: hasBedTime ? bedTime : undefined,
    });
    router.replace('/(tabs)');
  };

  // Handle Clock Time Confirm
  const handleClockConfirm = (time24: string) => {
    if (clockPickerTarget === 'wakeup') {
      setWakeUpTime(time24);
      setHasWakeUpTime(true);
    } else if (clockPickerTarget === 'bedtime') {
      setBedTime(time24);
      setHasBedTime(true);
    } else if (clockPickerTarget === 'reminder') {
      setReminderTime(time24);
    }
    setClockPickerTarget(null);
  };

  const displayName = nickname.trim() || firstName.trim() || 'friend';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Progress Indicator Bar */}
        <View style={styles.topBar}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: theme.primary,
                  width: `${(step / 4) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.stepIndicatorText, { color: theme.textSecondary }]}>
            Step {step} of 4
          </Text>
        </View>

        {/* SCREEN 1: WELCOME */}
        {step === 1 && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.welcomeScrollContent}
          >
            <Animated.View
              entering={FadeInDown.duration(600)}
              style={styles.welcomeContent}
            >
              {/* Logo Badge */}
              <View
                style={[
                  styles.logoBadge,
                  {
                    backgroundColor: theme.primaryDim,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Flame size={48} color={theme.primaryLight} strokeWidth={2.2} />
              </View>

              <Text style={[styles.brandTitle, { color: theme.text }]}>
                Habit<Text style={{ color: theme.primaryLight }}>Flow</Text>
              </Text>

              {/* Welcoming Headline */}
              <Text style={[styles.headline, { color: theme.text }]}>
                Build better habits,{'\n'}one day at a time.
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                Transform your goals into lasting consistency. Plan routines, track daily
                progress, and stay motivated with intelligent reminders designed for you.
              </Text>

              {/* Value Highlights */}
              <View style={styles.featuresList}>
                <View
                  style={[
                    styles.featureItem,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.featureIconWrap,
                      { backgroundColor: theme.primaryDim },
                    ]}
                  >
                    <Clock size={18} color={theme.primaryLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>
                      Smart Clock Reminders
                    </Text>
                    <Text
                      style={[styles.featureDesc, { color: theme.textSecondary }]}
                    >
                      Precise circular dial picker with device-timed notifications.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.featureItem,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.featureIconWrap,
                      { backgroundColor: theme.accentDim },
                    ]}
                  >
                    <Zap size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>
                      Visual Momentum
                    </Text>
                    <Text
                      style={[styles.featureDesc, { color: theme.textSecondary }]}
                    >
                      Streaks, milestone XP levels, and weekly progress tracking.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.featureItem,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.featureIconWrap,
                      { backgroundColor: theme.blueDim },
                    ]}
                  >
                    <ShieldCheck size={18} color={theme.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>
                      100% Private & Offline
                    </Text>
                    <Text
                      style={[styles.featureDesc, { color: theme.textSecondary }]}
                    >
                      Your habit data stays safely stored on your device.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Get Started Button */}
              <Button
                title="Get Started"
                variant="primary"
                size="lg"
                onPress={() => setStep(2)}
                icon={<ArrowRight size={18} color="#FFFFFF" />}
                style={styles.primaryActionButton}
              />
            </Animated.View>
          </ScrollView>
        )}

        {/* SCREEN 2: PERSONAL DETAILS */}
        {step === 2 && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formScrollContent}
          >
            <Animated.View
              entering={FadeInRight.duration(400)}
              exiting={FadeOutLeft.duration(300)}
              style={styles.stepContent}
            >
              <Text style={[styles.screenTitle, { color: theme.text }]}>
                Tell us about yourself
              </Text>
              <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
                Personalize your HabitFlow experience with your name and daily rhythm.
              </Text>

              {/* First Name (Required) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  First Name <Text style={{ color: theme.primaryLight }}>*</Text>
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={(val) => {
                    setFirstName(val);
                    if (val.trim()) setNameError('');
                  }}
                  placeholder="e.g. Dharaneesh"
                  placeholderTextColor={theme.textMuted}
                  autoFocus
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: nameError ? theme.error : theme.border,
                      color: theme.text,
                    },
                  ]}
                />
                {nameError ? (
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {nameError}
                  </Text>
                ) : null}
              </View>

              {/* Nickname (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Nickname (Optional)
                </Text>
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="What should we call you?"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="words"
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              </View>

              {/* Daily Wake-up Time (Optional) with Clock Time Picker */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Daily Wake-up Time (Optional)
                </Text>
                <Pressable
                  onPress={() => setClockPickerTarget('wakeup')}
                  style={[
                    styles.timeSelectCard,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: hasWakeUpTime ? theme.primary : theme.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Pick daily wake-up time"
                >
                  <View style={styles.timeSelectLeft}>
                    <Sunrise
                      size={20}
                      color={hasWakeUpTime ? '#FFA07A' : theme.textMuted}
                    />
                    <Text
                      style={[
                        styles.timeSelectText,
                        {
                          color: hasWakeUpTime ? theme.text : theme.textMuted,
                          fontFamily: hasWakeUpTime ? 'Inter-Bold' : 'Inter-Regular',
                        },
                      ]}
                    >
                      {hasWakeUpTime
                        ? format12Hour(wakeUpTime)
                        : 'Tap to set wake-up time'}
                    </Text>
                  </View>
                  <Clock size={16} color={theme.primaryLight} />
                </Pressable>
              </View>

              {/* Preferred Bedtime (Optional) with Clock Time Picker */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Preferred Bedtime (Optional)
                </Text>
                <Pressable
                  onPress={() => setClockPickerTarget('bedtime')}
                  style={[
                    styles.timeSelectCard,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: hasBedTime ? theme.primary : theme.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Pick preferred bedtime"
                >
                  <View style={styles.timeSelectLeft}>
                    <Moon
                      size={20}
                      color={hasBedTime ? '#8B5CF6' : theme.textMuted}
                    />
                    <Text
                      style={[
                        styles.timeSelectText,
                        {
                          color: hasBedTime ? theme.text : theme.textMuted,
                          fontFamily: hasBedTime ? 'Inter-Bold' : 'Inter-Regular',
                        },
                      ]}
                    >
                      {hasBedTime ? format12Hour(bedTime) : 'Tap to set bedtime'}
                    </Text>
                  </View>
                  <Clock size={16} color={theme.primaryLight} />
                </Pressable>
              </View>

              {/* Continue Button */}
              <Button
                title="Continue to First Habit"
                variant="primary"
                size="lg"
                onPress={handleDetailsContinue}
                icon={<ArrowRight size={18} color="#FFFFFF" />}
                style={{ marginTop: spacing.md }}
              />
            </Animated.View>
          </ScrollView>
        )}

        {/* SCREEN 3: CREATE YOUR FIRST HABIT */}
        {step === 3 && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formScrollContent}
          >
            <Animated.View
              entering={FadeInRight.duration(400)}
              exiting={FadeOutLeft.duration(300)}
              style={styles.stepContent}
            >
              <Text style={[styles.screenTitle, { color: theme.text }]}>
                Create your first habit
              </Text>
              <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
                Pick a popular starter or customize your own habit below.
              </Text>

              {/* Suggested Habits Carousel */}
              <Text style={[styles.sectionSubtitle, { color: theme.text }]}>
                Suggested starter habits:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {SUGGESTED_HABITS.map((sug) => {
                  const isCurrent = habitName === sug.name;
                  return (
                    <Pressable
                      key={sug.name}
                      onPress={() => handleSelectSuggestedHabit(sug)}
                      style={[
                        styles.sugChip,
                        {
                          backgroundColor: isCurrent ? theme.primaryDim : theme.surfaceAlt,
                          borderColor: isCurrent ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Icon
                        name={sug.icon}
                        size={16}
                        color={isCurrent ? theme.primaryLight : sug.color}
                      />
                      <Text
                        style={[
                          styles.sugChipText,
                          {
                            color: isCurrent ? theme.primaryLight : theme.text,
                            fontFamily: isCurrent ? 'Inter-Bold' : 'Inter-Medium',
                          },
                        ]}
                      >
                        {sug.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Habit Name Input */}
              <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Habit Name <Text style={{ color: theme.primaryLight }}>*</Text>
                </Text>
                <TextInput
                  value={habitName}
                  onChangeText={(val) => {
                    setHabitName(val);
                    if (val.trim()) setHabitNameError('');
                  }}
                  placeholder="e.g. Drink Water, Daily Reading"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: habitNameError ? theme.error : theme.border,
                      color: theme.text,
                    },
                  ]}
                />
                {habitNameError ? (
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {habitNameError}
                  </Text>
                ) : null}
              </View>

              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    const catColor = CATEGORY_COLORS[cat];
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        style={[
                          styles.catPill,
                          {
                            backgroundColor: isSelected
                              ? theme.primaryDim
                              : theme.surfaceAlt,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.catDot,
                            { backgroundColor: isSelected ? theme.primaryLight : catColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.catPillText,
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

              {/* Habit Type (Simple vs Measurable) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Habit Type
                </Text>
                <View
                  style={[
                    styles.typeSelectorRow,
                    { backgroundColor: theme.surfaceAlt },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      setType('boolean');
                      setUnit('done');
                      setTarget('1');
                    }}
                    style={[
                      styles.typeSelectorBtn,
                      type === 'boolean' && {
                        backgroundColor: theme.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeSelectorText,
                        {
                          color: type === 'boolean' ? '#FFFFFF' : theme.textSecondary,
                        },
                      ]}
                    >
                      Simple (Yes/No)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setType('count');
                      if (unit === 'done') setUnit('times');
                      if (target === '1') setTarget('5');
                    }}
                    style={[
                      styles.typeSelectorBtn,
                      type !== 'boolean' && {
                        backgroundColor: theme.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeSelectorText,
                        {
                          color: type !== 'boolean' ? '#FFFFFF' : theme.textSecondary,
                        },
                      ]}
                    >
                      Measurable (Target)
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Target & Unit if Measurable */}
              {type !== 'boolean' && (
                <View style={styles.numericConfigRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>
                      Daily Target
                    </Text>
                    <TextInput
                      value={target}
                      onChangeText={setTarget}
                      keyboardType="numeric"
                      placeholder="8"
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.surfaceAlt,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1.2 }}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Unit</Text>
                    <TextInput
                      value={unit}
                      onChangeText={setUnit}
                      placeholder="glasses, mins, pages"
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.textInput,
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

              {/* Weekday selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Frequency & Days
                </Text>
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
                            {
                              color: isSelected ? '#FFFFFF' : theme.textSecondary,
                            },
                          ]}
                        >
                          {dayName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Reminder Toggle & Clock Dialer */}
              <View style={styles.inputGroup}>
                <View style={styles.reminderToggleHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Bell size={18} color={theme.primaryLight} />
                    <Text style={[styles.inputLabel, { color: theme.text, marginBottom: 0 }]}>
                      Daily Reminder
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setReminderEnabled(!reminderEnabled)}
                    style={[
                      styles.toggleSwitch,
                      {
                        backgroundColor: reminderEnabled
                          ? theme.primary
                          : theme.surfaceAlt,
                        borderColor: reminderEnabled ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleKnob,
                        {
                          backgroundColor: '#FFFFFF',
                          transform: [{ translateX: reminderEnabled ? 18 : 2 }],
                        },
                      ]}
                    />
                  </Pressable>
                </View>

                {reminderEnabled && (
                  <Pressable
                    onPress={() => setClockPickerTarget('reminder')}
                    style={[
                      styles.reminderTimeCard,
                      {
                        backgroundColor: theme.surfaceAlt,
                        borderColor: theme.primary,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Pick reminder time"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Clock size={18} color={theme.primaryLight} />
                      <Text style={[styles.reminderTimeText, { color: theme.text }]}>
                        {format12Hour(reminderTime)}
                      </Text>
                    </View>
                    <Text
                      style={[styles.reminderTimeChangeText, { color: theme.primaryLight }]}
                    >
                      Change Time
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Action Buttons */}
              <Button
                title="Create Habit & Continue"
                variant="primary"
                size="lg"
                onPress={handleCreateHabit}
                icon={<ArrowRight size={18} color="#FFFFFF" />}
                style={{ marginTop: spacing.md }}
              />

              {/* Option to skip first habit creation */}
              <Pressable
                onPress={handleSkipHabit}
                style={styles.skipButton}
                accessibilityRole="button"
                accessibilityLabel="Skip habit creation for now"
              >
                <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
                  Skip for now, I&apos;ll create a habit later
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        )}

        {/* SCREEN 4: SUCCESS AND DASHBOARD */}
        {step === 4 && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.welcomeScrollContent}
          >
            <Animated.View
              entering={ZoomIn.duration(500)}
              style={styles.welcomeContent}
            >
              {/* Celebration Badge */}
              <View
                style={[
                  styles.successBadge,
                  {
                    backgroundColor: theme.accentDim,
                    borderColor: theme.accent,
                  },
                ]}
              >
                <CheckCircle2 size={52} color={theme.accent} strokeWidth={2.4} />
              </View>

              {/* Friendly Welcome Message */}
              <Text style={[styles.successHeadline, { color: theme.text }]}>
                You&apos;re all set, {displayName}! Let&apos;s build something great.
              </Text>

              <Text style={[styles.description, { color: theme.textSecondary }]}>
                Your personalized profile is configured and ready to keep your routines on
                track every single day.
              </Text>

              {/* Newly Created Habit Card */}
              {habitCreated ? (
                <View
                  style={[
                    styles.createdHabitCard,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: habitCreated.color || theme.primary,
                    },
                  ]}
                >
                  <View style={styles.createdHabitHeader}>
                    <View
                      style={[
                        styles.createdHabitIcon,
                        { backgroundColor: (habitCreated.color || theme.primary) + '25' },
                      ]}
                    >
                      <Icon
                        name={habitCreated.icon}
                        size={22}
                        color={habitCreated.color || theme.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.createdHabitName, { color: theme.text }]}>
                        {habitCreated.name}
                      </Text>
                      <Text
                        style={[
                          styles.createdHabitCategory,
                          { color: habitCreated.color || theme.primaryLight },
                        ]}
                      >
                        {habitCreated.category} •{' '}
                        {habitCreated.type === 'boolean'
                          ? 'Daily Check-in'
                          : `${habitCreated.target} ${habitCreated.unit} / day`}
                      </Text>
                    </View>
                  </View>

                  {habitCreated.reminders && habitCreated.reminders.length > 0 && (
                    <View style={styles.createdHabitReminderRow}>
                      <Clock size={14} color={theme.textSecondary} />
                      <Text
                        style={[
                          styles.createdHabitReminderText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Reminder scheduled for{' '}
                        {format12Hour(habitCreated.reminders[0].time)}
                      </Text>
                    </View>
                  )}
                </View>
              ) : skippedHabit ? (
                <View
                  style={[
                    styles.skippedCard,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Sparkles size={20} color={theme.primaryLight} />
                  <Text style={[styles.skippedText, { color: theme.textSecondary }]}>
                    No problem! You can explore the dashboard and create habits whenever
                    you&apos;re ready.
                  </Text>
                </View>
              ) : null}

              {/* Routine Schedule preview if set */}
              {(hasWakeUpTime || hasBedTime) && (
                <View
                  style={[
                    styles.routineSummaryRow,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {hasWakeUpTime && (
                    <View style={styles.routineSummaryItem}>
                      <Sunrise size={16} color="#FFA07A" />
                      <Text
                        style={[styles.routineSummaryText, { color: theme.textSecondary }]}
                      >
                        Wake-up: {format12Hour(wakeUpTime)}
                      </Text>
                    </View>
                  )}
                  {hasBedTime && (
                    <View style={styles.routineSummaryItem}>
                      <Moon size={16} color="#8B5CF6" />
                      <Text
                        style={[styles.routineSummaryText, { color: theme.textSecondary }]}
                      >
                        Bedtime: {format12Hour(bedTime)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Navigate to Existing Dashboard */}
              <Button
                title="Go to Dashboard"
                variant="primary"
                size="lg"
                onPress={handleFinishOnboarding}
                icon={<ChevronRight size={18} color="#FFFFFF" />}
                style={styles.primaryActionButton}
              />
            </Animated.View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Circular Clock Dialer Modal */}
      {clockPickerTarget !== null && (
        <ClockTimePickerModal
          visible={clockPickerTarget !== null}
          initialTime={
            clockPickerTarget === 'wakeup'
              ? wakeUpTime
              : clockPickerTarget === 'bedtime'
              ? bedTime
              : reminderTime
          }
          title={
            clockPickerTarget === 'wakeup'
              ? 'Select Daily Wake-up Time'
              : clockPickerTarget === 'bedtime'
              ? 'Select Preferred Bedtime'
              : 'Select Reminder Time'
          }
          onConfirm={handleClockConfirm}
          onClose={() => setClockPickerTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  stepIndicatorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  welcomeScrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    alignItems: 'center',
  },
  welcomeContent: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  headline: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresList: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  primaryActionButton: {
    width: '100%',
  },
  formScrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  stepContent: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    paddingTop: spacing.sm,
  },
  screenTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  screenSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginTop: 4,
  },
  timeSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  timeSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeSelectText: {
    fontSize: 14,
  },
  sugChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  sugChipText: {
    fontSize: 13,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catPillText: {
    fontSize: 12,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 3,
  },
  typeSelectorBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelectorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '600',
  },
  numericConfigRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  reminderToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  reminderTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  reminderTimeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
  },
  reminderTimeChangeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  skipButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  successBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successHeadline: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 10,
  },
  createdHabitCard: {
    width: '100%',
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  createdHabitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createdHabitIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createdHabitName: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  createdHabitCategory: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  createdHabitReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  createdHabitReminderText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  skippedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: 16,
  },
  skippedText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  routineSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 24,
  },
  routineSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routineSummaryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});
