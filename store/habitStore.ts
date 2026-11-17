import { create } from 'zustand';
import { Habit, CompletionEntry, AppPreferences, Achievement, UserStats, DayOfWeek } from '@/types';
import { storage } from '@/services/storage';
import { ACHIEVEMENTS, DAILY_CHALLENGES } from '@/data/achievements';
import { HABIT_LIBRARY } from '@/data/habitLibrary';
import {
  uid,
  todayKey,
  dateKey,
  calculateStreak,
  calculateLongestStreak,
  getLevelFromXP,
  isHabitScheduledOn,
  isCompletionComplete,
  getCompletedEntries,
} from '@/utils/date';
import {
  cancelAllReminders,
  hasNotificationPermission,
  requestNotificationPermissions,
  scheduleAllReminders,
} from '@/services/notifications';

const DEFAULT_PREFS: AppPreferences = {
  theme: 'dark',
  weekStart: 1,
  soundEnabled: true,
  hapticsEnabled: true,
  userName: 'there',
  notificationsEnabled: true,
};

const DEFAULT_STATS: UserStats = {
  xp: 0,
  challengeXP: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  totalCompletions: 0,
  perfectDays: 0,
  dailyChallengeClaimedDate: null,
};

interface HabitState {
  habits: Habit[];
  completions: CompletionEntry[];
  preferences: AppPreferences;
  achievements: Achievement[];
  stats: UserStats;
  loaded: boolean;

  init: () => Promise<void>;
  seedSampleData: () => Promise<void>;

  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'order'>) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string, archived: boolean) => Promise<void>;
  pauseHabit: (id: string, paused: boolean) => Promise<void>;
  reorderHabits: (habits: Habit[]) => Promise<void>;

  logCompletion: (habitId: string, value: number) => Promise<void>;
  toggleCompletion: (habitId: string) => Promise<void>;
  removeCompletion: (habitId: string, date: string) => Promise<void>;
  getCompletionsForDate: (date: string) => CompletionEntry[];
  getCompletionForHabitOnDate: (habitId: string, date: string) => CompletionEntry | undefined;
  isHabitCompleteOn: (habitId: string, date: string) => boolean;

  getTodayCompletionRate: () => number;
  getCompletionRateForDate: (date: string) => number;
  getScheduledHabitsForDate: (date: Date) => Habit[];
  getActiveHabits: () => Habit[];

  updatePreferences: (updates: Partial<AppPreferences>) => Promise<void>;
  unlockAchievement: (type: string) => void;
  resetAllData: () => Promise<void>;
  exportData: () => string;
}

function generateSampleHabits(): Habit[] {
  const selected = HABIT_LIBRARY.slice(0, 8);
  return selected.map((lib, i) => ({
    id: uid(),
    name: lib.name,
    description: lib.description,
    category: lib.category,
    type: lib.type,
    frequency: lib.frequency,
    daysOfWeek: lib.daysOfWeek as DayOfWeek[],
    target: lib.target,
    unit: lib.unit,
    color: lib.color,
    icon: lib.icon,
    routine: lib.routine,
    startDate: todayKey(),
    archived: false,
    paused: false,
    reminders: lib.suggestedReminders.map((r) => ({
      id: uid(),
      time: r.time,
      days: lib.daysOfWeek as DayOfWeek[],
      enabled: true,
      title: lib.name,
      message: r.message,
      sound: true,
    })),
    createdAt: Date.now() - i * 1000,
    order: i,
  }));
}

