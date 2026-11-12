import { Achievement } from '@/types';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'ach_first', type: 'first_habit', title: 'First Step', description: 'Create your first habit', icon: 'Footprints', unlockedAt: null, progress: 0 },
  { id: 'ach_streak7', type: 'streak_7', title: 'On Fire', description: 'Maintain a 7-day streak', icon: 'Flame', unlockedAt: null, progress: 0 },
  { id: 'ach_streak30', type: 'streak_30', title: 'Unstoppable', description: 'Maintain a 30-day streak', icon: 'TrendingUp', unlockedAt: null, progress: 0 },
  { id: 'ach_streak100', type: 'streak_100', title: 'Legend', description: 'Maintain a 100-day streak', icon: 'Crown', unlockedAt: null, progress: 0 },
  { id: 'ach_level5', type: 'level_5', title: 'Rising Star', description: 'Reach level 5', icon: 'Star', unlockedAt: null, progress: 0 },
  { id: 'ach_level10', type: 'level_10', title: 'Habit Hero', description: 'Reach level 10', icon: 'Award', unlockedAt: null, progress: 0 },
  { id: 'ach_perfect_day', type: 'perfect_day', title: 'Perfect Day', description: 'Complete all habits in one day', icon: 'CheckCircle', unlockedAt: null, progress: 0 },
  { id: 'ach_perfect_week', type: 'perfect_week', title: 'Flawless Week', description: '7 perfect days in a row', icon: 'CalendarCheck', unlockedAt: null, progress: 0 },
  { id: 'ach_habit_master', type: 'habit_master_10', title: 'Habit Master', description: 'Complete 10 different habits', icon: 'Trophy', unlockedAt: null, progress: 0 },
  { id: 'ach_early_bird', type: 'early_bird', title: 'Early Bird', description: 'Complete a morning habit before 7 AM', icon: 'Sunrise', unlockedAt: null, progress: 0 },
  { id: 'ach_night_owl', type: 'night_owl', title: 'Night Owl', description: 'Complete a night routine habit', icon: 'Moon', unlockedAt: null, progress: 0 },
  { id: 'ach_consistency', type: 'consistency_king', title: 'Consistency King', description: '90% completion over 30 days', icon: 'BarChart3', unlockedAt: null, progress: 0 },
];

export const DAILY_CHALLENGES = [
  { id: 'dc1', title: 'Complete 3 habits', xp: 30, target: 3 },
  { id: 'dc2', title: 'Complete all morning habits', xp: 50, target: 0 },
  { id: 'dc3', title: 'Maintain your streak', xp: 40, target: 1 },
  { id: 'dc4', title: 'Complete a habit you missed yesterday', xp: 35, target: 1 },
  { id: 'dc5', title: 'Complete 5 habits today', xp: 60, target: 5 },
];
