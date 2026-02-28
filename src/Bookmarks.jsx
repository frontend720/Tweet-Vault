import { useContext } from "react";
import { FirebaseContext } from "./FirebaseContext";
import BookmarkCard from "./Components/BookmarkCard";
import "./Bookmarks.css";
import { AxiosContext } from "./AxiosContext";
import { useNavigate } from "react-router";

export default function Bookmarks() {
  const { deleteTweet, sortedTweets } = useContext(FirebaseContext);
  const { onMenuToggle, retweetRequest } = useContext(AxiosContext);

  const navigation = useNavigate();
  return (
    <div className="Bookmark">
      <div onClick={onMenuToggle} className="menu-toggle bookmark-menu-toggle">
        <i className="fa-solid fa-bars"></i>
      </div>
      {sortedTweets.length === 0 ? "Find some tweets to like first": ""}
      <img width="100%" className="top-image" src={sortedTweets[0]?.poster} alt="" />
      {sortedTweets.map((item, index) => {
        const finalDate =
          item.tweet_creation_timestamp ||
          item.tweet_timestamp ||
          item.timestamp;
        return (
          <BookmarkCard
            key={index}
            post={item?.post}
            height={item?.height}
            fit={item?.fit}
            poster={item?.poster}
            media={item.post}
            username={item?.retweet_username || item?.username}
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
