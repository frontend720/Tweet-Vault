import { createContext, useState, useEffect, useRef } from "react";
import axios from "axios";

const AxiosContext = createContext();

function AxiosContextProvider({ children }) {
  const [tweets, setTweets] = useState([]);
  const [continuationToken, setContinuationToken] = useState(undefined);
  const [username, setUsername] = useState();
  const [isInputVisible, setIsInputVisible] = useState(false);
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

  async function retweetRequest(retweeted_from){
    setIndex(0)
    setRunRequest(true)
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
    })
    try {
      setTweets(response?.data?.results);
      setContinuationToken(response?.data?.continuation_token);
      setUsername(response?.data?.results[0]?.user?.username);
    } catch (error) {
      console.log(error)
    }
    // setTweets([])
    setIndex(0)
  }

  const [runRequest, setRunRequest] = useState(true);
  const isFetching = useRef(false);
  useEffect(() => {
    if (runRequest === false || index < 1 || isFetching.current) {
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
        setIndex(0)
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
  }, [continuationToken, username, index]);

  // useEffect(() => {
  //   if (isFetching.current === false) {
  //     setIndex(0);
  //   }
  // }, [isFetching.current]);

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
        setIndex
      }}
    >
      {children}
    </AxiosContext.Provider>
  );
}

export { AxiosContext, AxiosContextProvider };