function generateSampleCompletions(habits: Habit[]): CompletionEntry[] {
  const completions: CompletionEntry[] = [];
  const now = new Date();
  for (let d = 14; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dKey = dateKey(date);
    habits.forEach((h) => {
      if (!isHabitScheduledOn(h, date)) return;
      // Random ~70% completion rate
      if (Math.random() > 0.3) {
        completions.push({
          id: uid(),
          habitId: h.id,
          date: dKey,
          value: h.type === 'boolean' ? 1 : Math.round(h.target * (0.8 + Math.random() * 0.3)),
          completedAt: date.getTime(),
        });
      }
    });
  }
  return completions;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  completions: [],
  preferences: DEFAULT_PREFS,
  achievements: ACHIEVEMENTS,
  stats: DEFAULT_STATS,
  loaded: false,

  init: async () => {
    try {
      const [habits, completions, prefs, achievements, stats, seeded] = await Promise.all([
        storage.get<Habit[]>(storage.KEYS.HABITS),
        storage.get<CompletionEntry[]>(storage.KEYS.COMPLETIONS),
        storage.get<AppPreferences>(storage.KEYS.PREFERENCES),
        storage.get<Achievement[]>(storage.KEYS.ACHIEVEMENTS),
        storage.get<UserStats>(storage.KEYS.STATS),
        storage.get<boolean>(storage.KEYS.SEEDED),
      ]);

      if (!prefs) {
        await storage.set(storage.KEYS.PREFERENCES, DEFAULT_PREFS);
      }

      if (!seeded && (!habits || habits.length === 0)) {
        const sampleHabits = generateSampleHabits();
        const sampleCompletions = generateSampleCompletions(sampleHabits);
        const sampleStats = computeStats(sampleHabits, sampleCompletions);
        await storage.set(storage.KEYS.HABITS, sampleHabits);
        await storage.set(storage.KEYS.COMPLETIONS, sampleCompletions);
        await storage.set(storage.KEYS.STATS, sampleStats);
        await storage.set(storage.KEYS.SEEDED, true);
        set({ habits: sampleHabits, completions: sampleCompletions, stats: sampleStats, preferences: prefs || DEFAULT_PREFS, achievements: achievements || ACHIEVEMENTS, loaded: true });
      } else {
        set({
          habits: habits || [],
          completions: completions || [],
          preferences: prefs || DEFAULT_PREFS,
          achievements: achievements || ACHIEVEMENTS,
          stats: stats || DEFAULT_STATS,
          loaded: true,
        });
      }

      recalcStats(set, get);
      claimDailyChallenge(set, get);
      checkAchievements(set, get);
      const preferences = get().preferences;
      if (preferences.notificationsEnabled && (await hasNotificationPermission())) {
        await scheduleAllReminders(get().habits);
      }
    } catch (e) {
      console.warn('Failed to initialize habit store', e);
      set({ loaded: true });
    }
  },

  seedSampleData: async () => {
    const sampleHabits = generateSampleHabits();
    const sampleCompletions = generateSampleCompletions(sampleHabits);
    const sampleStats = computeStats(sampleHabits, sampleCompletions);
    await storage.set(storage.KEYS.HABITS, sampleHabits);
    await storage.set(storage.KEYS.COMPLETIONS, sampleCompletions);
    await storage.set(storage.KEYS.STATS, sampleStats);
    await storage.set(storage.KEYS.SEEDED, true);
    set({ habits: sampleHabits, completions: sampleCompletions, stats: sampleStats });
  },

  addHabit: async (habitData) => {
    const habit: Habit = {
      ...habitData,
      id: uid(),
      createdAt: Date.now(),
      order: get().habits.length,
    };
    const habits = [...get().habits, habit];
    set({ habits });
    await storage.set(storage.KEYS.HABITS, habits);
    get().unlockAchievement('first_habit');
    await syncReminders(get);
    return habit;
  },

  updateHabit: async (id, updates) => {
    const habits = get().habits.map((h) => (h.id === id ? { ...h, ...updates } : h));
    set({ habits });
    await storage.set(storage.KEYS.HABITS, habits);
    await syncReminders(get);
  },

  deleteHabit: async (id) => {
    const habits = get().habits.filter((h) => h.id !== id);
    const completions = get().completions.filter((c) => c.habitId !== id);
    set({ habits, completions });
    await storage.set(storage.KEYS.HABITS, habits);
    await storage.set(storage.KEYS.COMPLETIONS, completions);
    recalcStats(set, get);
    await syncReminders(get);
  },

  archiveHabit: async (id, archived) => {
    await get().updateHabit(id, { archived });
  },

  pauseHabit: async (id, paused) => {
    await get().updateHabit(id, { paused });
  },

  reorderHabits: async (newHabits) => {
    const habits = newHabits.map((h, i) => ({ ...h, order: i }));
    set({ habits });
    await storage.set(storage.KEYS.HABITS, habits);
  },

  logCompletion: async (habitId, value) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;
    const dKey = todayKey();
    const existing = get().completions.find((c) => c.habitId === habitId && c.date === dKey);
    let completions: CompletionEntry[];
    if (existing) {
      completions = get().completions.map((c) =>
        c.id === existing.id ? { ...c, value, completedAt: Date.now() } : c
      );
    } else {
      completions = [...get().completions, { id: uid(), habitId, date: dKey, value, completedAt: Date.now() }];
    }
    set({ completions });
    await storage.set(storage.KEYS.COMPLETIONS, completions);
    recalcStats(set, get);
    claimDailyChallenge(set, get);
    checkAchievements(set, get);
  },

  toggleCompletion: async (habitId) => {
    const dKey = todayKey();
    const existing = get().completions.find((c) => c.habitId === habitId && c.date === dKey);
    if (existing) {
      const completions = get().completions.filter((c) => c.id !== existing.id);
      set({ completions });
      await storage.set(storage.KEYS.COMPLETIONS, completions);
    } else {
      await get().logCompletion(habitId, 1);
    }
    recalcStats(set, get);
  },

  removeCompletion: async (habitId, date) => {
    const completions = get().completions.filter((c) => !(c.habitId === habitId && c.date === date));
    set({ completions });
    await storage.set(storage.KEYS.COMPLETIONS, completions);
    recalcStats(set, get);
  },

  getCompletionsForDate: (date) => get().completions.filter((c) => c.date === date),

  getCompletionForHabitOnDate: (habitId, date) =>
    get().completions.find((c) => c.habitId === habitId && c.date === date),

  isHabitCompleteOn: (habitId, date) =>
    (() => {
      const habit = get().habits.find((item) => item.id === habitId);
      const completion = get().completions.find((item) => item.habitId === habitId && item.date === date);
      return !!habit && isCompletionComplete(habit, completion);
    })(),

  getTodayCompletionRate: () => {
    const today = new Date();
    const dKey = todayKey();
    const scheduled = get().getScheduledHabitsForDate(today);
    if (scheduled.length === 0) return 0;
    const completed = get().completions.filter((completion) => {
      const habit = scheduled.find((item) => item.id === completion.habitId);
      return completion.date === dKey && !!habit && isCompletionComplete(habit, completion);
    });
    return Math.round((completed.length / scheduled.length) * 100);
  },

  getCompletionRateForDate: (date) => {
    const d = new Date(date + 'T00:00:00');
    const scheduled = get().getScheduledHabitsForDate(d);
    if (scheduled.length === 0) return 0;
    const completed = get().completions.filter((completion) => {
      const habit = scheduled.find((item) => item.id === completion.habitId);
      return completion.date === date && !!habit && isCompletionComplete(habit, completion);
    });
    return Math.round((completed.length / scheduled.length) * 100);
  },

  getScheduledHabitsForDate: (date) => {
    return get().habits.filter(
      (h) => !h.archived && !h.paused && isHabitScheduledOn(h, date, get().preferences.weekStart)
    );
  },

  getActiveHabits: () => get().habits.filter((h) => !h.archived && !h.paused),

  updatePreferences: async (updates) => {
    const current = get().preferences;
    if (updates.notificationsEnabled === true && !current.notificationsEnabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        throw new Error('Notification permission was not granted');
      }
    }

    const preferences = { ...get().preferences, ...updates };
    set({ preferences });
    await storage.set(storage.KEYS.PREFERENCES, preferences);
    if (updates.notificationsEnabled !== undefined) {
      if (preferences.notificationsEnabled) {
        await scheduleAllReminders(get().habits);
      } else {
        await cancelAllReminders();
      }
    }
  },

  unlockAchievement: (type) => {
    const achievements = get().achievements.map((a) =>
      a.type === type && !a.unlockedAt ? { ...a, unlockedAt: Date.now(), progress: 100 } : a
    );
    set({ achievements });
    storage.set(storage.KEYS.ACHIEVEMENTS, achievements);
  },

  resetAllData: async () => {
    await cancelAllReminders();
    await storage.clearAll();
    set({ habits: [], completions: [], preferences: DEFAULT_PREFS, achievements: ACHIEVEMENTS, stats: DEFAULT_STATS });
  },

  exportData: () => {
    const { habits, completions, preferences, achievements, stats } = get();
    return JSON.stringify({ habits, completions, preferences, achievements, stats, exportedAt: new Date().toISOString() }, null, 2);
  },
}));

