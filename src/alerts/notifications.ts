import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'radar-alerts';
const RADAR_NOTIFICATION_ID = 'radar-alert';

Notifications.setNotificationHandler({
  // In the foreground the alert card is enough; the notification is for the lock screen.
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Creates the Android channel (needed before the Android 13+ permission prompt) and asks for permission. */
export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alertas de radar',
      importance: Notifications.AndroidImportance.HIGH,
      // The app drives vibration itself; the channel stays silent.
      enableVibrate: false,
      sound: null,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}

export async function showRadarNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    identifier: RADAR_NOTIFICATION_ID,
    content: {
      title,
      body,
      sound: false,
      sticky: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}

export async function dismissRadarNotification() {
  await Notifications.dismissNotificationAsync(RADAR_NOTIFICATION_ID);
}
