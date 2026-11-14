export type HabitCategory =
  | 'Fitness'
  | 'Health'
  | 'Learning'
  | 'Career'
  | 'Productivity'
  | 'Mental Wellness'
  | 'Nutrition'
  | 'Finance'
  | 'Personal Care';

export type HabitType = 'boolean' | 'count' | 'duration' | 'target';

export type Frequency = 'daily' | 'weekly' | 'custom';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export type RoutinePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Reminder {
  id: string;
  time: string; // HH:mm
  days: DayOfWeek[]; // empty = every day
  enabled: boolean;
  title: string;
  message: string;
  sound: boolean;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  type: HabitType;
  frequency: Frequency;
  daysOfWeek: DayOfWeek[]; // for custom/weekly
  target: number; // count/duration/target goal
  unit: string; // e.g. "minutes", "glasses", "pages"
  color: string; // hex color
  icon: string; // lucide icon name
  routine: RoutinePeriod | null;
  startDate: string; // ISO date
  archived: boolean;
  paused: boolean;
  reminders: Reminder[];
  createdAt: number;
  order: number;
}

export interface CompletionEntry {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number; // for boolean = 1, for count/duration/target = actual value
  completedAt: number;
}

export type AchievementType =
  | 'first_habit'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'level_5'
  | 'level_10'
  | 'perfect_day'
  | 'perfect_week'
  | 'habit_master_10'
  | 'early_bird'
  | 'night_owl'
  | 'consistency_king';

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
  progress: number; // 0-100
}

export interface UserStats {
  xp: number;
  challengeXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  perfectDays: number;
  dailyChallengeClaimedDate: string | null;
}

export interface AppPreferences {
  theme: 'dark' | 'light';
  weekStart: DayOfWeek; // 0 = Sunday, 1 = Monday
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  userName: string;
  notificationsEnabled: boolean;
}

export const CATEGORIES: HabitCategory[] = [
  'Fitness',
  'Health',
  'Learning',
  'Career',
  'Productivity',
  'Mental Wellness',
  'Nutrition',
  'Finance',
  'Personal Care',
];

export const CATEGORY_COLORS: Record<HabitCategory, string> = {
  Fitness: '#FF6B6B',
  Health: '#4ECDC4',
  Learning: '#45B7D1',
  Career: '#FFA07A',
  Productivity: '#06D6A0',
  'Mental Wellness': '#B084F2',
  Nutrition: '#F7B801',
  Finance: '#06A77D',
  'Personal Care': '#F6416C',
};

export const ROUTINE_PERIODS: RoutinePeriod[] = ['morning', 'afternoon', 'evening', 'night'];
