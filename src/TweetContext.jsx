import { createContext, useState, useRef, memo } from "react";
import axios from "axios";

const TweetContext = createContext();
axios.defaults.headers.common["ngrok-skip-browser-warning"] = true;

const RAPIDAPI_HEADERS = {
  "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
  "x-rapidapi-host": "twitter154.p.rapidapi.com",
  "Content-Type": "application/json",
};

const TweetContextProvider = memo(({ children }) => {
  const [menuToggle, setMenuToggle] = useState(false);
  const [tweets, setTweets] = useState([]);
  const [continuationToken, setContinuationToken] = useState(undefined);
  const [username, setUsername] = useState();
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [newRetweetRequest, setNewRetweetRequest] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [runRequest, setRunRequest] = useState(true);
  const [index, setIndex] = useState(0);

  const isFetching = useRef(false);
  const lastFetchedToken = useRef(null);

  function resetUsername(e) {
    e.preventDefault();
    setUsername("");
  }

  function onMenuToggle() {
    setMenuToggle((prev) => !prev);
  }

  function changeDirection() {
    setIndex((prev) => (prev + 1) % tweets?.length);
  }

  function onInputVisibilityButton(e) {
    e.preventDefault();
    setIsInputVisible((prev) => !prev);
  }

  function handleChange(e) {
    setUsername(e.target.value);
  }

  async function getTweets(e) {
    if (e?.preventDefault) e.preventDefault();
    setIndex(0);
    setUsername("");
    setTweets([]);
    setContinuationToken(undefined);
    try {
      const response = await axios({
        method: "GET",
        url: "https://twitter154.p.rapidapi.com/user/tweets",
        params: { username, limit: 40, include_replies: false },
        referrerPolicy: "no-referrer",
        headers: RAPIDAPI_HEADERS,
      });
      const results = response?.data?.results ?? response?.data?.tweets ?? [];
      setTweets(results);
      setContinuationToken(response?.data?.continuation_token ?? response?.data?.next_cursor);
      setUsername(results?.[0]?.user?.username ?? username);
      setIsInputVisible(false);
    } catch (error) {
      console.log(error);
    }
  }

  async function retweetRequest(retweeted_from) {
    setTweets([]);
    setIndex(0);
    setLoadingText(`Finding ${retweeted_from}'s posts. Please wait`);
    setUsername("");
    setRunRequest(true);
    setNewRetweetRequest(true);
    setContinuationToken(undefined);
    try {
      const response = await axios({
        method: "GET",
        url: "https://twitter154.p.rapidapi.com/user/tweets",
        params: { username: retweeted_from, limit: 40, include_replies: false },
        referrerPolicy: "no-referrer",
        headers: RAPIDAPI_HEADERS,
      });
      const results = response?.data?.results ?? response?.data?.tweets ?? [];
      setTweets(results);
      setContinuationToken(response?.data?.continuation_token ?? response?.data?.next_cursor);
      setUsername(results?.[0]?.user?.username ?? retweeted_from);
      setLoadingText("");
    } catch (error) {
      console.log(error);
      setLoadingText("");
    } finally {
      setNewRetweetRequest(false);
    }
  }

  function fetchTweets() {
    isFetching.current = true;
    axios({
      method: "GET",
      url: "https://twitter154.p.rapidapi.com/user/tweets/continuation",
      params: { username, continuation_token: continuationToken, include_replies: false },
      referrerPolicy: "no-referrer",
      headers: RAPIDAPI_HEADERS,
    })
      .then((response) => {
        const results = response?.data?.results ?? response?.data?.tweets ?? [];
        setTweets((prevTweets) => [...(prevTweets || []), ...results]);
        setContinuationToken(response?.data?.continuation_token ?? response?.data?.next_cursor);
        if (results.length === 0) setRunRequest(false);
      })
      .catch((error) => {
        console.log("Error", error);
      })
      .finally(() => {
        isFetching.current = false;
      });
  }

  function handleReachEnd() {
    if (isFetching.current || !continuationToken || !runRequest) return;
    if (continuationToken === lastFetchedToken.current) return;
    lastFetchedToken.current = continuationToken;
    fetchTweets();
  }

  return (
    <TweetContext.Provider
      value={{
        getTweets,
        retweetRequest,
        tweets,
        username,
        handleChange,
        onInputVisibilityButton,
        isInputVisible,
        changeDirection,
        newRetweetRequest,
        menuToggle,
        onMenuToggle,
        loadingText,
        index,
        handleReachEnd,
        resetUsername,
      }}
    >
      {children}
    </TweetContext.Provider>
  );
});

export { TweetContext, TweetContextProvider };