function computeStats(
  habits: Habit[],
  completions: CompletionEntry[],
  challengeXP = 0,
  dailyChallengeClaimedDate: string | null = null
): UserStats {
  let xp = challengeXP;
  const activeHabits = habits.filter((h) => !h.archived);
  activeHabits.forEach((h) => {
    const habitCompletions = getCompletedEntries(h, completions);
    xp += habitCompletions.length * 10;
  });

  const allStreaks = activeHabits.map((h) =>
    calculateStreak(getCompletedEntries(h, completions), h.id)
  );
  const allLongest = activeHabits.map((h) =>
    calculateLongestStreak(getCompletedEntries(h, completions), h.id)
  );
  const currentStreak = allStreaks.length > 0 ? Math.max(...allStreaks) : 0;
  const longestStreak = allLongest.length > 0 ? Math.max(...allLongest) : 0;

  const levelInfo = getLevelFromXP(xp);
  const completedEntries = completions.filter((completion) => {
    const habit = habits.find((item) => item.id === completion.habitId);
    return !!habit && isCompletionComplete(habit, completion);
  });
  const totalCompletions = completedEntries.length;

  // perfect days
  let perfectDays = 0;
  const dateSet = new Set(completedEntries.map((c) => c.date));
  dateSet.forEach((d) => {
    const date = new Date(d + 'T00:00:00');
    const scheduled = activeHabits.filter((h) => isHabitScheduledOn(h, date));
    if (scheduled.length > 0) {
      const completed = scheduled.every((h) =>
        isCompletionComplete(
          h,
          completions.find((c) => c.habitId === h.id && c.date === d)
        )
      );
      if (completed) perfectDays++;
    }
  });

  return {
    xp,
    challengeXP,
    level: levelInfo.level,
    currentStreak,
    longestStreak,
    totalCompletions,
    perfectDays,
    dailyChallengeClaimedDate,
  };
}

