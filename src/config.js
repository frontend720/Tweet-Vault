import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getMessaging, isSupported } from "firebase/messaging";
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(config);
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache() });
} catch {
  db = getFirestore(app);
}
const auth = getAuth(app);
const rtdb = getDatabase(app);

// Messaging is only available in browser contexts that support service workers
const messagingPromise = isSupported().then((ok) => ok ? getMessaging(app) : null);

export { db, auth, rtdb, messagingPromise };
