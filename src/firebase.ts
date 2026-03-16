import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB9wHnIbjKNjSZMPHJ0lhkqmy7Dk4upHPI",
  authDomain: "solid-depot-483510-d6.firebaseapp.com",
  projectId: "solid-depot-483510-d6",
  storageBucket: "solid-depot-483510-d6.firebasestorage.app",
  messagingSenderId: "294595063850",
  appId: "1:294595063850:web:b1c75cd017781c8ab91353",
  measurementId: "G-YCXJ9BHN95"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BLoKIG-AEZukS3xro0TaRuiKppU4vq8svzmdqTRoTYVkCie0fh1_qNWuPDs0H_mieqKSqQrrVLeQq-4HLjgxX1k"
      });
      console.log("FCM Token:", token);
      return token;
    }
  } catch (err) {
    console.error("Notification permission error:", err);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
