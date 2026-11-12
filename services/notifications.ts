import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder, Habit } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleHabitReminder(
  habit: Habit,
  reminder: Reminder
): Promise<string | null> {
  if (!reminder.enabled) return null;
  const [hours, minutes] = reminder.time.split(':').map(Number);
  const weekdays = reminder.days.length > 0 ? reminder.days.map((d) => (d === 0 ? 7 : d)) : [1, 2, 3, 4, 5, 6, 7];

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title || habit.name,
        body: reminder.message || `Time for ${habit.name}`,
        sound: reminder.sound,
        data: { habitId: habit.id, reminderId: reminder.id },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
        weekday: weekdays.length === 7 ? undefined : weekdays[0],
      } as any,
    });
    return id;
  } catch (e) {
    console.error('Failed to schedule reminder', e);
    return null;
  }
}

export async function scheduleAllReminders(habits: Habit[]): Promise<void> {
  await cancelAllReminders();
  for (const habit of habits) {
    if (habit.archived || habit.paused) continue;
    for (const reminder of habit.reminders) {
      if (reminder.enabled) {
        await scheduleHabitReminder(habit, reminder);
      }
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.error('Failed to cancel reminders', e);
  }
}

export async function getScheduledRemindersCount(): Promise<number> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
  } catch {
    return 0;
  }
}

export { Notifications };