function recalcStats(
  set: (partial: Partial<HabitState>) => void,
  get: () => HabitState
) {
  const stats = computeStats(
    get().habits,
    get().completions,
    get().stats.challengeXP ?? 0,
    get().stats.dailyChallengeClaimedDate ?? null
  );
  set({ stats });
  storage.set(storage.KEYS.STATS, stats);
}

function claimDailyChallenge(
  set: (partial: Partial<HabitState>) => void,
  get: () => HabitState
) {
  const date = todayKey();
  const stats = get().stats;
  const challenge = DAILY_CHALLENGES[0];
  if (stats.dailyChallengeClaimedDate === date) return;

  const scheduled = get().getScheduledHabitsForDate(new Date());
  const completedCount = scheduled.filter((habit) =>
    isCompletionComplete(
      habit,
      get().completions.find((completion) => completion.habitId === habit.id && completion.date === date)
    )
  ).length;
  if (completedCount < challenge.target) return;

  const updatedStats = computeStats(
    get().habits,
    get().completions,
    (stats.challengeXP ?? 0) + challenge.xp,
    date
  );
  set({ stats: updatedStats });
  storage.set(storage.KEYS.STATS, updatedStats);
}

function checkAchievements(
  set: (partial: Partial<HabitState>) => void,
  get: () => HabitState
) {
  const { stats, habits, completions } = get();
  const unlock = (type: string) => {
    const ach = get().achievements.find((a) => a.type === type);
    if (ach && !ach.unlockedAt) get().unlockAchievement(type);
  };

  if (habits.length >= 1) unlock('first_habit');
  if (stats.currentStreak >= 7) unlock('streak_7');
  if (stats.currentStreak >= 30) unlock('streak_30');
  if (stats.currentStreak >= 100) unlock('streak_100');
  if (stats.level >= 5) unlock('level_5');
  if (stats.level >= 10) unlock('level_10');
  if (stats.perfectDays >= 1) unlock('perfect_day');
  if (stats.perfectDays >= 7) unlock('perfect_week');

  const uniqueCompleted = new Set(
    completions
      .filter((completion) => {
        const habit = habits.find((item) => item.id === completion.habitId);
        return !!habit && isCompletionComplete(habit, completion);
      })
      .map((completion) => completion.habitId)
  );
  if (uniqueCompleted.size >= 10) unlock('habit_master_10');
}

function syncReminders(get: () => HabitState): Promise<void> {
  return get().preferences.notificationsEnabled
    ? scheduleAllReminders(get().habits)
    : Promise.resolve();
}
