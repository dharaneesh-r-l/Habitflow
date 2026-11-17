import * as Notifications from 'expo-notifications';
import type { NotificationTriggerInput } from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder, Habit } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowAlert: true,
    shouldPlaySound: notification?.request?.content?.sound !== null,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Habit Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C5CFC',
  }).catch((err) => {
    console.warn('Failed to configure Android notification channel', err);
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.warn('Failed to request notification permissions', e);
    return false;
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleHabitReminder(
  habit: Habit,
  reminder: Reminder
): Promise<string[]> {
  if (!reminder.enabled || Platform.OS === 'web') return [];
  const [hours, minutes] = reminder.time.split(':').map(Number);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    console.error(`Invalid reminder time for habit "${habit.name}": ${reminder.time}`);
    return [];
  }

  try {
    const weekdays = [...new Set(reminder.days)];
    const triggers: NotificationTriggerInput[] =
      weekdays.length === 0 || weekdays.length === 7
        ? [{ type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: hours, minute: minutes, channelId: 'default' }]
        : weekdays.map((day) => ({
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: day === 0 ? 1 : day + 1,
            hour: hours,
            minute: minutes,
            channelId: 'default',
          }));

    return await Promise.all(
      triggers.map((trigger) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title || habit.name,
            body: reminder.message || `Time for ${habit.name}`,
            sound: reminder.sound,
            data: {
              habitflowReminder: true,
              habitId: habit.id,
              reminderId: reminder.id,
            },
          },
          trigger,
        })
      )
    );
  } catch (e) {
    console.error('Failed to schedule reminder', e);
    return [];
  }
}

export async function scheduleAllReminders(habits: Habit[]): Promise<void> {
  if (Platform.OS === 'web' || !(await hasNotificationPermission())) return;
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
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const appReminders = scheduled.filter(
      (notification) => notification.content.data?.habitflowReminder === true
    );
    await Promise.all(
      appReminders.map((notification) =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier)
      )
    );
  } catch (e) {
    console.error('Failed to cancel reminders', e);
  }
}

export async function getScheduledRemindersCount(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.filter(
      (notification) => notification.content.data?.habitflowReminder === true
    ).length;
  } catch {
    return 0;
  }
}

export { Notifications };
