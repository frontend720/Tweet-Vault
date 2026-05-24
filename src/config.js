import { initializeApp as initFirebase } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import { initializeApp } from "@jah-cloud/core";
import { getAuth } from "@jah-cloud/auth";

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

const vaultApp = initializeApp({ baseUrl: import.meta.env.VITE_VAULT_URL ?? "http://localhost:4501" });
const auth = getAuth(vaultApp);

// Resolves once the initial getCurrentUser check completes on page load.
// Mirrors Firebase's auth.authStateReady() so FirebaseContext.api() can await it.
let _markReady;
const _readyPromise = new Promise(resolve => { _markReady = resolve; });
auth.authStateReady = () => _readyPromise;
auth._markReady = _markReady;

export { auth, messagingPromise };
