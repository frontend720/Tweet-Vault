import { useState, memo } from "react";
import ReactPlayer from "react-player";

export const CarouselCard = memo(({ tweet }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const cardHeight = tweet?.extended_entities?.media[0]?.sizes?.small?.h 
    ? `${tweet.extended_entities.media[0].sizes.small.h}px` 
    : "400px";

  return (
    <div className="card">
        <div style={tweet.video_url === null ? {display: "none"}:{ 
         width: "100vw", 
         height: cardHeight,
         position: "relative" 
      }}>
      <ReactPlayer
        slot="media"
        playing={isPlaying}
        className="react-video"
        playsInline={true}
        width="100%"
        height={tweet?.extended_entities?.media[0]?.sizes?.small?.h || "auto"}        
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
          tweet.video_url !== null
            ? tweet?.video_url[tweet?.video_url?.length - 1].url
            : null
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

