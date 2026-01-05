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
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
} from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import { auth } from "./config";
import { AxiosContext } from "./AxiosContext";

const FirebaseContext = createContext();

function FirebaseContextProvider({ children }) {
  const { setIndex } = useContext(AxiosContext);

  const [isTweetSaved, setIsTweetSaved] = useState(false);
  const [media, setMedia] = useState([]);
  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("authenticated-user");
      return savedUser !== null ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.log(error);
    }
    return null;
  });

  const [error, setError] = useState("");

  const [authentication, setAuthentication] = useState({
    email: "",
    password: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setAuthentication((prevAuth) => ({
      ...prevAuth,
      [name]: value,
    }));
  }

  const [authState, setAuthState] = useState(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setAuthState(user.email);
        setAuthenticatedUser(user.email);
        localStorage.setItem("authenticated-user", JSON.stringify(user.email));
      } else {
        // User is signed out
        setAuthState(null);
        setAuthenticatedUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  async function createUser() {
    const authReference = await createUserWithEmailAndPassword(
      auth,
      authentication.email,
      authentication.password
    );
    try {
      if ((authentication.email, authentication.password)) {
        setAuthenticatedUser(authReference.user.email);
      }
    } catch (error) {
      if (error === "auth/invalid-email") {
        setError("Must provide an E-mail to continue");
        console.log(error);
      }
    }
  }

  async function returningUser() {
    const authReference = await signInWithEmailAndPassword(
      auth,
      authentication.email,
      authentication.password
    );
    try {
      if (authentication.email || authentication.password) {
        setAuthenticatedUser(authReference.user.email);
      }
    } catch (error) {
      console.log(error);
      if (error === "auth/invalid-email") {
        setError("Must provide an E-mail to continue");
        console.log(error);
      }
    }
  }

  console.log(authenticatedUser);

  const provider = new GoogleAuthProvider();
  async function signInWithGoogle() {
    const authProvider = await signInWithPopup(auth, provider);
    try {
      console.log(authProvider.user.email);
    } catch (error) {
      console.log(error);
    }
  }

  async function logout() {
    const authReference = await signOut(auth);
    try {
      console.log(authReference);
    } catch (error) {
      console.log(error);
    }
  }
  async function saveTweet(post, tweet_id, username, height, fit, poster, retweet_username, tweet_creation_timestamp, tweet_timestamp) {
    const now = new Date();
    const response = await setDoc(doc(db, authenticatedUser, uuidv4()), {
      post: post,
      username: username,
      tweetId: tweet_id,
      timestamp: now.getTime(),
      height: height,
      fit: fit,
      poster: poster,
      retweet_username:  retweet_username || null,
      tweet_creation_timestamp: tweet_creation_timestamp || null,
      tweet_timestamp: tweet_timestamp || null
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
    if (!authenticatedUser) return;
    const querySnapshot = await getDocs(collection(db, authenticatedUser));
    try {
      querySnapshot.forEach((tweet) => {
        media.push(tweet.data());
      });
      setMedia(media);
    } catch (error) {
      console.log(error);
    }
  }

  const [deleteState, setDeleteState] = useState();
  async function deleteTweet(tweetId) {
    const collectionRef = collection(db, authenticatedUser);
    const q = query(collectionRef, where("tweetId", "==", tweetId));

    const querySnapshot = await getDocs(q);
    try {
      querySnapshot.forEach((query) => {
        const deleteRef = deleteDoc(query.ref);
        try {
          setDeleteState(deleteRef);
          console.log(deleteRef);
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
  }, [isTweetSaved, deleteState, authenticatedUser]);

  return (
    <FirebaseContext.Provider
      value={{
        saveTweet,
        media,
        deleteTweet,
        createUser,
        handleChange,
        authentication,
        returningUser,
        signInWithGoogle,
        authState,
        logout,
        authenticatedUser,
        error,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export { FirebaseContext, FirebaseContextProvider };
