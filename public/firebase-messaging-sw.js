importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

// Firebase config is intentionally hardcoded here — service workers cannot access
// env vars or module bundlers. Firebase config is not secret (security is via rules).
firebase.initializeApp({
  apiKey: "AIzaSyDWFVm9q3FycDvuVzdWwiPa_6Tt_YG-HZo",
  authDomain: "bate-mates.firebaseapp.com",
  projectId: "bate-mates",
  storageBucket: "bate-mates.appspot.com",
  messagingSenderId: "999768888879",
  appId: "1:999768888879:web:7a5fa25659fbc57779d8da",
  databaseURL: "https://bate-mates-default-rtdb.firebaseio.com",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, badge } = payload.notification ?? {};
  if (!title) return;
  self.registration.showNotification(title, {
    body,
    icon: icon ?? "/icon.svg",
    badge: badge ?? "/icon.svg",
    tag: payload.data?.chatUsername ?? "tweet-vault",
    data: payload.data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { chatUsername, personaId } = event.notification.data ?? {};
  const url = chatUsername
    ? `/chat/${chatUsername}${personaId ? `?pid=${personaId}` : ""}`
    : "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    }),
  );
});
