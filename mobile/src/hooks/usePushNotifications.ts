import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../api';
import { useAuthStore } from '../store/auth.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const notifListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!user) return;

    registerForPush().then((token) => {
      if (token) {
        authApi.registerPushToken(token, Platform.OS as 'ios' | 'android').catch(() => {
          // Silently fail — push is non-critical
        });
      }
    });

    notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.jobSlug) router.push(`/jobs/${data.jobSlug}`);
      else if (data?.screen) router.push(data.screen as never);
      else router.push('/(tabs)/notifications');
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);
}

async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}
