import { useContext, useState, useEffect, useRef } from "react";
import { FirebaseContext } from "./FirebaseContext";
import BookmarkCard from "./Components/BookmarkCard";
import { SkeletonBookmark } from "./Components/Skeleton";
import EmptyState from "./Components/EmptyState";
import "./Bookmarks.css";
import { TweetContext } from "./TweetContext";
import { useNavigate } from "react-router";

const PAGE_SIZE = 5;

export default function Bookmarks() {
  const { deleteTweet, sortedTweets, isLoading } = useContext(FirebaseContext);
  const { retweetRequest } = useContext(TweetContext);
  const navigation = useNavigate();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sortedTweets.length));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, sortedTweets.length]);

  const visible = sortedTweets.slice(0, visibleCount);

  if (isLoading) {
    return (
      <div className="Bookmark">
        <SkeletonBookmark />
        <SkeletonBookmark />
        <SkeletonBookmark />
        <SkeletonBookmark />
      </div>
    );
  }

  return (
    <div className="Bookmark">
      {sortedTweets.length === 0 && (
        <EmptyState
          icon="fa-solid fa-vault"
          title="Your vault is empty"
          body="Save videos from the feed and they'll live here, tagged and ready to revisit."
        />
      )}
      {sortedTweets.length > 0 && (
        <img width="100%" className="top-image" src={sortedTweets[0]?.poster} alt="" />
      )}
      {visible.map((item) => {
        const finalDate =
          item.tweet_creation_timestamp ||
          item.tweet_timestamp ||
          item.timestamp;
        return (
          <BookmarkCard
            key={item.tweetId}
            post={item?.post}
            height={item?.height}
            fit={item?.fit}
            poster={item?.poster}
            username={item?.retweet_username || item?.username}
            timestamp={finalDate}
            tags={item?.tags}
            note={item?.note}
            delete_btn={() => deleteTweet(item?.tweetId)}
            request={() => {
              retweetRequest(item?.retweet_username || item?.username);
              navigation("/");
            }}
          />
        );
      })}
      {visibleCount < sortedTweets.length && (
        <div ref={sentinelRef} style={{ height: 1 }} />
      )}
    </div>
  );
}
