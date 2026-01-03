import { createContext, useState, useEffect } from "react";
import axios from "axios";

const AxiosContext = createContext();

function AxiosContextProvider({ children }) {
  const [tweets, setTweets] = useState([]);
  const [continuationToken, setContinuationToken] = useState(undefined);
  const [username, setUsername] = useState();
   const [isInputVisible, setIsInputVisible] = useState(false);

  function onInputVisibilityButton(e) {
    e.preventDefault()
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
      setIsInputVisible(false)
    } catch (error) {
      console.log(error);
    }
  }

  const [runRequest, setRunRequest] = useState(true);

  useEffect(() => {
    if (runRequest === false) {
      return;
    } else {
      const timeoutId = setTimeout(() => {
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
            if (response.data.results?.length === 0) {
              setRunRequest(false);
            }
          })
          .catch((error) => {
            console.log("Error", error);
          });
      }, 7500);
      return () => clearTimeout(timeoutId);
    }
  }, [continuationToken, username]);

  return (
    <AxiosContext.Provider
      value={{ getTweets, tweets, username, handleChange, onInputVisibilityButton, isInputVisible }}
    >
      {children}
    </AxiosContext.Provider>
  );
}

export { AxiosContext, AxiosContextProvider };
