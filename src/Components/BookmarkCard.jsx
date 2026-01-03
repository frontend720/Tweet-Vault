import { useState } from "react";
import ReactPlayer from "react-player";

export default function BookmarkCard({
  media,
  text,
  post,
  poster,
  height,
  fit,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const cardHeight = height ? `${height}px` : "450px";
  const objectFit = fit === "fit" ? "contain" : "cover";
  console.log(post, poster);

  return (
    <div
      className="card"
      style={{
        width: "100vw",
        height: cardHeight,
        position: "relative",
      }}
    >
      <ReactPlayer
        slot="media"
        className="react-video"
        width="100%"
        height="100%"
        playing={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        playsInline={true}
        controls
        url={post}
        // light={poster}
        onClickPreview={() => setIsPlaying(true)}
        config={{
          file: {
            attributes: {
              preload: "auto",
              referrerPolicy: "no-referrer",
              style: {
                width: "100%",
                height: "100%",
                objectFit: objectFit,
              },
            },
          },
        }}
      />
      {post}
    </div>
  );
}
