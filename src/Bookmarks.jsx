import { useContext, useState, useEffect, useRef } from "react";
import { FirebaseContext } from "./FirebaseContext";
import BookmarkCard from "./Components/BookmarkCard";
import { SkeletonBookmark } from "./Components/Skeleton";
import EmptyState from "./Components/EmptyState";
import "./Bookmarks.css";
import { TweetContext } from "./TweetContext";
import { useNavigate } from "react-router";
import { AiOutlineFullscreen } from "react-icons/ai";
import UserProfileSheet from "./Components/UserProfileSheet";

const PAGE_SIZE = 5;
const UNCOLLECTED = "__uncollected__";

export default function Bookmarks() {
  const {
    deleteTweet,
    sortedTweets,
    collections,
    updateTweetCollection,
    isLoading,
  } = useContext(FirebaseContext);
  const { retweetRequest, resumeFeed } = useContext(TweetContext);
  const navigation = useNavigate();

  const [selectedCollection, setSelectedCollection] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [viewMode, setViewMode] = useState("scroll");
  const [sortOrder, setSortOrder] = useState("desc");
  const [hideMissingPosters, setHideMissingPosters] = useState(false);
  const [tabsDropdownOpen, setTabsDropdownOpen] = useState(false);
  const [anyVideoPlaying, setAnyVideoPlaying] = useState(false);

  useEffect(() => {
    const onPlay = () => setAnyVideoPlaying(true);
    const onPause = () => setAnyVideoPlaying(false);
    document.addEventListener("tv:videoplay", onPlay);
    document.addEventListener("tv:videopause", onPause);
    return () => {
      document.removeEventListener("tv:videoplay", onPlay);
      document.removeEventListener("tv:videopause", onPause);
    };
  }, []);
  const [playIndex, setPlayIndex] = useState(0);
  const PLAYBACK_RATES = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 1.75, 2];
  const [________, setIsPaused] = useState(false);
  const [rate, setRate] = useState(4); // index 4 = 1x
  const [tapIcon, setTapIcon] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const sentinelRef = useRef(null);
  const videoRef = useRef(null);
  const tapTimerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const controlsOverlayRef = useRef(null);

  function revealControls() {
    controlsOverlayRef.current?.classList.add("playlist-overlay--visible");
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(
      () => controlsOverlayRef.current?.classList.remove("playlist-overlay--visible"),
      3000
    );
  }
  function speedChanger() {
    setRate((prev) => (prev + 1) % PLAYBACK_RATES.length);
    revealControls();
  }

  function handleScrub(e) {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    const video = videoRef.current;
    if (video) video.currentTime = t;
    revealControls();
  }

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = PLAYBACK_RATES[rate];
  }, [rate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    clearTimeout(controlsTimerRef.current);
    controlsOverlayRef.current?.classList.remove("playlist-overlay--visible");
    video.load();
    video.play().catch(() => {});
    console.log(videoRef.current)
  }, [playIndex]);

  function formatTime(s) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function handleVideoTap() {
    const video = videoRef.current;
    if (!video) return;
    revealControls();
    if (video.paused) {
      video.play();
      setIsPaused(false);
      showTapIcon("play");
    } else {
      video.pause();
      setIsPaused(true);
      showTapIcon("pause");
    }
  }

  function showTapIcon(type) {
    clearTimeout(tapTimerRef.current);
    setTapIcon(type);
    tapTimerRef.current = setTimeout(() => setTapIcon(null), 600);
  }

  const baseFiltered =
    selectedCollection === UNCOLLECTED
      ? sortedTweets.filter((t) => !t.collectionName)
      : selectedCollection
      ? sortedTweets.filter((t) => t.collectionName?.toLowerCase() === selectedCollection)
      : sortedTweets;

  const hasMissingPosters = baseFiltered.some((t) => !t.poster);
  const posterFiltered = hideMissingPosters ? baseFiltered.filter((t) => t.poster) : baseFiltered;
  const filteredTweets = sortOrder === "asc" ? [...posterFiltered].reverse() : posterFiltered;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + PAGE_SIZE, filteredTweets.length),
          );
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredTweets.length]);

  const visible = filteredTweets.slice(0, visibleCount);

  const handleFullscreen = () => {
    const elem = videoRef.current;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {

      elem.webkitRequestFullscreen();
    }
  };

  if (isLoading) {
    return (
      <div className="Bookmark">
        <SkeletonBookmark />
        <SkeletonBookmark />
        <SkeletonBookmark />
        <SkeletonBookmark />
      </div>
    );
  }

  if (viewMode === "play" && filteredTweets.length > 0) {
    const current = filteredTweets[playIndex];
    const proxyURL = `${import.meta.env.VITE_FUNCTION_URL}/proxy?url=${encodeURIComponent(current.post)}`;

    return (
      <>
      <div className="playlist">
        <div className="playlist-header">
          <button
            className="playlist-back-btn"
            onClick={() => setViewMode("scroll")}
          >
            <i className="fa-solid fa-list" />
          </button>
          <span className="playlist-counter">
            {playIndex + 1} / {filteredTweets.length}
          </span>
        </div>

        <div className="playlist-video-wrap" onClick={handleVideoTap}>
          <video
            ref={videoRef}
            className="playlist-video"
            src={proxyURL}
            autoPlay
            playsInline
            onEnded={() =>
              setPlayIndex((i) => Math.min(i + 1, filteredTweets.length - 1))
            }
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            onLoadedMetadata={(e) => {
              setDuration(e.target.duration);
              setCurrentTime(0);
              setRate(4);
            }}
          />
          {tapIcon && (
            <div className="playlist-tap-icon">
              <i
                className={`fa-solid fa-${tapIcon === "play" ? "play" : "pause"}`}
              />
            </div>
          )}
        </div>

        <div className="playlist-overlay" ref={controlsOverlayRef}>
          <div className="playlist-scrubber" onClick={(e) => e.stopPropagation()}>
            <span className="playlist-time">{formatTime(currentTime)}</span>
            <input
              className="playlist-range"
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleScrub}
            />
            <span className="playlist-time">{formatTime(duration)}</span>
          </div>

          <div className="playlist-meta">
            <span
              className="playlist-username"
              style={{ cursor: current.user_id ? "pointer" : "default" }}
              onClick={() => {
                retweetRequest(current.retweet_username || current.username);
                navigation("/");
              }}
            >
              @{current.retweet_username || current.username}
            </span>
            {current.tags?.length > 0 && (
              <div className="playlist-tags">
                {current.tags.map((tag) => (
                  <span key={tag} className="playlist-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {current.note && <p className="playlist-note">{current.note}</p>}
          </div>

          <div className="playlist-controls">
            <button
              disabled={playIndex === 0}
              onClick={() => { revealControls(); setPlayIndex((i) => i - 1); }}
            >
              <i className="fa-solid fa-backward-step" />
            </button>
            <button className="playlist-speed-btn" onClick={speedChanger}>
              {PLAYBACK_RATES[rate]}x
            </button>
            <button
              disabled={playIndex === filteredTweets.length - 1}
              onClick={() => { revealControls(); setPlayIndex((i) => i + 1); }}
            >
              <i className="fa-solid fa-forward-step" />
            </button>
            <button onClick={handleFullscreen}>
              <AiOutlineFullscreen />
            </button>
          </div>
        </div>
      </div>
      <UserProfileSheet />
      </>
    );
  }

  return (
    <div className="Bookmark">
      {sortedTweets.length === 0 && (
        <EmptyState
          icon="fa-solid fa-vault"
          title="Your vault is empty"
          body="Save videos from the feed and they'll live here, tagged and ready to revisit."
        />
      )}
      {sortedTweets.length > 0 && (
        <img
          width="100%"
          className="top-image"
          src={sortedTweets[0]?.poster}
          alt=""
        />
      )}
      {sortedTweets.length > 0 && (
        <div className="bookmarks-view-row" style={anyVideoPlaying ? { opacity: 0, pointerEvents: "none" } : undefined}>
          <span className="bookmarks-count">{filteredTweets.length} saved</span>
          <div style={{ display: "flex", gap: 8 }}>
            {hasMissingPosters && (
              <button
                className={`view-mode-toggle${hideMissingPosters ? " view-mode-toggle--active" : ""}`}
                onClick={() => setHideMissingPosters((h) => !h)}
                title={hideMissingPosters ? "Show all saves" : "Hide saves without thumbnail"}
              >
                <i className="fa-solid fa-image" />
              </button>
            )}
            <button
              className="view-mode-toggle"
              onClick={() => setSortOrder((o) => o === "desc" ? "asc" : "desc")}
              title={sortOrder === "desc" ? "Oldest first" : "Newest first"}
            >
              <i className={`fa-solid fa-arrow-${sortOrder === "desc" ? "down" : "up"}-wide-short`} />
            </button>
            <button
              className="view-mode-toggle"
              onClick={() => {
                setViewMode("play");
                setPlayIndex(0);
              }}
              title="Play all"
            >
              <i className="fa-solid fa-play" />
            </button>
          </div>
        </div>
      )}
      {collections.length > 0 && (() => {
        const hasUnsorted = sortedTweets.some((t) => !t.collectionName);
        const totalTabs = 1 + (hasUnsorted ? 1 : 0) + collections.length;
        const activeLabel = selectedCollection === null ? "All"
          : selectedCollection === UNCOLLECTED ? "Unsorted"
          : selectedCollection;

        const tabButtons = (extraClass = "") => (
          <>
            <button
              className={`bookmarks-tab${extraClass}${selectedCollection === null ? " bookmarks-tab--active" : ""}`}
              onClick={() => { setSelectedCollection(null); setVisibleCount(PAGE_SIZE); setPlayIndex(0); setTabsDropdownOpen(false); }}
            >All</button>
            {hasUnsorted && (
              <button
                className={`bookmarks-tab${extraClass}${selectedCollection === UNCOLLECTED ? " bookmarks-tab--active" : ""}`}
                onClick={() => { setSelectedCollection(UNCOLLECTED); setVisibleCount(PAGE_SIZE); setPlayIndex(0); setTabsDropdownOpen(false); }}
              >Unsorted</button>
            )}
            {collections.map((name) => (
              <button
                key={name}
                className={`bookmarks-tab${extraClass}${selectedCollection === name ? " bookmarks-tab--active" : ""}`}
                onClick={() => { setSelectedCollection(name.toLowerCase()); setVisibleCount(PAGE_SIZE); setPlayIndex(0); setTabsDropdownOpen(false); }}
              >{name}</button>
            ))}
          </>
        );

        return totalTabs > 8 ? (
          <div className="bookmarks-tabs-dropdown-wrap" style={anyVideoPlaying ? { opacity: 0, pointerEvents: "none" } : undefined}>
            <button
              className="bookmarks-tabs-dropdown-trigger"
              onClick={() => setTabsDropdownOpen((o) => !o)}
            >
              <i className="fa-solid fa-filter" />
              {activeLabel}
              <i className={`fa-solid fa-chevron-${tabsDropdownOpen ? "up" : "down"}`} />
            </button>
            {tabsDropdownOpen && (
              <div className="bookmarks-tabs-dropdown">
                {tabButtons(" bookmarks-tab--block")}
              </div>
            )}
          </div>
        ) : (
          <div className="bookmarks-tabs" style={anyVideoPlaying ? { opacity: 0, pointerEvents: "none" } : undefined}>{tabButtons()}</div>
        );
      })()}
      {visible.map((item) => {
        const finalDate =
          item.tweet_creation_timestamp ||
          item.tweet_timestamp ||
          item.timestamp;
        return (
          <BookmarkCard
            key={item._id}
            post={item?.post}
            height={item?.height}
            fit={item?.fit}
            poster={item?.poster}
            username={item?.retweet_username || item?.username}
            userId={item?.user_id ?? null}
            timestamp={finalDate}
            tags={item?.tags}
            note={item?.note}
            collectionName={item?.collectionName}
            collections={collections}
            onMoveToCollection={(name) =>
              updateTweetCollection(item._id, name)
            }
            delete_btn={() => deleteTweet(item._id)}
            request={() => {
              retweetRequest(item?.retweet_username || item?.username);
              navigation("/");
            }}
            resumeToken={item?.resumeToken}
            browseUsername={item?.browseUsername}
            onResume={(u, t) => { resumeFeed(u, t); navigation("/"); }}
          />
        );
      })}
      {visibleCount < filteredTweets.length && (
        <div ref={sentinelRef} style={{ height: 1 }} />
      )}
      <UserProfileSheet />
    </div>
  );
}
