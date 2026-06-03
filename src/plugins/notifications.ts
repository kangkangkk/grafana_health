import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from './health';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative) return true;
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

export async function scheduleCheckupReminder(title: string, body: string, at: Date): Promise<void> {
  if (!isNative) return;
  await LocalNotifications.schedule({
    notifications: [{
      title,
      body,
      id: Date.now(),
      schedule: { at },
    }],
  });
}

export async function scheduleDailyReminder(title: string, body: string, hour: number, minute: number): Promise<void> {
  if (!isNative) return;
  await LocalNotifications.schedule({
    notifications: [{
      title,
      body,
      id: Date.now(),
      schedule: { on: { hour, minute } },
    }],
  });
}
