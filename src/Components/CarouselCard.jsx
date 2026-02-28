import { useState } from "react";
import ReactPlayer from "react-player";
import { AxiosContext } from "../AxiosContext";

export const CarouselCard = ({ tweet, tweetIdStyle, isLast, username }) => {
  // const {isPlaying, setIsPlaying} = useContext(AxiosContext)
  const [isPlaying, setIsPlaying] = useState(false);

  const videoSrc = tweet?.video_url?.at(-1)?.url || tweet?.post;
  const proxyURL = `${import.meta.env.VITE_FUNCTION_URL}/proxy?url=${encodeURIComponent(videoSrc)}`;
  const rawHeight = tweet?.extended_entities?.media?.[0]?.sizes?.small?.h;
  const cardHeight = rawHeight ? `${rawHeight}px` : "400px";
  
  return (
    <div style={tweetIdStyle} className="card">
      {tweet.video_url !== null && (
        <div
          style={
            tweet.video_url === null
              ? { display: "none" }
              : {
                  width: "100vw",
                  height: cardHeight,
                  position: "relative",
                }
          }
        >
          <ReactPlayer
            slot="media"
            playing={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="react-video"
            playsInline={true}
            width="100%"
            height={rawHeight || "auto"}
            style={
              tweet.video_url !== null
                ? {
                    display: "block",
                    height: tweet?.extended_entities?.media[0]?.sizes?.small?.h,
                    width: "100vw",
                    objectFit:
                      tweet?.extended_entities?.media[0]?.sizes?.small?.resize,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : { display: "none" }
            }
            controls
            light={tweet.extended_entities?.media?.[0]?.media_url_https}
            onClickPreview={() => setIsPlaying(true)}
            src={proxyURL}
            preload="true"
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
