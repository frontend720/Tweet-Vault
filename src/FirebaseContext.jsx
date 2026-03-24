import { useState, useEffect, useRef, createContext, useContext, useMemo } from "react";
import { db } from "./config";
import {
  setDoc,
  doc,
  getDocs,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { AuthContext } from "./AuthContext";

const FirebaseContext = createContext();

const FirebaseContextProvider = ({ children }) => {
  const { authenticatedUser } = useContext(AuthContext);

  const [media, setMedia] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(undefined);
  // Start loading only if there's already a user — avoids setState in effect for the no-user path
  const [isLoading, setIsLoading] = useState(() => authenticatedUser !== null);

  // Track which user we've already fetched for — guards against StrictMode double-invoke
  const fetchedFor = useRef(null);

  // Initial load — runs once per authenticated user
  useEffect(() => {
    if (!authenticatedUser) {
      fetchedFor.current = null;
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
    Promise.all([tweetsPromise, photosPromise])
      .catch(console.log)
      .finally(() => setIsLoading(false));
  }, [authenticatedUser]);

  function imageSelect(index) {
    setSelectedImage(index);
  }

  function closeImage() {
    setSelectedImage(undefined);
  }

  async function saveImage(imageUrl, id) {
    const docId = uuidv4();
    const newPhoto = { imageUrl, tweetId: id, timestamp: Date.now() };
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
    };
    try {
      await setDoc(doc(db, authenticatedUser, docId), newTweet);
      setMedia((prev) => [...prev, { _id: docId, ...newTweet }]);
    } catch (error) {
      console.log("Error saving tweet", error);
    }
  }

  async function deleteTweet(tweetId) {
    const item = media.find((t) => t.tweetId === tweetId);
    if (!item?._id) return;
    try {
      await deleteDoc(doc(db, authenticatedUser, item._id));
      setMedia((prev) => prev.filter((t) => t.tweetId !== tweetId));
    } catch (error) {
      console.log(error);
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

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => b.timestamp - a.timestamp),
    [images],
  );

  return (
    <FirebaseContext.Provider
      value={{
        saveTweet,
        deleteTweet,
        sortedTweets,
        saveImage,
        sortedImages,
        deleteImage,
        selectedImage,
        imageSelect,
        closeImage,
        isLoading,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export { FirebaseContext, FirebaseContextProvider };
