import { useContext } from "react";
import { FirebaseContext } from "./FirebaseContext";
import BookmarkCard from "./Components/BookmarkCard";
import "./Bookmarks.css";
import { AxiosContext } from "./AxiosContext";
export default function Bookmarks() {
  const { media, deleteTweet } = useContext(FirebaseContext);
  const {onMenuToggle} = useContext(AxiosContext)
  console.log(media);

  const sortedTweets = media.sort((a, b) => b.timestamp - a.timestamp);
  return (
    <div className="Bookmark">
      <div onClick={onMenuToggle} className="menu-toggle">
        <i class="fa-solid fa-bars"></i>
      </div>
      {sortedTweets.map((item) => (
        <BookmarkCard
          key={item?.tweetId || item?.post}
          post={item?.post}
          height={item?.height}
          fit={item?.fit}
          poster={item?.poster}
          media={item}
          username={item?.username}
          timestamp={item?.timestamp}
          delete_btn={() => deleteTweet(item?.timestamp)}
        />
      ))}
    </div>
  );
}
