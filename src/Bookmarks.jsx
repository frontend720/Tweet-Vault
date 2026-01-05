import { useContext, useState, useEffect } from "react";
import { FirebaseContext } from "./FirebaseContext";
import BookmarkCard from "./Components/BookmarkCard";
import "./Bookmarks.css";
import { AxiosContext } from "./AxiosContext";
import { useNavigate } from "react-router";
export default function Bookmarks() {
  const { media, deleteTweet } = useContext(FirebaseContext);
  const { onMenuToggle, retweetRequest } = useContext(AxiosContext);
  const [date, setDate] = useState();

  const sortedTweets = media.sort((a, b) => b.timestamp - a.timestamp);

  const tweet_dates = sortedTweets.map((tweet) => tweet);

  useEffect(() => {
    if (tweet_dates.tweet_creation_date !== null) {
      setDate(tweet_dates.tweet_creation_date);
    } else if (tweet_dates.tweet_timestamp !== null) {
      setDate(tweet_dates.tweet_timestamp);
    } else {
      setDate(tweet_dates.timestamp);
    }
  }, [sortedTweets]);

  const navigation = useNavigate();
  return (
    <div className="Bookmark">
      <div onClick={onMenuToggle} className="menu-toggle">
        <i class="fa-solid fa-bars"></i>
      </div>
      {sortedTweets.map((item) => {
        const finalDate =
          item.tweet_creation_timestamp ||
          item.tweet_timestamp ||
          item.timestamp;

        return (
          <BookmarkCard
            key={item?.tweetId || item?.post}
            post={item?.post}
            height={item?.height}
            fit={item?.fit}
            poster={item?.poster}
            media={item}
            username={item?.retweet_username || item?.username}
            //   timestamp={item?.tweet_creation_timestamp || item?.tweet_timestamp}
            timestamp={finalDate}
            delete_btn={() => deleteTweet(item?.tweetId)}
            request={() => {
              retweetRequest(item?.retweet_username || item?.username);
              navigation("/");
            }}
          />
        );
      })}
    </div>
  );
}
