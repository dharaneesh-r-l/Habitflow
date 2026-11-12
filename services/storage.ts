import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HABITS: 'habitflow_habits',
  COMPLETIONS: 'habitflow_completions',
  PREFERENCES: 'habitflow_preferences',
  ACHIEVEMENTS: 'habitflow_achievements',
  STATS: 'habitflow_stats',
  SEEDED: 'habitflow_seeded',
};

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error', e);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error', e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (e) {
      console.error('Storage clear error', e);
    }
  },

  KEYS,
};
