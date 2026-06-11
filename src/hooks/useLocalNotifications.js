import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function useLocalNotifications() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    async function schedule() {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const { display } = await LocalNotifications.checkPermissions();
        let granted = display === 'granted';

        if (!granted) {
          const result = await LocalNotifications.requestPermissions();
          granted = result.display === 'granted';
        }

        if (!granted) return;

        // Cancel any existing schedule to avoid duplicates
        const pending = await LocalNotifications.getPending();
        const existing = pending.notifications.filter(n => n.id === 1);
        if (existing.length) return; // already scheduled

        const at = new Date();
        at.setHours(9, 0, 0, 0);
        if (at <= new Date()) at.setDate(at.getDate() + 1); // tomorrow if past 9 AM

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1,
              title: 'MealBox — Kitchen Time 🍳',
              body: "Open the app to see today's cook sheet",
              schedule: { at, repeats: true, every: 'day' },
              sound: 'default',
              smallIcon: 'ic_launcher',
            },
          ],
        });
      } catch (err) {
        console.error('Notification schedule error:', err);
      }
    }

    schedule();
  }, []);
}
