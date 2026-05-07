import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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

const isCapacitorNative = (): boolean => {
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (isCapacitorNative()) {
      try {
        const mod = await import(/* @vite-ignore */ "@capacitor/push-notifications");
        const PushNotifications = mod.PushNotifications;
        await PushNotifications.requestPermissions();
        await PushNotifications.register();

        return new Promise((resolve) => {
          PushNotifications.addListener("registration", (token: any) => {
            console.log("Capacitor FCM Token:", token.value);
            resolve(token.value);
          });
          PushNotifications.addListener("registrationError", (err: any) => {
            console.error("Capacitor registration error:", err);
            resolve(null);
          });
        });
      } catch (e) {
        console.warn("Capacitor PushNotifications not available:", e);
        return null;
      }
    }

    // Web/PWA
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BLoKIG-AEZukS3xro0TaRuiKppU4vq8svzmdqTRoTYVkCie0fh1_qNWuPDs0H_mieqKSqQrrVLeQq-4HLjgxX1k",
      });
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
