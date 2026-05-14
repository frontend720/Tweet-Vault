import { useState, useEffect, useRef, createContext, useContext, useMemo } from "react";
import { db, messagingPromise } from "./config";
import {
  setDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { v4 as uuidv4 } from "uuid";
import { AuthContext } from "./AuthContext";

const FirebaseContext = createContext();

const FirebaseContextProvider = ({ children }) => {
  const { authenticatedUser } = useContext(AuthContext);

  const [media, setMedia] = useState([]);
  const [images, setImages] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [selectedImage, setSelectedImage] = useState(undefined);
  const [notificationSettings, setNotificationSettings] = useState({ enabled: false, frequency: 1 });
  // Start loading only if there's already a user — avoids setState in effect for the no-user path
  const [isLoading, setIsLoading] = useState(() => authenticatedUser !== null);

  // Track which user we've already fetched for — guards against StrictMode double-invoke
  const fetchedFor = useRef(null);

  // Initial load — runs once per authenticated user
  useEffect(() => {
    if (!authenticatedUser) {
      fetchedFor.current = null;
      setNotificationSettings({ enabled: false, frequency: 1 });
      return;
    }
    if (fetchedFor.current === authenticatedUser) return;
    fetchedFor.current = authenticatedUser;

    const tweetsPromise = getDocs(collection(db, authenticatedUser)).then((snapshot) => {
      const results = [];
      // Store _id alongside data so deletes can address the doc directly
      snapshot.forEach((docSnap) => results.push({ _id: docSnap.id, ...docSnap.data() }));
      setMedia(results);
    });
    const photosPromise = getDocs(collection(db, "users", authenticatedUser, "photos")).then((snapshot) => {
      const results = [];
      snapshot.forEach((docSnap) => results.push({ _id: docSnap.id, ...docSnap.data() }));
      setImages(results);
    });
    const personasPromise = getDocs(collection(db, "users", authenticatedUser, "personas")).then((snapshot) => {
      const results = [];
      snapshot.forEach((docSnap) => results.push({ _id: docSnap.id, ...docSnap.data() }));
      setPersonas(results);
    });
    const notifPromise = getDoc(doc(db, "users", authenticatedUser, "settings", "notifications")).then((snap) => {
      if (snap.exists()) setNotificationSettings(snap.data());
    });
    Promise.all([tweetsPromise, photosPromise, personasPromise, notifPromise])
      .catch(console.log)
      .finally(() => setIsLoading(false));
  }, [authenticatedUser]);

  async function updateNotificationSettings(enabled, frequency) {
    if (!authenticatedUser) return;
    const { auth } = await import("./config");
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    let fcmToken = null;
    if (enabled) {
      try {
        const messaging = await messagingPromise;
        if (messaging) {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            await navigator.serviceWorker.register("/firebase-messaging-sw.js");
            const swRegistration = await navigator.serviceWorker.ready;
            fcmToken = await getToken(messaging, {
              vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
              serviceWorkerRegistration: swRegistration,
            });
          }
        }
      } catch (err) {
        console.error("FCM token error:", err);
      }
    }

    const data = { enabled, frequency, uid, ...(fcmToken ? { fcmToken } : {}) };
    try {
      await setDoc(doc(db, "users", authenticatedUser, "settings", "notifications"), data, { merge: true });
      setNotificationSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to save notification settings:", err);
    }
  }

  // Show notifications even when the app tab is in the foreground
  useEffect(() => {
    if (!notificationSettings.enabled) return;
    let unsubscribe;
    messagingPromise.then((messaging) => {
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const { title, body, icon, badge } = payload.notification ?? {};
        if (!title) return;
        navigator.serviceWorker.ready.then((sw) => {
          sw.showNotification(title, {
            body,
            icon: icon ?? "/icon.svg",
            badge: badge ?? "/icon.svg",
            tag: payload.data?.chatUsername ?? "tweet-vault",
            data: payload.data,
          });
        });
      });
    });
    return () => unsubscribe?.();
  }, [notificationSettings.enabled]);

  function imageSelect(index) {
    setSelectedImage(index);
  }

  function closeImage() {
    setSelectedImage(undefined);
  }

  async function saveImage(imageUrl, id, username = null, user_id = null) {
    const docId = uuidv4();
    const newPhoto = {
      imageUrl,
      tweetId: id,
      timestamp: Date.now(),
      username: username || null,
      user_id: user_id || null,
    };
    try {
      await setDoc(doc(db, "users", authenticatedUser, "photos", docId), newPhoto);
      setImages((prev) => [...prev, { _id: docId, ...newPhoto }]);
    } catch (error) {
      console.error("Firebase write failed:", error);
    }
  }

  async function saveTweet(
    post,
    tweet_id,
    username,
    height,
    fit,
    poster,
    retweet_username,
    tweet_creation_timestamp,
    tweet_timestamp,
    tags = [],
    note = "",
    collectionName = null,
    resumeToken = null,
    browseUsername = null,
    user_id = null,
  ) {
    const docId = uuidv4();
    const newTweet = {
      post,
      username,
      tweetId: tweet_id,
      timestamp: Date.now(),
      height,
      fit,
      poster,
      retweet_username: retweet_username || null,
      tweet_creation_timestamp: tweet_creation_timestamp || null,
      tweet_timestamp: tweet_timestamp || null,
      tags,
      note: note || null,
      collectionName: collectionName || null,
      resumeToken: resumeToken || null,
      browseUsername: browseUsername || null,
      user_id: user_id || null,
    };
    try {
      await setDoc(doc(db, authenticatedUser, docId), newTweet);
      setMedia((prev) => [...prev, { _id: docId, ...newTweet }]);
    } catch (error) {
      console.log("Error saving tweet", error);
    }
  }

  async function updateTweetCollection(docId, collectionName) {
    if (!docId) return;
    try {
      await updateDoc(doc(db, authenticatedUser, docId), {
        collectionName: collectionName || null,
      });
      setMedia((prev) =>
        prev.map((t) =>
          t._id === docId
            ? { ...t, collectionName: collectionName || null }
            : t,
        ),
      );
    } catch (error) {
      console.log("Error updating collection", error);
    }
  }

  async function deleteTweet(docId) {
    if (!docId) return;
    try {
      await deleteDoc(doc(db, authenticatedUser, docId));
      setMedia((prev) => prev.filter((t) => t._id !== docId));
    } catch (error) {
      console.log(error);
    }
  }

  async function savePersona(username, summary, tweetCount, twitterAvatarUrl = null) {
    const docId = uuidv4();
    const newPersona = { username, summary, tweetCount, createdAt: Date.now(), twitterAvatarUrl };
    try {
      await setDoc(doc(db, "users", authenticatedUser, "personas", docId), newPersona);
      setPersonas((prev) => [...prev, { _id: docId, ...newPersona }]);
      return docId;
    } catch (error) {
      console.error("Failed to save persona:", error);
    }
  }

  async function deletePersona(docId) {
    if (!docId) return;
    try {
      await deleteDoc(doc(db, "users", authenticatedUser, "personas", docId));
      setPersonas((prev) => prev.filter((p) => p._id !== docId));
    } catch (error) {
      console.error("Failed to delete persona:", error);
    }
  }

  async function updatePersona(docId, updates) {
    if (!docId) return;
    try {
      await updateDoc(doc(db, "users", authenticatedUser, "personas", docId), updates);
      setPersonas((prev) => prev.map((p) => p._id === docId ? { ...p, ...updates } : p));
    } catch (error) {
      console.error("Failed to update persona:", error);
    }
  }

  async function deleteImage(tweetId) {
    const toDelete = images.filter((img) => img.tweetId === tweetId);
    if (toDelete.length === 0) return;
    try {
      await Promise.all(
        toDelete.map((img) =>
          deleteDoc(doc(db, "users", authenticatedUser, "photos", img._id)),
        ),
      );
      setImages((prev) => prev.filter((img) => img.tweetId !== tweetId));
      setSelectedImage(undefined);
    } catch (error) {
      console.log(error);
    }
  }

  const sortedTweets = useMemo(
    () => [...media].sort((a, b) => b.timestamp - a.timestamp),
    [media],
  );

  const collections = useMemo(() => {
    const names = new Set();
    media.forEach((t) => { if (t.collectionName) names.add(t.collectionName.toLowerCase()); });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [media]);

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => b.timestamp - a.timestamp),
    [images],
  );

  // useEffect(() => {
  //   if (media.length === 0) return;
  //   const count = media.filter((t) => !t.collectionName && !t.poster).length;
  //   console.log(`[TweetVault] Unsorted saves without a poster: ${count} / ${media.length}`);
  // }, [media]);

  return (
    <FirebaseContext.Provider
      value={{
        saveTweet,
        deleteTweet,
        updateTweetCollection,
        sortedTweets,
        collections,
        saveImage,
        sortedImages,
        deleteImage,
        selectedImage,
        imageSelect,
        closeImage,
        isLoading,
        personas,
        savePersona,
        deletePersona,
        updatePersona,
        notificationSettings,
        updateNotificationSettings,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export { FirebaseContext, FirebaseContextProvider };
