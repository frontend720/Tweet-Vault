import "./RecentSavesComponent.css";
import { memo, useContext, useMemo } from "react";
import { TweetContext } from "../TweetContext";

export const RecentSavesComponent = memo(({ media }) => {
  const { retweetRequest } = useContext(TweetContext);

  const shuffledMedia = useMemo(() => {
    const uniqueItemsMap = new Map(
      media.slice(0, 11).map((item) => [item.username, item])
    );
    const uniqueMedia = [...uniqueItemsMap.values()];
    for (let i = uniqueMedia.length - 1; i > 0; i--) {
      // eslint-disable-next-line react-hooks/purity
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueMedia[i], uniqueMedia[j]] = [uniqueMedia[j], uniqueMedia[i]];
    }
    return uniqueMedia;
  }, [media]);

  return (
    <ul
      className="recent-list-container"
      style={{
        display: "flex",
        flexDirection: "row",
        listStyleType: "none",
        padding: 0,
        margin: 0,
        gap: "1rem",
      }}
    >
      <label className="recent-search-label" htmlFor="">Recent Searches</label>
      {shuffledMedia.map((item) => (
        <li key={item.tweetId || item.username}>
          <button
            className="recent-tag-btn"
            onClick={() => retweetRequest(item.username)}
          >
            {item.username}
          </button>
        </li>
      ))}
    </ul>
  );
});

export default RecentSavesComponent;
