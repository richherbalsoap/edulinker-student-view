import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { apiClient } from './apiClient';

export async function initFCM(studentId: string) {
  if (!Capacitor.isNativePlatform()) {
    console.log("Push notifications are only available on native Android/iOS");
    return;
  }

  try {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('User denied push permission');
      return;
    }

    // Register with Apple / Google to receive tokens
    await PushNotifications.register();

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      try {
        // Send token to our Cloudflare backend
        const res = await fetch(`${apiClient.baseUrl}/api/fcm/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId, token: token.value })
        });
        const data = await res.json();
        console.log("FCM Token registered on backend:", data);
      } catch (e) {
        console.error("Failed to register FCM token to backend", e);
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Listen for incoming pushes
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
      
      // Dispatch a global event so that useRealtimeSubscription can catch it
      const event = new CustomEvent('realtime-update', { 
        detail: notification.data 
      });
      window.dispatchEvent(event);
    });

  } catch (error) {
    console.error("Failed to initialize FCM:", error);
  }
}
