import { useContext, useState } from "react";
import { FirebaseContext } from "./FirebaseContext";
import ReactPlayer from "react-player";
import BookmarkCard from "./Components/BookmarkCard";
export default function Bookmarks() {
  const { media } = useContext(FirebaseContext);
  console.log(media);
  return (
    <div>
      {media.map((item) => (
        <BookmarkCard
          key={item?.tweetId || item?.post}
          post={item?.post}
          height={item?.height}
          fit={item?.fit}
          poster={item?.poster}
          media={item}
        />
      ))}
    </div>
  );
}
