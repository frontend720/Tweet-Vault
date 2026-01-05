import { useState, memo } from "react";
import ReactPlayer from "react-player";

export const CarouselCard = memo(({ tweet, tweetIdStyle }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const videoSrc = tweet?.video_url?.at(-1)?.url || tweet?.post;

  const rawHeight = tweet?.extended_entities?.media?.[0]?.sizes?.small?.h;
  const cardHeight = rawHeight ? `${rawHeight}px` : "400px";

  

  return (
    <div style={tweetIdStyle} className="card">
        <div style={tweet.video_url === null ? {display: "none"}:{ 
         width: "100vw", 
         height: cardHeight,
         position: "relative" 
      }}>
      <ReactPlayer
        slot="media"
        playing={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        // onEnded={() => setIsPlaying(false)}
        className="react-video"
        playsInline={true}
        width="100%"
        // autoPlay={true}
        // loop={tweet?.extended_entities?.media[0]?.video_info?.duration_millis < 30000 ? true : false}
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
        src={
          videoSrc
        }
        preload="true"
        config={{
          file: {
            attributes: {
              referrerPolicy: "no-referrer",
            },
          },
        }}
      />
      </div>
    </div>
  );
});

