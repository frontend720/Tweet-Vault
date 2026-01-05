import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./BookmarkCard.css";

dayjs.extend(relativeTime);

export default function BookmarkCard({
  post,
  poster,
  height,
  fit,
  username,
  timestamp,
  delete_btn,
  request,
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const cardHeight = height ? `${height}px` : "450px";

  const videoRef = useRef(null);

  // --- STATE MANAGEMENT ---
  const playbackRate = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 1.75, 2];
  const [rate, setRate] = useState(4); // Default to 1x speed (index 4)

  // 1. Numeric values for the Slider
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  // 2. String values for the UI Text ("0:00")
  const [videoDuration, setVideoDuration] = useState("0:00");
  const [currentVideoPosition, setCurrentVideoPosition] = useState("0:00");

  function handleEnded() {
    setCurrentVideoPosition("0:00");
    setCurrentTimeSec(0);
    setIsPlaying(true);
  }

  function speedChanger() {
    setRate((prev) => (prev + 1) % playbackRate.length);
  }

  // --- HANDLER 1: SETS TOTAL DURATION (Runs once on load) ---
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    const duration = video.duration;
    setDurationSec(duration); // Set Slider Max

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    setVideoDuration(`${minutes}:${formattedSeconds}`);
  };

  // --- HANDLER 2: UPDATES TIME (Runs every second while playing) ---
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const current = video.currentTime;
    setCurrentTimeSec(current); // Move Slider Knob

    const minutes = Math.floor(current / 60);
    const seconds = Math.floor(current % 60);
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    setCurrentVideoPosition(`${minutes}:${formattedSeconds}`);
  };

  // --- HANDLER 3: USER SCRUBS SLIDER ---
  const handleScrub = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const manualChange = Number(e.target.value);
    video.currentTime = manualChange;
    setCurrentTimeSec(manualChange);
  };

  // Sync Playback Rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate[rate];
    }
  }, [rate]);

  function videoPlayToggle(shouldPlay) {
    if (videoRef.current) {
      if (shouldPlay) {
        videoRef.current.play();
        setIsPlaying(false);
      } else {
        videoRef.current.pause();
        setIsPlaying(true);
      }
    }
  }

  return (
    <div
      className="card bookmark-card"
      style={{
        width: "100vw",
        height: cardHeight,
        position: "relative",
        color: "#e8e8e8",
      }}
    >
      <div
        className="delete-btn"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          margin: 20,
          zIndex: 99,
        }}
        onClick={delete_btn}
      >
        <i className="fa-solid fa-trash-can"></i>
      </div>
      <div
        onClick={request}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          padding: 16,
          fontWeight: 300,
          marginBottom: 50,
          zIndex: 99,
          cursor: "pointer"
        }}
      >
        <h4 className="bookmark-username">@{username}</h4>
        <small style={{ textAlign: "right" }}>
          {dayjs(timestamp).fromNow()}
        </small>
      </div>

      <div
        className="play-btn"
        style={{
          position: "absolute",
          bottom: 0,
          zIndex: 99,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div
          style={{ marginRight: 10 }}
          onClick={() => videoPlayToggle(isPlaying)}
        >
          <i
            className={isPlaying ? "fa-solid fa-play" : "fa-solid fa-pause"}
          ></i>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            width: "100%", // Ensures container takes space
          }}
        >
          <div style={{ minWidth: "35px" }}>{currentVideoPosition}</div>

          <input
            type="range"
            min="0"
            max={durationSec}
            value={currentTimeSec}
            onChange={handleScrub}
            className="video-progress-bar"
            step={0.1}
          />

          <div style={{ minWidth: "35px" }}>{videoDuration}</div>
        </div>

        <button
          style={{
            padding: "8px 15px",
            background: "#44444475",
            color: "#e8e8e8d7",
            marginLeft: "10px",
          }}
          onClick={speedChanger}
        >
          {playbackRate[rate]}x
        </button>
      </div>

      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        src={post}
        poster={poster}
        onLoadedMetadata={handleLoadedMetadata} // CORRECTED
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        playsInline={true}
      />
    </div>
  );
}
