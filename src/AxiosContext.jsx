import { createContext, useState, useEffect, useRef, useContext } from "react";
import { getDocs, doc, collection } from "firebase/firestore";
import { db } from "./config";
import axios from "axios";

const AxiosContext = createContext();

function AxiosContextProvider({ children }) {
  const [media, setMedia] = useState([]);
  const [menuToggle, setMenuToggle] = useState(false);
  // const {media} = useContext(FirebaseContext)
  const [tweets, setTweets] = useState([]);
  const [continuationToken, setContinuationToken] = useState(undefined);
  const [username, setUsername] = useState();
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [newRetweetRequest, setNewRetweetRequest] = useState(false);

  function onMenuToggle(){
    setMenuToggle((prev) => !prev)
  }

  useEffect(() => {
    async function getTweets() {
      const media = [];
      setIndex(0);
      const querySnapshot = await getDocs(
        collection(db, "doccnasty@gmail.com")
      );
      try {
        querySnapshot.forEach((tweet) => {
          media.push(tweet.data());
        });
        setMedia(media);
      } catch (error) {
        console.log(error);
      }
    }
    getTweets();
  }, [tweets]);

  const [index, setIndex] = useState(0);

  function changeDirection() {
    setIndex((prev) => prev + 1);
  }

  function onInputVisibilityButton(e) {
    e.preventDefault();
    setIsInputVisible((prev) => !prev);
  }

  function handleChange(e) {
    setUsername(e.target.value);
  }

  async function getTweets(e) {
    e.preventDefault();
    const response = await axios({
      method: "GET",
      url: "https://twitter154.p.rapidapi.com/user/tweets",
      params: {
        username: username,
        limit: 20,
        include_replies: false,
        include_pinned: false,
      },
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
        "x-rapidapi-host": "twitter154.p.rapidapi.com",
      },
    });
    try {
      setTweets(response?.data?.results);
      setContinuationToken(response?.data?.continuation_token);
      setUsername(response?.data?.results[0]?.user?.username);
      setIsInputVisible(false);
    } catch (error) {
      console.log(error);
    }
    // setTweets([])
  }

  async function retweetRequest(retweeted_from) {
    setTweets([]);
    setUsername("");
    setIndex(0);
    setRunRequest(true);
    setNewRetweetRequest(true);
    const response = await axios({
      method: "GET",
      url: "https://twitter154.p.rapidapi.com/user/tweets",
      params: {
        username: retweeted_from,
        limit: 20,
        include_replies: false,
        include_pinned: false,
      },
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
        "x-rapidapi-host": "twitter154.p.rapidapi.com",
      },
    });
    try {
      setTweets(response?.data?.results);
      setContinuationToken(response?.data?.continuation_token);
      setUsername(response?.data?.results[0]?.user?.username);
      setNewRetweetRequest(false);
    } catch (error) {
      console.log(error);
    }
    // setIndex(0)
  }

  const [runRequest, setRunRequest] = useState(true);
  const isFetching = useRef(false);
  useEffect(() => {
    const threshold = tweets.length > 0 ? tweets.length - 5 : 14;
    if (runRequest === false || tweets.length < 1 || isFetching.current) {
      return;
    }

    isFetching.current = true;
    axios({
      method: "GET",
      url: "https://twitter154.p.rapidapi.com/user/tweets/continuation",
      params: {
        username: username,
        continuation_token: continuationToken,
      },
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
        "x-rapidapi-host": "twitter154.p.rapidapi.com",
      },
    })
      .then((response) => {
        setTweets((prevTweets) => [
          ...prevTweets,
          ...(response.data.results || []),
        ]);
        setContinuationToken(response?.data.continuation_token);
        setIndex(0);
        if (response.data.results?.length === 0) {
          setRunRequest(false);
        }
      })
      .catch((error) => {
        console.log("Error", error);
      })
      .finally(() => {
        isFetching.current = false;
      });
  }, [continuationToken, username, index, tweets?.length]);

  return (
    <AxiosContext.Provider
      value={{
        getTweets,
        retweetRequest,
        tweets,
        username,
        handleChange,
        onInputVisibilityButton,
        isInputVisible,
        changeDirection,
        setIndex,
        newRetweetRequest,
        menuToggle,
        onMenuToggle
      }}
    >
      {children}
    </AxiosContext.Provider>
  );
}

export { AxiosContext, AxiosContextProvider };
