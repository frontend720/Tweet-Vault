import { useState, useEffect } from "react";
import ReactPlayer from "react-player";

export const CarouselCard = ({ tweet, tweetIdStyle, isLast, username, onVideoError, isActive }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isActive) setIsPlaying(false);
  }, [isActive]);

  const videoSrc = tweet?.video_url?.at(-1)?.url || tweet?.post;
  const proxyURL = `${import.meta.env.VITE_FUNCTION_URL}/proxy?url=${encodeURIComponent(videoSrc)}`;
  const rawHeight = tweet?.extended_entities?.media?.[0]?.sizes?.small?.h;
  const cardHeight = rawHeight ? `${rawHeight}px` : "400px";
  const posterUrl = tweet?.extended_entities?.media?.[0]?.media_url_https;

  return (
    <div style={tweetIdStyle} className="card">
      {tweet.video_url !== null && (
        <div
          style={{
            width: "100vw",
            height: cardHeight,
            position: "relative",
          }}
        >
          {/* Hidden probe image — fires onVideoError if the poster (and likely the video) is stale */}
          {posterUrl && (
            <img
              src={posterUrl}
              alt=""
              style={{ display: "none" }}
              onError={onVideoError}
            />
          )}
          <ReactPlayer
            slot="media"
            playing={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={onVideoError}
            className="react-video"
            playsInline={true}
            width="100%"
            height={rawHeight || "auto"}
            style={{
              display: "block",
              height: tweet?.extended_entities?.media[0]?.sizes?.small?.h,
              width: "100vw",
              objectFit: tweet?.extended_entities?.media[0]?.sizes?.small?.resize,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            controls
            light={posterUrl}
            onClickPreview={() => setIsPlaying(true)}
            src={proxyURL}
            preload="none"
            config={{
              file: {
                attributes: {
                  referrerPolicy: "strict-origin-when-cross-origin",
                },
              },
            }}
          />
        </div>
      )}
      {isLast && (
        <div
          className="end-of-feed-message"
          style={{ padding: "20px", textAlign: "center" }}
        >
          {`You've reached the end of ${username}'s tweets`}
        </div>
      )}
    </div>
  );
};
