import { useState, useRef, useEffect, useId, useContext } from "react";
import { TweetContext } from "../TweetContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./BookmarkCard.css";
import VideoScrubber from "./VideoScrubber";
import CollectionPicker from "./CollectionPicker";

dayjs.extend(relativeTime);

const PLAYBACK_RATES = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 1.75, 2];

function BookmarkCard({
  post,
  poster,
  username,
  userId,
  timestamp,
  tags,
  note,
  collectionName,
  collections,
  onMoveToCollection,
  delete_btn,
  request,
  resumeToken,
  browseUsername,
  onResume,
}) {
  const { openProfileSheet } = useContext(TweetContext);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const cardRef = useRef(null);
  const cardId = useId();

  // isPlaying = true means PAUSED (controls visible), false means PLAYING (controls hidden)
  const [isPlaying, setIsPlaying] = useState(true);

  const [rate, setRate] = useState(4);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [videoDuration, setVideoDuration] = useState("0:00");
  const [currentVideoPosition, setCurrentVideoPosition] = useState("0:00");

  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.1 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  function handleEnded() {
    setCurrentVideoPosition("0:00");
    setCurrentTimeSec(0);
    setIsPlaying(true);
  }

  function speedChanger() {
    setRate((prev) => (prev + 1) % PLAYBACK_RATES.length);
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const duration = video.duration;
    setDurationSec(duration);
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    setVideoDuration(`${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;
    setCurrentTimeSec(current);
    const minutes = Math.floor(current / 60);
    const seconds = Math.floor(current % 60);
    setCurrentVideoPosition(`${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`);
  };

  const handleSeek = (time) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTimeSec(time);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = PLAYBACK_RATES[rate];
    }
  }, [rate]);

  // Pause when card scrolls out of view
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          const v = videoRef.current;
          if (v && !v.paused) { v.pause(); setIsPlaying(true); }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Pause when another card starts playing
  useEffect(() => {
    function onOtherPlay(e) {
      if (e.detail.id === cardId) return;
      const v = videoRef.current;
      if (v && !v.paused) { v.pause(); setIsPlaying(true); }
    }
    document.addEventListener("tv:videoplay", onOtherPlay);
    return () => document.removeEventListener("tv:videoplay", onOtherPlay);
  }, [cardId]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(false);
      document.dispatchEvent(new CustomEvent("tv:videoplay", { detail: { id: cardId } }));
    } else {
      videoRef.current.pause();
      setIsPlaying(true);
    }
  };

  const proxyURL = `${import.meta.env.VITE_FUNCTION_URL}/proxy?url=${encodeURIComponent(post)}`;

  // Controls are visible when paused (isPlaying=true), hidden when playing (isPlaying=false)
  const hidden = { opacity: 0, pointerEvents: "none" };

  return (
    <>
    <div
      ref={cardRef}
      className="card bookmark-card"
      style={{ width: "100vw", position: "relative", color: "var(--text-primary)" }}
    >
      <div
        className="delete-btn video-overlay"
        style={isPlaying
          ? { position: "absolute", top: 0, left: 0, margin: 20, zIndex: 99 }
          : { position: "absolute", top: 0, left: 0, margin: 20, zIndex: 99, ...hidden }
        }
        onClick={delete_btn}
      >
        <i className="fa-solid fa-trash-can"></i>
      </div>

      <div
        className="video-overlay"
        onClick={userId
          ? () => openProfileSheet(userId, username, poster)
          : request
        }
        style={isPlaying
          ? { position: "absolute", top: 0, right: 0, padding: 16, fontWeight: 300, zIndex: 99, cursor: "pointer" }
          : { position: "absolute", top: 0, right: 0, padding: 16, fontWeight: 300, zIndex: 99, cursor: "pointer", ...hidden }
        }
      >
        <h4 className="bookmark-username">@{username}</h4>
        <small style={{ textAlign: "right" }}>{dayjs(timestamp).fromNow()}</small>
        {tags?.length > 0 && (
          <div className="bookmark-tags">
            {tags.map((tag) => (
              <span key={tag} className="bookmark-tag">{tag}</span>
            ))}
          </div>
        )}
        {note && <small className="bookmark-note">{note}</small>}
        <button
          className="bookmark-collection-btn"
          onClick={(e) => { e.stopPropagation(); setShowCollectionPicker(true); }}
        >
          <i className={collectionName ? "fa-solid fa-folder" : "fa-solid fa-folder-plus"} />
          {collectionName && <span className="bookmark-collection-name">{collectionName}</span>}
        </button>
      </div>

      {showCollectionPicker && (
        <CollectionPicker
          currentCollection={collectionName}
          collections={collections}
          onDismiss={() => setShowCollectionPicker(false)}
          onConfirm={(name) => {
            onMoveToCollection(name);
            setShowCollectionPicker(false);
          }}
        />
      )}

      <div
        className="play-btn video-overlay"
        onClick={(e) => e.stopPropagation()}
        style={!isPlaying ? hidden : undefined}
      >
        <div className="play-toggle" onClick={togglePlay}>
          <i className={isPlaying ? "fa-solid fa-play" : "fa-solid fa-pause"}></i>
        </div>

        <div className="controls-track">
          <span className="controls-time">{currentVideoPosition}</span>
          <VideoScrubber
            currentTime={currentTimeSec}
            duration={durationSec}
            onSeek={handleSeek}
          />
          <span className="controls-time controls-time--end">{videoDuration}</span>
        </div>

        <button className="speed-btn" onClick={speedChanger}>
          {PLAYBACK_RATES[rate]}x
        </button>
      </div>

      <video
        ref={videoRef}
        onClick={togglePlay}
        style={{ width: "100%", height: "auto", display: "block" }}
        src={shouldLoad ? proxyURL : undefined}
        referrerPolicy="no-referrer"
        poster={poster}
        preload={!shouldLoad ? "none" : !isPlaying ? "auto" : "metadata"}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        playsInline={true}
        loop
      />
    </div>

    {resumeToken && (
      <button
        className="bookmark-resume-strip"
        onClick={() => onResume(browseUsername, resumeToken)}
      >
        <i className="fa-solid fa-arrow-right" />
        <span>Continue browsing @{browseUsername} from here</span>
      </button>
    )}
    </>
  );
}

export default BookmarkCard;
