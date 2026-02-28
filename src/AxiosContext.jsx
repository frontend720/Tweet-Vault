import {
  createContext,
  useState,
  useEffect,
  useRef,
  memo
} from "react";
import axios from "axios";

const AxiosContext = createContext();
axios.interceptors.request.use();
axios.defaults.headers.common["ngrok-skip-browser-warning"] = true;

const AxiosContextProvider = memo(({ children }) => {
  const [menuToggle, setMenuToggle] = useState(false);
  const [tweets, setTweets] = useState([]);
  const [continuationToken, setContinuationToken] = useState(undefined);
  const [username, setUsername] = useState();
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [newRetweetRequest, setNewRetweetRequest] = useState(false);
  const [areRetweetsLoading, setAreRetweetsLoading] = useState([]);
  const [loadingText, setLoadingText] = useState("");
  const [receievedInitialSet, setReceivedInitialSet] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);

  function resetUsername(e){
    e.preventDefault()
    setUsername("")
  }

  function onPlayChange() {
    setIsPlaying((prev) => !prev);
  }

  function onMenuToggle() {
    setMenuToggle((prev) => !prev);
  }
  const [index, setIndex] = useState(0);

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
    e.preventDefault();
    setIndex(0);
    setUsername("");
    setTweets([]);
    setContinuationToken(undefined);
    try {
      const response = await axios({
        method: "GET",
        url: "https://twitter154.p.rapidapi.com/user/tweets",
        params: {
          username: username,
          limit: 20,
          include_replies: false,
          include_pinned: false,
        },
        referrerPolicy: "no-referrer",
        headers: {
          "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
          "x-rapidapi-host": "twitter154.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      });
      setTweets(response?.data?.results || []);
      setContinuationToken(response?.data?.continuation_token);
      setUsername(response?.data?.results[0]?.user?.username);
      setIsInputVisible(false);
      setReceivedInitialSet(true);
    } catch (error) {
      console.log(error);
    }
  }

  const isFetching = useRef(false);

  async function retweetRequest(retweeted_from) {
    setTweets([]);
    setIndex(0);
    setLoadingText(`Finding ${retweeted_from}s posts. Please wait`);
    setUsername("");
    setRunRequest(true);
    setNewRetweetRequest(true);
    setContinuationToken(undefined);
    const response = await axios({
      method: "GET",
      url: "https://twitter154.p.rapidapi.com/user/tweets",
      params: {
        username: retweeted_from,
        limit: 20,
        include_replies: false,
        include_pinned: false,
      },
      referrerPolicy: "no-referrer",
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
        "x-rapidapi-host": "twitter154.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    });
    try {
      setTweets(response?.data?.results);
      setContinuationToken(response?.data?.continuation_token);
      setUsername(response?.data?.results[0]?.user?.username);
      setNewRetweetRequest(false);
      setAreRetweetsLoading(false);
      if (areRetweetsLoading === true) {
        setLoadingText(`Finding ${retweeted_from}s posts. Please wait`);
      } else {
        return setLoadingText("");
      }
    } catch (error) {
      console.log(error);
    }
    setAreRetweetsLoading(true);
  }

  const [runRequest, setRunRequest] = useState(true);
  const lastFetchedToken = useRef(null);

  useEffect(() => {
    if (receievedInitialSet === false) return;
    isFetching.current = true;
    axios({
      method: "GET",
      url: "https://twitter154.p.rapidapi.com/user/tweets/continuation",
      params: {
        username: username,
        continuation_token: continuationToken,
      },
      referrerPolicy: "no-referrer",
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
        "x-rapidapi-host": "twitter154.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        const newResults = response.data.results || [];
        const nextToken = response.data.continuation_token;
        lastFetchedToken.current = continuationToken;
        setTweets((prevTweets) => [...(prevTweets || []), ...newResults]);
        setContinuationToken(nextToken);
      })
      .catch((error) => {
        console.log("Error", error);
      })
      .finally(() => {
        isFetching.current = false;
      });
  }, [continuationToken, runRequest]);

  function fetchTweets() {
    axios({
      method: "GET",
      url: "https://twitter154.p.rapidapi.com/user/tweets/continuation",
      params: {
        username: username,
        continuation_token: continuationToken,
      },
      referrerPolicy: "no-referrer",
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
        "x-rapidapi-host": "twitter154.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        setTweets((prevTweets) => [
          ...(prevTweets || []),
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
  }

  function handleReachEnd() {
    if (isFetching.current || !continuationToken || !runRequest) return;
    // Don't fetch the same token again
    if (continuationToken === lastFetchedToken.current) return;

    fetchTweets();
  }

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
        onMenuToggle,
        loadingText,
        index,
        handleReachEnd,
        isPlaying,
        onPlayChange,
        setIsPlaying,
        resetUsername
      }}
    >
      {children}
    </AxiosContext.Provider>
  );
});

export { AxiosContext, AxiosContextProvider };