import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
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
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const cardHeight = height ? `${height}px` : "450px";
  const objectFit = fit === "fit" ? "contain" : "cover";
  //   console.log(post);

  const videoRef = useRef(null);

  const playbackRate = [0.10, 0.25, 0.50, 0.75, 1, 1.50, 1.75, 2];
  const [rate, setRate] = useState(3);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState();
  const [currentVideoPosition, setCurrentVideoPosition] = useState();

  function speedChanger() {
    setRate((prev) => (prev + 1) % playbackRate.length);
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const minutes = Math.floor(videoRef.current.duration / 60);
      const seconds = Math.floor(videoRef.current.duration % 60);
      setVideoDuration(`${minutes}:${seconds}`);
    }, 500);
    () => clearTimeout(timeoutId);
  }, []);
  console.log(videoDuration);

  useEffect(() => {
    if (post) {
      const intervalId = setInterval(() => {
        const minutes = Math.floor(videoRef.current.currentTime / 60);
        const seconds = Math.floor(videoRef.current.currentTime % 60);
        const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
        setCurrentVideoPosition(`${minutes}:${formattedSeconds}`);
      }, 500);
      () => clearInterval(intervalId);
    }
  }, []);

  useEffect(() => {
    videoRef.current.playbackRate = playbackRate[rate];
  }, [rate]);

  //   console.log(videoRef.current.onended());

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

  console.log(videoRef);

  return (
    <div
      className="card bookmark-card"
      style={{
        width: "100vw",
        height: cardHeight,
        position: "relative",
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
        <i class="fa-solid fa-trash-can"></i>
      </div>
      <div
        //   className="delete-btn"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          padding: 16,
          fontWeight: 300,
          marginBottom: 50,
          //   margin: "32px 16px",
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
        <div onClick={() => videoPlayToggle(isPlaying)}>
          <i class={isPlaying ? "fa-solid fa-play" : "fa-solid fa-pause"}></i>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 4
          }}
          htmlFor=""
        >
          <div>{currentVideoPosition}</div>
          <div className="time"></div>
          <div>{videoDuration}</div>
        </div>
        <button
          style={{ padding: "8px 15px", background: "#44444475" }}
          onClick={speedChanger}
        >
          {playbackRate[rate]}
        </button>
      </div>
      <video
        ref={videoRef}
        // controls={true}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          //   display: "block"
        }}
        src={post}
        poster={poster}
      />
    </div>
  );
}

{
  /* <ReactPlayer
        style={{ display: "block !important" }}
        className="react-video"
        width="100%"
        height="100%"
        playing={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        playsInline={true}
        controls={true}
        url={post}
        light={poster}
        onClickPreview={() => setIsPlaying(true)}
        config={{
          file: {
            forceVideo: true,
            attributes: {
              preload: "auto",
              referrerPolicy: "no-referrer",
              //   crossOrigin: "anonymous",
              style: {
                width: "100%",
                height: "100%",
                objectFit: objectFit,
              },
            },
          },
        }}
      /> */
}
