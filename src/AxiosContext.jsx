import {
  createContext,
  useState,
  useEffect,
  useRef,
  memo,
  useContext,
} from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "./config";
import axios from "axios";
import { AuthStateContext } from "./AuthStateContext";

const AxiosContext = createContext();

const AxiosContextProvider = memo(({ children }) => {
  const [media, setMedia] = useState([]);
  const [menuToggle, setMenuToggle] = useState(false);
  // const {media} = useContext(FirebaseContext)
  const [tweets, setTweets] = useState([]);
  const [continuationToken, setContinuationToken] = useState(undefined);
  const [username, setUsername] = useState();
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [newRetweetRequest, setNewRetweetRequest] = useState(false);
  const [areRetweetsLoading, setAreRetweetsLoading] = useState([]);
  const [loadingText, setLoadingText] = useState("");
  const [receievedInitialSet, setReceivedInitialSet] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);

  function onPlayChange() {
    setIsPlaying((prev) => !prev);
  }
  // console.log(continuationToken)

  const { email } = useContext(AuthStateContext);

  function onMenuToggle() {
    setMenuToggle((prev) => !prev);
  }
  const [index, setIndex] = useState(0);

  // useEffect(() => {
  //   async function getTweets() {
  //     const media = [];
  //     const querySnapshot = await getDocs(collection(db, email));
  //     try {
  //       querySnapshot.forEach((tweet) => {
  //         media.push(tweet.data());
  //       });
  //       setMedia(media);
  //       // console.log(media)
  //       setReceivedInitialSet(true)
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }
  //   getTweets();
  // }, []);

  // console.log(media)

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
        headers: {
          "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
          "x-rapidapi-host": "twitter154.p.rapidapi.com",
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
    // setTweets([])
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
      setAreRetweetsLoading(false);
      if (areRetweetsLoading === true) {
        setLoadingText(`Finding ${retweeted_from}s posts. Please wait`);
      } else {
        return setLoadingText("");
      }
    } catch (error) {
      console.log(error);
    }
    // setIndex(0)
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
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
        "x-rapidapi-host": "twitter154.p.rapidapi.com",
      },
    })
      .then((response) => {
        const newResults = response.data.results || [];
        const nextToken = response.data.continuation_token;

        // Update our tracker with the token we just used
        lastFetchedToken.current = continuationToken;

        // Guard 3: If no new data or the token is identical to the current one, stop the cycle
        // if (newResults.length === 0 || nextToken === continuationToken) {
        //   setRunRequest(false);
        //   return;
        // }

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
      headers: {
        "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
        "x-rapidapi-host": "twitter154.p.rapidapi.com",
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

    // Guard: Don't fetch the same token again
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
      }}
    >
      {children}
    </AxiosContext.Provider>
  );
});

export { AxiosContext, AxiosContextProvider };

// import { createContext, useState, useEffect, useRef, useContext } from "react";
// import { getDocs, doc, collection } from "firebase/firestore";
// import { db } from "./config";
// import axios from "axios";

// const AxiosContext = createContext();

// function AxiosContextProvider({ children }) {
//   const [media, setMedia] = useState([]);
//   const [menuToggle, setMenuToggle] = useState(false);
//   // const {media} = useContext(FirebaseContext)
//   const [tweets, setTweets] = useState([]);
//   const [continuationToken, setContinuationToken] = useState(undefined);
//   const [username, setUsername] = useState();
//   const [isInputVisible, setIsInputVisible] = useState(false);
//   const [newRetweetRequest, setNewRetweetRequest] = useState(false);

//   function onMenuToggle(){
//     setMenuToggle((prev) => !prev)
//   }

//   // useEffect(() => {
//   //   async function getTweets() {
//   //     const media = [];
//   //     setIndex(0);
//   //     const querySnapshot = await getDocs(
//   //       collection(db, "doccnasty@gmail.com")
//   //     );
//   //     try {
//   //       querySnapshot.forEach((tweet) => {
//   //         media.push(tweet.data());
//   //       });
//   //       setMedia(media);
//   //     } catch (error) {
//   //       console.log(error);
//   //     }
//   //   }
//   //   getTweets();
//   // }, [tweets]);

