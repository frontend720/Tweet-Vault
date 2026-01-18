import "./RecentSavesComponent.css";
import { memo, useContext, useEffect, useRef, useState } from "react";
import { AxiosContext } from "../AxiosContext";

export const RecentSavesComponent = memo(({ id, media }) => {
  const { retweetRequest } = useContext(AxiosContext);
  const uniqueItemsMap = new Map(
    media.slice(0, 11).map((item) => [item.username, item])
  );
  const uniqueMedia = [...uniqueItemsMap.values()];

  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
  const shuffledMedia = shuffleArray(uniqueMedia);

  return (
    <ul
      key={id}
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
            <li>{item.username}</li>
          </button>
        </li>
      ))}
    </ul>
  );
});

export default RecentSavesComponent;
