import { useState, useEffect, createContext, useContext } from "react";
import { db } from "./config";
import {
  setDoc,
  doc,
  getDocs,
  collection,
  where,
  query,
  deleteDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { AxiosContext } from "./AxiosContext";

const FirebaseContext = createContext();

function FirebaseContextProvider({ children }) {
  const { setIndex } = useContext(AxiosContext);

  const [isTweetSaved, setIsTweetSaved] = useState(false);
  const [media, setMedia] = useState([]);

  async function saveTweet(post, tweet_id, username, height, fit, poster) {
    const now = new Date();
    const response = await setDoc(doc(db, "doccnasty@gmail.com", uuidv4()), {
      post: post,
      username: username,
      tweetId: tweet_id,
      timestamp: now.getTime(),
      height: height,
      fit: fit,
      poster: poster,
    });
    try {
      console.log(response);
      setIsTweetSaved((prev) => !prev);
    } catch (error) {
      console.log("Error saving video", error);
    }
  }

  async function getTweets() {
    const media = [];
    setIndex(0);
    const querySnapshot = await getDocs(collection(db, "doccnasty@gmail.com"));
    try {
      querySnapshot.forEach((tweet) => {
        media.push(tweet.data());
      });
      setMedia(media);
    } catch (error) {
      console.log(error);
    }
  }

  const [deleteState, setDeleteState] = useState()
  async function deleteTweet(timestamp) {
    const collectionRef = collection(db, "doccnasty@gmail.com");
    const q = query(collectionRef, where("timestamp", "==", timestamp));

    const querySnapshot = await getDocs(q);
    try {
      querySnapshot.forEach((query) => {
        const deleteRef = deleteDoc(query.ref);
        try {
          setDeleteState(deleteRef);
          console.log(deleteRef)
        } catch (error) {
          console.log(error);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getTweets();
  }, [isTweetSaved, deleteState]);
  return (
    <FirebaseContext.Provider value={{ saveTweet, media, deleteTweet }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export { FirebaseContext, FirebaseContextProvider };