//     useEffect(() => {
//     async function getTweets() {
//       const media = [];
//       const querySnapshot = await getDocs(collection(db, email));
//       try {
//         querySnapshot.forEach((tweet) => {
//           media.push(tweet.data());
//         });
//         setMedia(media);
//         setReceivedInitialSet(true)
//       } catch (error) {
//         console.log(error);
//       }
//     }
//     getTweets();
//   }, [tweets]);

//   const [index, setIndex] = useState(0);

//   function changeDirection() {
//     setIndex((prev) => prev + 1);
//   }

//   function onInputVisibilityButton(e) {
//     e.preventDefault();
//     setIsInputVisible((prev) => !prev);
//   }

//   function handleChange(e) {
//     setUsername(e.target.value);
//   }

//   async function getTweets(e) {
//     setUsername("")
//     setTweets([])
//     setIndex(0)
//     setContinuationToken(undefined)
//     e.preventDefault();
//     try {
//       const response = await axios({
//         method: "GET",
//         url: "https://twitter154.p.rapidapi.com/user/tweets",
//         params: {
//           username: username,
//           limit: 20,
//           include_replies: false,
//           include_pinned: false,
//         },
//         headers: {
//           "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
//           "x-rapidapi-host": "twitter154.p.rapidapi.com",
//         },
//       });
//       setTweets(response?.data?.results || []);
//       setContinuationToken(response?.data?.continuation_token);
//       setUsername(response?.data?.results[0]?.user?.username);
//       setIsInputVisible(false);
//     } catch (error) {
//       console.log(error);
//     }
//     // setTweets([])
//   }

//   const isFetching = useRef(false);

//   async function retweetRequest(retweeted_from) {
//     setTweets([]);
//     setUsername("");
//     setIndex(0);
//     setRunRequest(true);
//     setNewRetweetRequest(true);
//     setContinuationToken(undefined)
//     const response = await axios({
//       method: "GET",
//       url: "https://twitter154.p.rapidapi.com/user/tweets",
//       params: {
//         username: retweeted_from,
//         limit: 20,
//         include_replies: false,
//         include_pinned: false,
//       },
//       headers: {
//         "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
//         "x-rapidapi-host": "twitter154.p.rapidapi.com",
//       },
//     });
//     try {
//       setTweets(response?.data?.results);
//       setContinuationToken(response?.data?.continuation_token);
//       setUsername(response?.data?.results[0]?.user?.username);
//       setNewRetweetRequest(false);
//     } catch (error) {
//       console.log(error);
//     }
//     // setIndex(0)
//   }

//   const [runRequest, setRunRequest] = useState(true);
//   useEffect(() => {
//     const threshold = tweets.length > 0 ? tweets.length - 5 : 14;
//     if (runRequest === false || tweets.length < 1 || isFetching.current) {
//       return;
//     }

//     isFetching.current = true;
//     axios({
//       method: "GET",
//       url: "https://twitter154.p.rapidapi.com/user/tweets/continuation",
//       params: {
//         username: username,
//         continuation_token: continuationToken,
//       },
//       headers: {
//         "x-rapidapi-key": import.meta.env.VITE_TWITTER_API_KEY,
//         "x-rapidapi-host": "twitter154.p.rapidapi.com",
//       },
//     })
//       .then((response) => {
//         setTweets((prevTweets) => [
//           ...(prevTweets || []),
//           ...(response.data.results || []),
//         ]);
//         setContinuationToken(response?.data.continuation_token);
//         setIndex(0);
//         if (response.data.results?.length === 0) {
//           setRunRequest(false);
//         }
//       })
//       .catch((error) => {
//         console.log("Error", error);
//       })
//       .finally(() => {
//         isFetching.current = false;
//       });
//   }, [continuationToken, username, index, tweets?.length]);

//   return (
//     <AxiosContext.Provider
//       value={{
//         getTweets,
//         retweetRequest,
//         tweets,
//         username,
//         handleChange,
//         onInputVisibilityButton,
//         isInputVisible,
//         changeDirection,
//         setIndex,
//         newRetweetRequest,
//         menuToggle,
//         onMenuToggle
//       }}
//     >
//       {children}
//     </AxiosContext.Provider>
//   );
// }

// export { AxiosContext, AxiosContextProvider };