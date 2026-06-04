import { useState, useEffect, useRef, useContext } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Virtual } from "swiper/modules";
import "swiper/css";
import { auth } from "../config";
import { FirebaseContext } from "../FirebaseContext";
import HeartButton from "./HeartButton";
import "./HomeFeed.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";
const PROXY_BASE = import.meta.env.VITE_FUNCTION_URL
  ? new URL(import.meta.env.VITE_FUNCTION_URL).origin
  : "";

function HomeFeedCard({ item, isActive, onBrowseUsername }) {
  const [started, setStarted] = useState(false);
  const videoRef = useRef(null);
  const { saveTweet, sortedTweets, deleteTweet } = useContext(FirebaseContext);

  const proxyUrl = `${PROXY_BASE}/proxy?url=${encodeURIComponent(item.videoUrl)}`;
  const isSaved = sortedTweets.some((m) => m.post === item.videoUrl);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive && started) v.play().catch(() => {});
    else v.pause();
  }, [isActive, started]);

  function handleSave() {
    if (isSaved) {
      const saved = sortedTweets.find((m) => m.post === item.videoUrl);
      if (saved) deleteTweet(saved._id);
    } else {
      saveTweet({
        post: item.videoUrl,
        poster: item.posterUrl ?? null,
        username: item.username,
        tweetId: item.id,
        source: item.source,
      });
    }
  }

  return (
    <div className="hf-card">
      <div className="hf-card__video-wrap">
        {!started && (
          <div className="hf-card__poster" onClick={() => setStarted(true)}>
            {item.posterUrl && <img src={item.posterUrl} alt="" className="hf-card__poster-img" />}
            <div className="hf-card__play">
              <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>
        )}
        {started && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            loop
            controls
            src={proxyUrl}
            className="hf-card__video"
          />
        )}
      </div>
      <div className="hf-card__bar">
        <button className="hf-card__username" onClick={() => onBrowseUsername(item.username)}>
          @{item.username}
        </button>
        <HeartButton isLiked={isSaved} onSave={handleSave} />
      </div>
    </div>
  );
}

export default function HomeFeed({ onBrowseUsername }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    async function loadFeed() {
      try {
        const { data } = await auth.getIdToken();
        if (!data?.token) return;
        const res = await fetch(`${SERVER_URL}/api/feed`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (res.ok) setFeed(await res.json());
      } catch { /* show empty state */ }
      finally { setLoading(false); }
    }
    loadFeed();
  }, []);

  if (loading) {
    return (
      <div className="hf-loading">
        <i className="fa-solid fa-circle-notch fa-spin" />
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="hf-empty">
        <p>Save a video to start building your feed.</p>
      </div>
    );
  }

  return (
    <div className="hf-root">
      <Swiper
        modules={[Virtual]}
        virtual
        slidesPerView={1}
        onSlideChange={(s) => setActiveIdx(s.activeIndex)}
        className="hf-swiper"
      >
        {feed.map((item, i) => (
          <SwiperSlide key={item.id} virtualIndex={i}>
            <HomeFeedCard
              item={item}
              isActive={i === activeIdx}
              onBrowseUsername={onBrowseUsername}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
