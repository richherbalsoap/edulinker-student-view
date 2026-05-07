import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

const firebaseConfig = {
  apiKey: "AIzaSyB9wHnIbjKNjSZMPHJ0lhkqmy7Dk4upHPI",
  authDomain: "solid-depot-483510-d6.firebaseapp.com",
  projectId: "solid-depot-483510-d6",
  storageBucket: "solid-depot-483510-d6.firebasestorage.app",
  messagingSenderId: "294595063850",
  appId: "1:294595063850:web:b1c75cd017781c8ab91353",
  measurementId: "G-YCXJ9BHN95",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Capacitor Android/iOS
    if (Capacitor.isNativePlatform()) {
      await PushNotifications.requestPermissions();
      await PushNotifications.register();

      return new Promise((resolve) => {
        PushNotifications.addListener("registration", (token) => {
          console.log("Capacitor FCM Token:", token.value);
          resolve(token.value);
        });
        PushNotifications.addListener("registrationError", (err) => {
          console.error("Capacitor registration error:", err);
          resolve(null);
        });
      });
    }

    // Web/PWA
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BLoKIG-AEZukS3xro0TaRuiKppU4vq8svzmdqTRoTYVkCie0fh1_qNWuPDs0H_mieqKSqQrrVLeQq-4HLjgxX1k",
      });
      console.log("FCM Token:", token);
      return token;
    }
    return null;
  } catch (err) {
    console.error("Notification permission error:", err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
