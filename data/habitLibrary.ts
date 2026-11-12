import { HabitCategory, HabitType, RoutinePeriod } from '@/types';

export interface LibraryHabit {
  name: string;
  description: string;
  category: HabitCategory;
  type: HabitType;
  target: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'custom';
  daysOfWeek: number[];
  color: string;
  icon: string;
  routine: RoutinePeriod | null;
  suggestedReminders: { time: string; message: string }[];
}

export const HABIT_LIBRARY: LibraryHabit[] = [
  // Fitness
  { name: 'Morning Run', description: 'Start your day with a cardio run', category: 'Fitness', type: 'duration', target: 30, unit: 'minutes', frequency: 'daily', daysOfWeek: [1,2,3,4,5], color: '#FF6B6B', icon: 'Footprints', routine: 'morning', suggestedReminders: [{ time: '06:30', message: 'Time for your morning run!' }] },
  { name: 'Push-ups', description: 'Build upper body strength', category: 'Fitness', type: 'count', target: 50, unit: 'reps', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#FF6B6B', icon: 'Dumbbell', routine: 'morning', suggestedReminders: [{ time: '07:00', message: 'Get those push-ups in!' }] },
  { name: 'Yoga Session', description: 'Improve flexibility and mindfulness', category: 'Fitness', type: 'duration', target: 20, unit: 'minutes', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#FF6B6B', icon: 'Flower2', routine: 'morning', suggestedReminders: [{ time: '07:00', message: 'Roll out your yoga mat' }] },
  { name: '10K Steps', description: 'Walk 10,000 steps daily', category: 'Fitness', type: 'target', target: 10000, unit: 'steps', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#FF6B6B', icon: 'Footprints', routine: null, suggestedReminders: [{ time: '18:00', message: 'Check your step count' }] },
  { name: 'Gym Workout', description: 'Strength training session', category: 'Fitness', type: 'duration', target: 60, unit: 'minutes', frequency: 'custom', daysOfWeek: [1,3,5], color: '#FF6B6B', icon: 'Dumbbell', routine: 'evening', suggestedReminders: [{ time: '17:30', message: 'Time to hit the gym' }] },
  { name: 'Stretching', description: 'Prevent injury with daily stretches', category: 'Fitness', type: 'duration', target: 10, unit: 'minutes', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#FF6B6B', icon: 'Activity', routine: 'night', suggestedReminders: [{ time: '21:00', message: 'Wind down with stretches' }] },

  // Health
  { name: 'Drink Water', description: 'Stay hydrated with 8 glasses of water', category: 'Health', type: 'count', target: 8, unit: 'glasses', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#4ECDC4', icon: 'Droplets', routine: null, suggestedReminders: [{ time: '09:00', message: 'Have a glass of water' }, { time: '13:00', message: 'Stay hydrated!' }] },
  { name: 'Sleep 8 Hours', description: 'Get quality rest each night', category: 'Health', type: 'target', target: 8, unit: 'hours', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#4ECDC4', icon: 'Moon', routine: 'night', suggestedReminders: [{ time: '22:00', message: 'Time to wind down for sleep' }] },
  { name: 'Take Vitamins', description: 'Daily supplement routine', category: 'Health', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#4ECDC4', icon: 'Pill', routine: 'morning', suggestedReminders: [{ time: '08:00', message: 'Take your vitamins' }] },
  { name: 'Meditation', description: 'Calm your mind with daily meditation', category: 'Health', type: 'duration', target: 15, unit: 'minutes', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#4ECDC4', icon: 'Brain', routine: 'morning', suggestedReminders: [{ time: '07:30', message: 'Begin your meditation' }] },
  { name: 'Deep Breathing', description: 'Practice breathing exercises', category: 'Health', type: 'duration', target: 5, unit: 'minutes', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#4ECDC4', icon: 'Wind', routine: 'afternoon', suggestedReminders: [{ time: '14:00', message: 'Take a breathing break' }] },

  // Learning
  { name: 'Read 30 Minutes', description: 'Read a book to expand knowledge', category: 'Learning', type: 'duration', target: 30, unit: 'minutes', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#45B7D1', icon: 'BookOpen', routine: 'evening', suggestedReminders: [{ time: '20:00', message: 'Time to read' }] },
  { name: 'Learn a Language', description: 'Practice a new language', category: 'Learning', type: 'duration', target: 20, unit: 'minutes', frequency: 'daily', daysOfWeek: [1,2,3,4,5], color: '#45B7D1', icon: 'Languages', routine: 'afternoon', suggestedReminders: [{ time: '12:30', message: 'Practice your language skills' }] },
  { name: 'Study Coding', description: 'Code or learn programming', category: 'Learning', type: 'duration', target: 45, unit: 'minutes', frequency: 'daily', daysOfWeek: [1,2,3,4,5], color: '#45B7D1', icon: 'Code', routine: 'evening', suggestedReminders: [{ time: '19:00', message: 'Code something new' }] },
  { name: 'Watch Educational Video', description: 'Learn from online content', category: 'Learning', type: 'duration', target: 20, unit: 'minutes', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#45B7D1', icon: 'PlayCircle', routine: 'afternoon', suggestedReminders: [{ time: '15:00', message: 'Watch something educational' }] },
  { name: 'Write Journal', description: 'Reflect on your day in writing', category: 'Learning', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#45B7D1', icon: 'PenLine', routine: 'night', suggestedReminders: [{ time: '21:30', message: 'Write in your journal' }] },

  // Career
  { name: 'Plan Tomorrow', description: 'Set goals for the next day', category: 'Career', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#FFA07A', icon: 'ClipboardList', routine: 'evening', suggestedReminders: [{ time: '20:30', message: 'Plan out tomorrow' }] },
  { name: 'Network Outreach', description: 'Connect with a professional contact', category: 'Career', type: 'count', target: 3, unit: 'people', frequency: 'weekly', daysOfWeek: [1,2,3,4,5], color: '#FFA07A', icon: 'Users', routine: 'afternoon', suggestedReminders: [{ time: '11:00', message: 'Reach out to someone new' }] },
  { name: 'Skill Building', description: 'Work on a professional skill', category: 'Career', type: 'duration', target: 30, unit: 'minutes', frequency: 'daily', daysOfWeek: [1,2,3,4,5], color: '#FFA07A', icon: 'TrendingUp', routine: 'evening', suggestedReminders: [{ time: '18:30', message: 'Build a skill' }] },
  { name: 'Update Resume', description: 'Keep your resume current', category: 'Career', type: 'boolean', target: 1, unit: 'done', frequency: 'weekly', daysOfWeek: [6], color: '#FFA07A', icon: 'FileText', routine: 'afternoon', suggestedReminders: [{ time: '14:00', message: 'Update your resume' }] },
  { name: 'Inbox Zero', description: 'Clear your email inbox', category: 'Career', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [1,2,3,4,5], color: '#FFA07A', icon: 'Inbox', routine: 'morning', suggestedReminders: [{ time: '09:00', message: 'Tackle your inbox' }] },

  // Productivity
  { name: 'Deep Work', description: 'Focused work without distractions', category: 'Productivity', type: 'duration', target: 90, unit: 'minutes', frequency: 'daily', daysOfWeek: [1,2,3,4,5], color: '#06D6A0', icon: 'Target', routine: 'morning', suggestedReminders: [{ time: '09:30', message: 'Start your deep work session' }] },
  { name: 'Task Review', description: 'Review and prioritize tasks', category: 'Productivity', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#06D6A0', icon: 'CheckSquare', routine: 'morning', suggestedReminders: [{ time: '08:30', message: 'Review your tasks' }] },
  { name: 'No Procrastination', description: 'Avoid delaying important tasks', category: 'Productivity', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#06D6A0', icon: 'Zap', routine: null, suggestedReminders: [] },
  { name: 'Time Blocking', description: 'Plan your day in time blocks', category: 'Productivity', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [1,2,3,4,5], color: '#06D6A0', icon: 'Clock', routine: 'morning', suggestedReminders: [{ time: '08:00', message: 'Block out your time' }] },
  { name: 'Inbox Processing', description: 'Process communications efficiently', category: 'Productivity', type: 'count', target: 10, unit: 'messages', frequency: 'daily', daysOfWeek: [1,2,3,4,5], color: '#06D6A0', icon: 'Mail', routine: 'afternoon', suggestedReminders: [{ time: '13:30', message: 'Process your inbox' }] },

  // Mental Wellness
  { name: 'Gratitude Practice', description: 'Write 3 things you are grateful for', category: 'Mental Wellness', type: 'count', target: 3, unit: 'items', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#B084F2', icon: 'Heart', routine: 'morning', suggestedReminders: [{ time: '07:00', message: 'What are you grateful for?' }] },
  { name: 'Mindfulness Check-in', description: 'Pause and be present', category: 'Mental Wellness', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#B084F2', icon: 'Sparkles', routine: 'afternoon', suggestedReminders: [{ time: '12:00', message: 'Take a mindful moment' }] },
  { name: 'Digital Detox', description: 'Time away from screens', category: 'Mental Wellness', type: 'duration', target: 60, unit: 'minutes', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#B084F2', icon: 'Smartphone', routine: 'evening', suggestedReminders: [{ time: '19:00', message: 'Unplug for an hour' }] },
  { name: 'Self Affirmation', description: 'Positive self-talk practice', category: 'Mental Wellness', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#B084F2', icon: 'Smile', routine: 'morning', suggestedReminders: [{ time: '06:45', message: 'Say something kind to yourself' }] },
  { name: 'Emotional Check-in', description: 'Track your mood and feelings', category: 'Mental Wellness', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#B084F2', icon: 'Mood', routine: 'night', suggestedReminders: [{ time: '21:00', message: 'How are you feeling?' }] },

  // Nutrition
  { name: 'Eat Breakfast', description: 'Never skip the most important meal', category: 'Nutrition', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#F7B801', icon: 'Coffee', routine: 'morning', suggestedReminders: [{ time: '08:00', message: 'Have a healthy breakfast' }] },
  { name: 'Eat Vegetables', description: 'Get your daily greens', category: 'Nutrition', type: 'count', target: 5, unit: 'servings', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#F7B801', icon: 'Apple', routine: null, suggestedReminders: [{ time: '12:00', message: 'Eat your veggies' }] },
  { name: 'No Sugar', description: 'Avoid added sugars for the day', category: 'Nutrition', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#F7B801', icon: 'Ban', routine: null, suggestedReminders: [{ time: '10:00', message: 'Skip the sugar today' }] },
  { name: 'Cook at Home', description: 'Prepare your own meal', category: 'Nutrition', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#F7B801', icon: 'ChefHat', routine: 'evening', suggestedReminders: [{ time: '18:00', message: 'Cook dinner at home' }] },
  { name: 'Track Calories', description: 'Log your daily food intake', category: 'Nutrition', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#F7B801', icon: 'Scale', routine: 'night', suggestedReminders: [{ time: '20:00', message: 'Log your meals' }] },

  // Finance
  { name: 'Track Expenses', description: 'Log all spending for the day', category: 'Finance', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#06A77D', icon: 'Receipt', routine: 'evening', suggestedReminders: [{ time: '19:30', message: 'Track your expenses' }] },
  { name: 'Save Money', description: 'Set aside money for savings', category: 'Finance', type: 'target', target: 50, unit: 'dollars', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#06A77D', icon: 'PiggyBank', routine: 'evening', suggestedReminders: [{ time: '19:00', message: 'Add to your savings' }] },
  { name: 'Budget Review', description: 'Review your weekly budget', category: 'Finance', type: 'boolean', target: 1, unit: 'done', frequency: 'weekly', daysOfWeek: [0], color: '#06A77D', icon: 'Wallet', routine: 'afternoon', suggestedReminders: [{ time: '15:00', message: 'Review your budget' }] },
  { name: 'Investment Check', description: 'Monitor your investments', category: 'Finance', type: 'boolean', target: 1, unit: 'done', frequency: 'weekly', daysOfWeek: [6], color: '#06A77D', icon: 'LineChart', routine: 'morning', suggestedReminders: [{ time: '10:00', message: 'Check your portfolio' }] },

  // Personal Care
  { name: 'Skincare Routine', description: 'Morning and evening skincare', category: 'Personal Care', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#F6416C', icon: 'Sparkles', routine: 'morning', suggestedReminders: [{ time: '07:00', message: 'Do your skincare routine' }] },
  { name: 'Floss Teeth', description: 'Daily dental care', category: 'Personal Care', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#F6416C', icon: 'Smile', routine: 'night', suggestedReminders: [{ time: '22:00', message: 'Remember to floss' }] },
  { name: 'Cold Shower', description: 'Boost circulation with cold exposure', category: 'Personal Care', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [1,2,3,4,5], color: '#F6416C', icon: 'ShowerIcon', routine: 'morning', suggestedReminders: [{ time: '06:45', message: 'Take a cold shower' }] },
  { name: 'Tidy Up', description: 'Clean and organize your space', category: 'Personal Care', type: 'duration', target: 15, unit: 'minutes', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#F6416C', icon: 'Trash2', routine: 'evening', suggestedReminders: [{ time: '18:30', message: 'Tidy your space' }] },
  { name: 'Personal Grooming', description: 'Take care of your appearance', category: 'Personal Care', type: 'boolean', target: 1, unit: 'done', frequency: 'daily', daysOfWeek: [0,1,2,3,4,5,6], color: '#F6416C', icon: 'Scissors', routine: 'morning', suggestedReminders: [{ time: '07:15', message: 'Grooming time' }] },
];
