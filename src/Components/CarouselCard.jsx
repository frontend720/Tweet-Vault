import { useRef, useEffect, useState } from "react";
import HeartButton from "./HeartButton";

export const CarouselCard = ({ tweet, tweetIdStyle, onVideoError, isActive, onPlayingChange, savedImages, onSavePoster }) => {
  const [started, setStarted] = useState(false);
  const videoRef = useRef(null);

  const videoSrc = tweet?.video_url?.at(-1)?.url || tweet?.post;
  const proxyURL = `${import.meta.env.VITE_FUNCTION_URL}/proxy?url=${encodeURIComponent(videoSrc)}`;
  const rawHeight = tweet?.extended_entities?.media?.[0]?.sizes?.small?.h;
  const rawWidth = tweet?.extended_entities?.media?.[0]?.sizes?.small?.w;
  const aspectRatio = rawWidth && rawHeight ? `${rawWidth} / ${rawHeight}` : "16 / 9";
  const posterUrl = tweet?.extended_entities?.media?.[0]?.media_url_https;

  // Play/pause when the slide becomes active or inactive
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.play().catch(() => {});
    } else {
      v.pause();
      onPlayingChange?.(false);
    }
  }, [isActive, onPlayingChange]);

  return (
    <div style={tweetIdStyle} className="card">
      {tweet.video_url !== null && (
        <div
          style={{
            width: "min(100vw, 600px)",
            aspectRatio,
            maxHeight: "75dvh",
            position: "relative",
            margin: "0 auto",
            background: "#000",
          }}
        >
          {/* Hidden probe — fires onVideoError if the poster is stale */}
          {posterUrl && (
            <img
              src={posterUrl}
              alt=""
              style={{ display: "none" }}
              onError={onVideoError}
            />
          )}

          {/* Poster overlay — shown until the user taps play */}
          {!started && (
            <div
              className="carousel-poster"
              onClick={() => setStarted(true)}
            >
              {posterUrl && (
                <img src={posterUrl} alt="" className="carousel-poster__img" />
              )}
              <div className="carousel-poster__play">
                <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
              {posterUrl && onSavePoster && (
                <div
                  className="carousel-poster__save"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HeartButton
                    isLiked={savedImages?.some((s) => s.imageUrl === posterUrl) ?? false}
                    onSave={() => onSavePoster(posterUrl)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Native video — mounts on poster tap, autoPlay fires within the user gesture */}
          {started && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              loop
              controls
              src={proxyURL}
              onPlay={() => onPlayingChange?.(true)}
              onPause={() => onPlayingChange?.(false)}
              onError={onVideoError}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
