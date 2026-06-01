import { initializeApp as initFirebase } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initFirebase(firebaseConfig);
const messagingPromise = isSupported().then((ok) => ok ? getMessaging(firebaseApp) : null);
const firebaseAuth = getAuth(firebaseApp);

// Adapter so @jah-cloud/data's createClient works with Firebase ID tokens
const auth = {
  authStateReady: () => firebaseAuth.authStateReady(),
  getIdToken: async () => {
    const user = firebaseAuth.currentUser;
    if (!user) return { data: null, error: { code: "auth/not-signed-in" } };
    try {
      const token = await user.getIdToken();
      return { data: { token }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },
};

export { auth, firebaseAuth, messagingPromise };
