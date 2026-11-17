import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  parseISO,
  differenceInCalendarDays,
  addDays,
  subDays,
} from 'date-fns';
import { CompletionEntry, Habit } from '@/types';

export function isCompletionComplete(
  habit: Pick<Habit, 'type' | 'target'>,
  completion?: CompletionEntry
): boolean {
  if (!completion) return false;
  return habit.type === 'boolean' || completion.value >= habit.target;
}

export function getCompletedEntries(
  habit: Pick<Habit, 'id' | 'type' | 'target'>,
  completions: CompletionEntry[]
): CompletionEntry[] {
  return completions.filter(
    (completion) =>
      completion.habitId === habit.id && isCompletionComplete(habit, completion)
  );
}

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseKey(key: string): Date {
  return parseISO(key);
}

export function isHabitScheduledOn(
  habit: { frequency: string; daysOfWeek: number[] },
  date: Date,
  weekStart: number = 1
): boolean {
  if (habit.frequency === 'daily') return true;
  const dow = date.getDay();
  return habit.daysOfWeek.includes(dow);
}

export function getWeekDays(date: Date, weekStart: number = 1): Date[] {
  const start = startOfWeek(date, { weekStartsOn: weekStart as 0 | 1 });
  const end = endOfWeek(date, { weekStartsOn: weekStart as 0 | 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export function calculateStreak(
  completions: { date: string; habitId: string }[],
  habitId: string,
  endDate: Date = new Date()
): number {
  const habitCompletions = completions
    .filter((c) => c.habitId === habitId)
    .map((c) => c.date)
    .sort();

  if (habitCompletions.length === 0) return 0;

  let streak = 0;
  let current = endDate;

  // If today not completed, start from yesterday so streak doesn't break mid-day
  const todayK = todayKey();
  if (!habitCompletions.includes(todayK)) {
    current = subDays(endDate, 1);
  }

  while (true) {
    const key = dateKey(current);
    if (habitCompletions.includes(key)) {
      streak++;
      current = subDays(current, 1);
    } else {
      break;
    }
  }
  return streak;
}

export function calculateLongestStreak(
  completions: { date: string; habitId: string }[],
  habitId: string
): number {
  const dates = completions
    .filter((c) => c.habitId === habitId)
    .map((c) => c.date)
    .sort()
    .map((d) => parseKey(d));

  if (dates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(dates[i], dates[i - 1]);
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

export function formatDateLabel(date: Date): string {
  return format(date, 'EEEE, MMMM d');
}

export function formatShortDate(date: Date): string {
  return format(date, 'MMM d');
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function getXPForLevel(level: number): number {
  return level * 100 + (level - 1) * 50;
}

export function getLevelFromXP(xp: number): { level: number; currentLevelXP: number; nextLevelXP: number; progress: number } {
  const safeXP = Math.max(0, xp);
  let level = 1;
  let remaining = safeXP;
  while (remaining >= getXPForLevel(level)) {
    remaining -= getXPForLevel(level);
    level++;
  }
  const nextLevelXP = getXPForLevel(level);
  return {
    level,
    currentLevelXP: remaining,
    nextLevelXP,
    progress: nextLevelXP > 0 ? Math.min(1, Math.max(0, remaining / nextLevelXP)) : 0,
  };
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(dateKey(subDays(new Date(), i)));
  }
  return days;
}

export function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    days.push(dateKey(subDays(new Date(), i)));
  }
  return days;
}
