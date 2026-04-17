importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB9wHnIbjKNjSZMPHJ0lhkqmy7Dk4upHPI",
  authDomain: "solid-depot-483510-d6.firebaseapp.com",
  projectId: "solid-depot-483510-d6",
  storageBucket: "solid-depot-483510-d6.firebasestorage.app",
  messagingSenderId: "294595063850",
  appId: "1:294595063850:web:b1c75cd017781c8ab91353"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'EDULinker';

  self.registration.showNotification(title, {
    body: payload.notification?.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: payload.data || {},
  });
});
