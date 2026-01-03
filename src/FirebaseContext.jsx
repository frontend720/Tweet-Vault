import { useState, useEffect, createContext } from "react";
import { db } from "./config";
import { setDoc, doc, getDocs, collection } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const FirebaseContext = createContext();

function FirebaseContextProvider({ children }) {
  const [isTweetSaved, setIsTweetSaved] = useState(false);
  const [media, setMedia] = useState([])

  async function saveTweet(post, tweet_id, username) {
    const now = new Date();
    const response = await setDoc(doc(db, "doccnasty@gmail.com", uuidv4()), {
      post: post,
      username: username,
      tweetId: tweet_id,
      timestamp: now.getTime(),
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

  console.log(media)

  useEffect(() => {
    getTweets();
  }, [isTweetSaved]);
  return (
    <FirebaseContext.Provider value={{ saveTweet, media }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export { FirebaseContext, FirebaseContextProvider };
