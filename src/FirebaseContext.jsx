import { useState, useEffect, useRef, createContext, useContext, useMemo } from "react";
import { auth, messagingPromise } from "./config";
import { getToken, onMessage } from "firebase/messaging";
import { createClient, get, post, patch, put, del } from "@jah-cloud/data";
import { AuthContext } from "./AuthContext";

const client = createClient(auth, import.meta.env.VITE_SERVER_URL ?? "");

const FirebaseContext = createContext();

const FirebaseContextProvider = ({ children }) => {
  const { authenticatedUser } = useContext(AuthContext);

  const [media, setMedia] = useState([]);
  const [images, setImages] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [selectedImage, setSelectedImage] = useState(undefined);
  const [notificationSettings, setNotificationSettings] = useState({ enabled: false, frequency: 1 });
  const [isLoading, setIsLoading] = useState(() => authenticatedUser !== null);

  const fetchedFor = useRef(null);

  useEffect(() => {
    if (!authenticatedUser) {
      fetchedFor.current = null;
      return;
    }
    if (fetchedFor.current === authenticatedUser) return;
    fetchedFor.current = authenticatedUser;

    const bookmarksP = get(client, "/api/bookmarks").then(setMedia);
    const photosP = get(client, "/api/photos").then(setImages);
    const personasP = get(client, "/api/personas").then(setPersonas);
    const notifP = get(client, "/api/settings/notifications").then(setNotificationSettings);

    Promise.all([bookmarksP, photosP, personasP, notifP])
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [authenticatedUser]);

  async function updateNotificationSettings(enabled, frequency) {
    if (!authenticatedUser) return;

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

    const data = { enabled, frequency, ...(fcmToken ? { fcmToken } : {}) };
    try {
      await put(client, "/api/settings/notifications", data);
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

  function imageSelect(index) { setSelectedImage(index); }
  function closeImage() { setSelectedImage(undefined); }

  async function saveImage(imageUrl, id, username = null, user_id = null) {
    try {
      const { id: docId } = await post(client, "/api/photos", { imageUrl, tweetId: id, username, user_id });
      setImages((prev) => [...prev, { _id: docId, imageUrl, tweetId: id, timestamp: Date.now(), username, user_id }]);
    } catch (error) {
      console.error("Failed to save image:", error);
    }
  }

  async function saveTweet(
    videoUrl, tweet_id, username, height, fit, poster, retweet_username,
    tweet_creation_timestamp, tweet_timestamp, tags = [], note = "",
    collectionName = null, resumeToken = null, browseUsername = null, user_id = null,
  ) {
    const newTweet = {
      post: videoUrl, username, tweetId: tweet_id, height, fit, poster,
      retweet_username: retweet_username || null,
      tweet_creation_timestamp: tweet_creation_timestamp || null,
      tweet_timestamp: tweet_timestamp || null,
      tags, note: note || null, collectionName: collectionName || null,
      resumeToken: resumeToken || null, browseUsername: browseUsername || null,
      user_id: user_id || null,
    };
    try {
      const { id: docId } = await post(client, "/api/bookmarks", newTweet);
      setMedia((prev) => [...prev, { _id: docId, timestamp: Date.now(), ...newTweet }]);
    } catch (error) {
      console.error("Error saving tweet:", error);
    }
  }

  async function updateTweetCollection(docId, collectionName) {
    if (!docId) return;
    try {
      await patch(client, `/api/bookmarks/${docId}/collection`, { collectionName: collectionName || null });
      setMedia((prev) =>
        prev.map((t) => t._id === docId ? { ...t, collectionName: collectionName || null } : t)
      );
    } catch (error) {
      console.error("Error updating collection:", error);
    }
  }

  async function deleteTweet(docId) {
    if (!docId) return;
    try {
      await del(client, `/api/bookmarks/${docId}`);
      setMedia((prev) => prev.filter((t) => t._id !== docId));
    } catch (error) {
      console.error("Error deleting tweet:", error);
    }
  }

  async function savePersona(username, summary, tweetCount, twitterAvatarUrl = null) {
    try {
      const { id: docId } = await post(client, "/api/personas", { username, summary, tweetCount, twitterAvatarUrl });
      setPersonas((prev) => [...prev, { _id: docId, username, summary, tweetCount, createdAt: Date.now(), twitterAvatarUrl }]);
      return docId;
    } catch (error) {
      console.error("Failed to save persona:", error);
    }
  }

  async function deletePersona(docId) {
    if (!docId) return;
    try {
      await del(client, `/api/personas/${docId}`);
      setPersonas((prev) => prev.filter((p) => p._id !== docId));
    } catch (error) {
      console.error("Failed to delete persona:", error);
    }
  }

  async function refreshPersona(docId, model) {
    if (!docId) return { updated: false };
    try {
      const result = await post(client, `/api/personas/${docId}/refresh`, model ? { model } : undefined);
      console.log("[refreshPersona] result:", result);
      if (result.updated) {
        setPersonas((prev) =>
          prev.map((p) =>
            p._id === docId
              ? { ...p, summary: result.summary, tweetCount: (p.tweetCount ?? 0) + result.count }
              : p
          )
        );
      }
      return result;
    } catch (error) {
      console.error("Failed to refresh persona:", error);
      return { updated: false };
    }
  }

  async function updatePersona(docId, updates) {
    if (!docId) return;
    try {
      await patch(client, `/api/personas/${docId}`, updates);
      setPersonas((prev) => prev.map((p) => p._id === docId ? { ...p, ...updates } : p));
    } catch (error) {
      console.error("Failed to update persona:", error);
    }
  }

  async function deleteImage(tweetId) {
    try {
      await del(client, `/api/photos/by-tweet/${tweetId}`);
      setImages((prev) => prev.filter((img) => img.tweetId !== tweetId));
      setSelectedImage(undefined);
    } catch (error) {
      console.error("Failed to delete image:", error);
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

  return (
    <FirebaseContext.Provider
      value={{
        saveTweet, deleteTweet, updateTweetCollection, sortedTweets, collections,
        saveImage, sortedImages, deleteImage, selectedImage, imageSelect, closeImage,
        isLoading, personas, savePersona, deletePersona, updatePersona, refreshPersona,
        notificationSettings, updateNotificationSettings,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export { FirebaseContext, FirebaseContextProvider };
