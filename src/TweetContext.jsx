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
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [index, setIndex] = useState(0);
  const [feedType, setFeedType] = useState("account"); // "account" | "topic"
  const [searchQuery, setSearchQuery] = useState("");
  const [personaModeEnabled, setPersonaModeEnabledState] = useState(
    () => localStorage.getItem("tv_persona_mode") === "true",
  );
  const personaModeRef = useRef(personaModeEnabled);
  const collectedTextTweets = useRef([]);
  const [textTweetCount, setTextTweetCount] = useState(0);

  function setPersonaModeEnabled(val) {
    const next = typeof val === "function" ? val(personaModeRef.current) : val;
    personaModeRef.current = next;
    localStorage.setItem("tv_persona_mode", next ? "true" : "false");
    setPersonaModeEnabledState(next);
  }

  function accumulateTextTweets(results) {
    if (!personaModeRef.current) return;
    const textOnly = results
      .filter((t) => t.text && !t.retweet_status)
      .map((t) => t.text);
    if (textOnly.length === 0) return;
    collectedTextTweets.current = [...collectedTextTweets.current, ...textOnly];
    setTextTweetCount(collectedTextTweets.current.length);
  }

  function resetPersonaCollection() {
    collectedTextTweets.current = [];
    setTextTweetCount(0);
  }
  const [resumeError, setResumeError] = useState(null); // { username } when token expired
  const [isResumed, setIsResumed] = useState(false);
  const [resumedFrom, setResumedFrom] = useState(null);

  const [profileSheet, setProfileSheet] = useState(null); // { userId, username, avatarUrl }
  const [profileList, setProfileList] = useState([]); // followers or following users
  const [profileListType, setProfileListType] = useState(null); // "followers" | "following"
  const [profileListToken, setProfileListToken] = useState(null);
  const [profileListLoading, setProfileListLoading] = useState(false);
  const profileListFetching = useRef(false);

  const usernameRef = useRef("");

  const isFetching = useRef(false);
  const lastFetchedToken = useRef(null);
  const currentQuery = useRef(""); // persisted for continuation calls
  const currentSection = useRef("top");
  const searchContinuationToken = useRef(null);
  const requestGeneration = useRef(0);

  function resetUsername(e) {
    e.preventDefault();
    setUsername("");
  }

  function resetSearchQuery(e) {
    e.preventDefault();
    setSearchQuery("");
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

  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
  }

  async function getTweets(e) {
    if (e?.preventDefault) e.preventDefault();
    setIndex(0);
    setUsername("");
    setTweets([]);
    setContinuationToken(undefined);
    setRunRequest(true);
    setIsResumed(false);
    setResumedFrom(null);
    lastFetchedToken.current = null;
    continuationTokenRef.current = null;
    requestGeneration.current += 1;
    resetPersonaCollection();
    try {
      const response = await axios({
        method: "GET",
        url: "https://twitter154.p.rapidapi.com/user/tweets",
        params: { username, limit: 40, include_replies: false },
        referrerPolicy: "no-referrer",
        headers: RAPIDAPI_HEADERS,
      });
      const results = response?.data?.results ?? response?.data?.tweets ?? [];
      const token = response?.data?.continuation_token ?? response?.data?.next_cursor ?? null;
      continuationTokenRef.current = token;
      const resolvedUsername = results?.[0]?.user?.username ?? username;
      usernameRef.current = resolvedUsername;
      setTweets(results);
      setContinuationToken(token);
      accumulateTextTweets(results);
      setUsername(resolvedUsername);
      setIsInputVisible(false);
    } catch (error) {
      console.log(error);
    }
  }

  // console.log(continuationToken, "continuationToken");
  // console.log(tweets)

  async function getSearchResults(e) {
    if (e?.preventDefault) e.preventDefault();
    setIndex(0);
    setTweets([]);
    setContinuationToken(undefined);
    setRunRequest(true);
    setIsResumed(false);
    setResumedFrom(null);
    lastFetchedToken.current = null;
    continuationTokenRef.current = null;
    requestGeneration.current += 1;
    currentQuery.current = searchQuery;
    currentSection.current = "top";
    setNewRetweetRequest(true);
    try {
      const response = await axios({
        method: "GET",
        url: "https://twitter154.p.rapidapi.com/search/search",
        params: { query: searchQuery, section: "top", limit: 40 },
        referrerPolicy: "no-referrer",
        headers: RAPIDAPI_HEADERS,
      });
      const results = response?.data?.results ?? [];
      const token = response?.data?.continuation_token ?? response?.data?.next_cursor ?? null;
      searchContinuationToken.current = token;
      setTweets(results);
      setContinuationToken(token);
      accumulateTextTweets(results);
      setSearchQuery("");
      setIsInputVisible(false);
    } catch (error) {
      console.log(error);
    } finally {
      setNewRetweetRequest(false);
    }
  }

  async function resumeFeed(username, token) {
    setTweets([]);
    setIndex(0);
    usernameRef.current = username;
    setUsername(username);
    setRunRequest(true);
    setNewRetweetRequest(true);
    setContinuationToken(undefined);
    lastFetchedToken.current = null;
    isFetching.current = false;
    continuationTokenRef.current = token;
    requestGeneration.current += 1;
    setResumeError(null);
    try {
      const response = await axios({
        method: "GET",
        url: "https://twitter154.p.rapidapi.com/user/tweets/continuation",
        params: { username, continuation_token: token, include_replies: false },
        referrerPolicy: "no-referrer",
        headers: RAPIDAPI_HEADERS,
      });
      const results = response?.data?.results ?? response?.data?.tweets ?? [];
      const nextToken = response?.data?.continuation_token ?? response?.data?.next_cursor ?? null;
      if (results.length === 0) {
        setResumeError({ username });
        return;
      }
      continuationTokenRef.current = nextToken;
      setTweets(results);
      setContinuationToken(nextToken);
      setIsResumed(true);
      setResumedFrom(username);
    } catch {
      setResumeError({ username });
    } finally {
      setNewRetweetRequest(false);
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
    setIsResumed(false);
    setResumedFrom(null);
    lastFetchedToken.current = null;
    continuationTokenRef.current = null;
    isFetching.current = false;
    requestGeneration.current += 1;
    resetPersonaCollection();
    try {
      const response = await axios({
        method: "GET",
        url: "https://twitter154.p.rapidapi.com/user/tweets",
        params: { username: retweeted_from, limit: 40, include_replies: false },
        referrerPolicy: "no-referrer",
        headers: RAPIDAPI_HEADERS,
      });
      const results = response?.data?.results ?? response?.data?.tweets ?? [];
      const token = response?.data?.continuation_token ?? response?.data?.next_cursor ?? null;
      continuationTokenRef.current = token;
      const resolvedUsername = results?.[0]?.user?.username ?? retweeted_from;
      usernameRef.current = resolvedUsername;
      setTweets(results);
      setContinuationToken(token);
      accumulateTextTweets(results);
      setUsername(resolvedUsername);
      setLoadingText("");
    } catch (error) {
      console.log(error);
      setLoadingText("");
    } finally {
      setNewRetweetRequest(false);
    }
  }

  const continuationTokenRef = useRef(null);

  function fetchTweets(tokenOverride) {
    const token = tokenOverride ?? continuationTokenRef.current;
    const gen = requestGeneration.current;
    isFetching.current = true;
    setIsFetchingMore(true);
    let chaining = false;
    axios({
      method: "GET",
      url: "https://twitter154.p.rapidapi.com/user/tweets/continuation",
      params: { username: usernameRef.current, continuation_token: token, include_replies: false },
      referrerPolicy: "no-referrer",
      headers: RAPIDAPI_HEADERS,
    })
      .then((response) => {
        if (requestGeneration.current !== gen) return;
        const results = response?.data?.results ?? response?.data?.tweets ?? [];
        const nextToken = response?.data?.continuation_token ?? response?.data?.next_cursor ?? null;
        if (nextToken && nextToken === token) { setRunRequest(false); return; }
        continuationTokenRef.current = nextToken;
        setTweets((prevTweets) => [...(prevTweets || []), ...results]);
        setContinuationToken(nextToken);
        accumulateTextTweets(results);
        if (results.length === 0) { setRunRequest(false); return; }
        const hasVideo = results.some((t) => t.video_url?.length);
        if ((!hasVideo || personaModeRef.current) && nextToken) {
          chaining = true;
          lastFetchedToken.current = nextToken;
          fetchTweets(nextToken);
        } else if (!hasVideo && !nextToken) {
          setRunRequest(false);
        }
      })
      .catch((error) => {
        console.log("Error", error);
      })
      .finally(() => {
        if (!chaining) {
          isFetching.current = false;
          setIsFetchingMore(false);
        }
      });
  }

  function fetchSearchResults() {
    const token = searchContinuationToken.current;
    const gen = requestGeneration.current;
    isFetching.current = true;
    setIsFetchingMore(true);
    let chaining = false;
    axios({
      method: "GET",
      url: "https://twitter154.p.rapidapi.com/search/search/continuation",
      params: { query: currentQuery.current, continuation_token: token },
      referrerPolicy: "no-referrer",
      headers: RAPIDAPI_HEADERS,
    })
      .then((response) => {
        if (requestGeneration.current !== gen) return;
        const results = response?.data?.results ?? [];
        const nextToken = response?.data?.continuation_token ?? response?.data?.next_cursor ?? null;
        if (nextToken && nextToken === token) { setRunRequest(false); return; }
        searchContinuationToken.current = nextToken;
        setTweets((prev) => [...(prev || []), ...results]);
        setContinuationToken(nextToken);
        accumulateTextTweets(results);
        if (results.length === 0) { setRunRequest(false); return; }
        const hasVideo = results.some((t) => t.video_url?.length);
        if ((!hasVideo || personaModeRef.current) && nextToken) {
          chaining = true;
          lastFetchedToken.current = nextToken;
          fetchSearchResults();
        } else if (!hasVideo && !nextToken) {
          setRunRequest(false);
        }
      })
      .catch((error) => {
        console.log("Error", error);
      })
      .finally(() => {
        if (!chaining) {
          isFetching.current = false;
          setIsFetchingMore(false);
        }
      });
  }

  function openProfileSheet(userId, username, avatarUrl, followerCount = null, followingCount = null) {
    setProfileSheet({ userId, username, avatarUrl, followerCount, followingCount });
    setProfileList([]);
    setProfileListType(null);
    setProfileListToken(null);
    profileListFetching.current = false;
  }

  function closeProfileSheet() {
    setProfileSheet(null);
    setProfileList([]);
    setProfileListType(null);
    setProfileListToken(null);
  }

  function resetProfileList() {
    setProfileList([]);
    setProfileListType(null);
    setProfileListToken(null);
    profileListFetching.current = false;
  }

  async function fetchProfileList(type, userId) {
    if (profileListFetching.current) return;
    profileListFetching.current = true;
    setProfileListLoading(true);
    setProfileListType(type);
    setProfileList([]);
    setProfileListToken(null);
    const url = `https://twitter154.p.rapidapi.com/user/${type}`;
    try {
      const response = await axios({
        method: "GET",
        url,
        params: { user_id: userId, limit: 40 },
        headers: RAPIDAPI_HEADERS,
      });
      const results = response?.data?.results ?? [];
      const token = response?.data?.continuation_token ?? null;
      setProfileList(results);
      setProfileListToken(token);
    } catch (error) {
      console.log("Profile list error", error);
    } finally {
      setProfileListLoading(false);
      profileListFetching.current = false;
    }
  }

  async function fetchMoreProfileList(type, userId) {
    if (profileListFetching.current || !profileListToken) return;
    profileListFetching.current = true;
    setProfileListLoading(true);
    const url = `https://twitter154.p.rapidapi.com/user/${type}/continuation`;
    try {
      const response = await axios({
        method: "GET",
        url,
        params: { user_id: userId, continuation_token: profileListToken, limit: 40 },
        headers: RAPIDAPI_HEADERS,
      });
      const results = response?.data?.results ?? [];
      const token = response?.data?.continuation_token ?? null;
      setProfileList((prev) => [...prev, ...results]);
      setProfileListToken(token);
    } catch (error) {
      console.log("Profile list continuation error", error);
    } finally {
      setProfileListLoading(false);
      profileListFetching.current = false;
    }
  }

  function handleReachEnd() {
    if (isFetching.current || !continuationToken || !runRequest) return;
    if (continuationToken === lastFetchedToken.current) return;
    lastFetchedToken.current = continuationToken;
    if (feedType === "topic") fetchSearchResults();
    else fetchTweets(continuationTokenRef.current);
  }

  return (
    <TweetContext.Provider
      value={{
        getTweets,
        getSearchResults,
        retweetRequest,
        tweets,
        continuationToken,
        runRequest,
        isFetchingMore,
        username,
        handleChange,
        handleSearchChange,
        searchQuery,
        feedType,
        setFeedType,
        resetSearchQuery,
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
        resumeFeed,
        resumeError,
        setResumeError,
        isResumed,
        resumedFrom,
        profileSheet,
        openProfileSheet,
        closeProfileSheet,
        profileList,
        profileListType,
        profileListToken,
        profileListLoading,
        fetchProfileList,
        fetchMoreProfileList,
        resetProfileList,
        personaModeEnabled,
        setPersonaModeEnabled,
        textTweetCount,
        collectedTextTweets,
      }}
    >
      {children}
    </TweetContext.Provider>
  );
});

export { TweetContext, TweetContextProvider };
