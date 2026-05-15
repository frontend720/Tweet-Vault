import { useContext, useEffect, useRef, useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "./Carousel.css";
import { TweetContext } from "./TweetContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Pagination, Thumbs, Virtual } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { CarouselCard } from "./Components/CarouselCard";
import { FirebaseContext } from "./FirebaseContext";
import RecentSavesComponent from "./Components/RecentSavesComponent.jsx";
import ResumeSessionsComponent from "./Components/ResumeSessionsComponent.jsx";
import { SkeletonFeed } from "./Components/Skeleton";
import HeartButton from "./Components/HeartButton";
import SavePrompt from "./Components/SavePrompt";
import UserProfileSheet from "./Components/UserProfileSheet";
import TapImageViewer from "./Components/TapImageViewer";

dayjs.extend(relativeTime);

const ACCOUNTS = ["NASA", "NatGeo", "ArchDaily", "RedBull", "HumansOfNY"];

function Carousel() {
  const {
    getTweets,
    getSearchResults,
    tweets,
    username,
    handleChange,
    handleSearchChange,
    searchQuery,
    feedType,
    setFeedType,
    resetSearchQuery,
    isInputVisible,
    onInputVisibilityButton,
    changeDirection,
    retweetRequest,
    newRetweetRequest,
    loadingText,
    handleReachEnd,
    resetUsername,
    resumeFeed,
    resumeError,
    setResumeError,
    isResumed,
    resumedFrom,
    continuationToken,
    runRequest,
    isFetchingMore,
    openProfileSheet,
    personaModeEnabled,
    textTweetCount,
    collectedTextTweets,
  } = useContext(TweetContext);

  const { saveTweet, sortedTweets: media, deleteTweet, saveImage, sortedImages: images, collections, savePersona } =
    useContext(FirebaseContext);

  const [erroredIds, setErroredIds] = useState(() => new Set());
  const [pendingSave, setPendingSave] = useState(null);
  const swiperRef = useRef(null);

  const resumeSessions = useMemo(() => {
    const seen = new Set();
    return media.filter((item) => {
      if (!item.resumeToken || !item.browseUsername) return false;
      if (seen.has(item.resumeToken)) return false;
      seen.add(item.resumeToken);
      return true;
    });
  }, [media]);

  const liveTweets = useMemo(() => {
    const seen = new Map();
    tweets?.forEach((tweet) => seen.set(tweet.tweet_id, tweet));
    return Array.from(seen.values())
      .filter((tweet) => (tweet.video_url?.length || tweet.media_url?.length) && !erroredIds.has(tweet.tweet_id))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [tweets, erroredIds]);

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isBuildingPersona, setIsBuildingPersona] = useState(false);
  const [personaBuilt, setPersonaBuilt] = useState(false);

  const PERSONA_THRESHOLD = 40;

  function personaStrength(count) {
    if (count >= 200) return { key: "strong", label: "STRONG" };
    if (count >= 100) return { key: "moderate", label: "MODERATE" };
    return { key: "weak", label: "WEAK" };
  }

  async function handleBuildPersona() {
    if (isBuildingPersona || !username) return;
    setIsBuildingPersona(true);
    try {
      const functionsBase = import.meta.env.VITE_FUNCTION_URL ? new URL(import.meta.env.VITE_FUNCTION_URL).origin : "";
      const res = await fetch(`${functionsBase}/buildPersona`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tweets: collectedTextTweets.current,
          username,
          model: localStorage.getItem("tv_persona_model") ?? undefined,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        const profilePicUrl = tweets?.[0]?.user?.profile_pic_url ?? null;
        await savePersona(username, data.summary, collectedTextTweets.current.length, profilePicUrl);
        setPersonaBuilt(true);
      }
    } catch (err) {
      console.error("Build persona error:", err);
    } finally {
      setIsBuildingPersona(false);
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    setPersonaBuilt(false);
    setIsBuildingPersona(false);
    setIsVideoPlaying(false);
    autoFetchAttempts.current = 0;
  }, [username]);

  const autoFetchAttempts = useRef(0);
  useEffect(() => {
    if (tweets.length === 0 || newRetweetRequest) return;
    const hasVideo = liveTweets.some((t) => t.video_url?.length);
    // In persona mode bypass the hasVideo guard — kick off the chain immediately
    if (!personaModeEnabled && hasVideo) return;
    if (!continuationToken || autoFetchAttempts.current >= 5) return;
    autoFetchAttempts.current += 1;
    handleReachEnd();
  }, [tweets, liveTweets, newRetweetRequest, continuationToken, handleReachEnd, personaModeEnabled]);

  useEffect(() => {
    if (tweets.length === 0) autoFetchAttempts.current = 0;
  }, [tweets.length]);

  useEffect(() => {
    if (isResumed && swiperRef.current) {
      swiperRef.current.slideTo(1, 0);
    }
  }, [isResumed]);



  return (
    <div className="App">
      <form
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Enter") feedType === "account" ? getTweets() : getSearchResults();
        }}
        className={isInputVisible ? "form" : "form-closed"}
        style={{
          marginTop: isInputVisible ? 80 : "",
          opacity: isVideoPlaying && !isInputVisible ? 0 : 1,
          pointerEvents: isVideoPlaying && !isInputVisible ? "none" : "auto",
          transition: "opacity 0.2s ease",
        }}
        action=""
      >
        <div
          style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          <button
            onClick={onInputVisibilityButton}
            style={{ background: "transparent", border: "none", color: "var(--text-primary)" }}
          >
            <i
              className={
                isInputVisible
                  ? "fa-solid fa-xmark"
                  : "fa-solid fa-magnifying-glass"
              }
            ></i>
          </button>

          <input
            type="text"
            name={feedType === "account" ? "username" : "query"}
            value={feedType === "account" ? (username ?? "") : searchQuery}
            onChange={feedType === "account" ? handleChange : handleSearchChange}
            className="search-input"
            style={isInputVisible ? { display: "block" } : { display: "none" }}
            placeholder={feedType === "account" ? "Handle" : "Topics, #hashtags…"}
          />
          <button
            disabled={feedType === "account" ? !username : !searchQuery}
            style={
              isInputVisible
                ? {
                    background: "transparent",
                    border: "none",
                    position: "absolute",
                    right: 0,
                    color: "var(--text-primary)",
                  }
                : { display: "none" }
            }
            onClick={feedType === "account" ? getTweets : getSearchResults}
          >
            <i style={{ color: "var(--text-primary)" }} className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        {isInputVisible && (
          <div className="search-mode-toggle">
            <button
              className={`search-mode-btn${feedType === "account" ? " search-mode-btn--active" : ""}`}
              onClick={(e) => { e.preventDefault(); setFeedType("account"); }}
            >
              @ Account
            </button>
            <button
              className={`search-mode-btn${feedType === "topic" ? " search-mode-btn--active" : ""}`}
              onClick={(e) => { e.preventDefault(); setFeedType("topic"); }}
            >
              # Topic
            </button>
          </div>
        )}
        <button
          className="reset-button"
          onClick={feedType === "account" ? resetUsername : resetSearchQuery}
          style={
            isInputVisible && (username || searchQuery)
              ? { display: "block" }
              : { display: "none" }
          }
        >
          Clear
        </button>
      </form>
      {personaModeEnabled && username && tweets.length > 0 && !personaBuilt && !isInputVisible && !isVideoPlaying && (
        <div className="persona-chip">
          {textTweetCount >= PERSONA_THRESHOLD ? (
            <button
              className={`persona-chip__btn persona-chip__btn--${personaStrength(textTweetCount).key}`}
              onClick={handleBuildPersona}
              disabled={isBuildingPersona}
            >
              {isBuildingPersona ? (
                <i className="fa-solid fa-circle-notch fa-spin" />
              ) : (
                <i className="fa-solid fa-wand-magic-sparkles" />
              )}
              <span className="persona-chip__text">
                {isBuildingPersona ? "Building…" : `Build @${username} persona`}
              </span>
              {!isBuildingPersona && (
                <span className="persona-chip__strength">{personaStrength(textTweetCount).label}</span>
              )}
            </button>
          ) : (
            <span className="persona-chip__collecting">
              <i className="fa-solid fa-circle-notch fa-spin" />
              <span className="persona-chip__text">
                Collecting @{username} · {textTweetCount}/{PERSONA_THRESHOLD}
              </span>
            </span>
          )}
        </div>
      )}
      {personaModeEnabled && username && personaBuilt && !isInputVisible && !isVideoPlaying && (
        <div className="persona-chip">
          <span className="persona-chip__done">
            <i className="fa-solid fa-check" />
            <span className="persona-chip__text">Persona saved · visit Settings to chat</span>
          </span>
        </div>
      )}
      <div
        style={tweets.length === 0 ? { display: "" } : { display: "none" }}
        className="cta"
      >
        <span>{loadingText}</span>
        {!newRetweetRequest ? (
          <>
            <div className="cta-text-container">
              <label>
                Ready to browse? Tap an account below or search any handle to see their videos and photos.
              </label>
              <div className="suggested-chips">
                {ACCOUNTS.map((account) => (
                  <button
                    key={account}
                    className="suggested-chip"
                    onClick={() => retweetRequest(account)}
                  >
                    @{account}
                  </button>
                ))}
              </div>
              <div
                style={isInputVisible ? { display: "none" } : { display: "" }}
                className="search-input-container"
              >
                <button
                  className="in-widget-search-btn"
                  onClick={onInputVisibilityButton}
                >
                  <i className="fa-solid fa-magnifying-glass" style={{ marginRight: 8 }}></i>
                  Search a handle
                </button>
              </div>
            </div>
            <ResumeSessionsComponent
              sessions={resumeSessions}
              onResume={(username, token) => resumeFeed(username, token)}
            />
            <RecentSavesComponent media={media} />
          </>
        ) : (
          <SkeletonFeed />
        )}
      </div>
      <Swiper
        onReachEnd={handleReachEnd}
        onSlideChangeTransitionEnd={(swiper) => {
          changeDirection();
          swiper.allowSlideNext = true;
        }}
        onSlideChange={(swiper) => { setActiveSlideIdx(swiper.activeIndex); setIsVideoPlaying(false); }}
        grabCursor={true}
        modules={[Pagination, Thumbs, Virtual]}
        virtual={true}
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        slidesPerView={1}
        autoHeight={true}
        initialSlide={isResumed ? 1 : 0}
        style={
          liveTweets?.length === 0 || newRetweetRequest
            ? { display: "none" }
            : { display: "block", minWidth: "100vw" }
        }
      >
        {isResumed && (
          <SwiperSlide virtualIndex={0} key="resume-info">
            <div className="resume-info-slide">
              {liveTweets[0]?.extended_entities?.media?.[0]?.media_url_https && (
                <>
                  <img
                    src={liveTweets[0].extended_entities.media[0].media_url_https}
                    alt=""
                    className="resume-info-slide__poster"
                  />
                  <div className="resume-info-slide__veil" />
                </>
              )}
              <i className="fa-solid fa-arrow-left resume-info-slide__arrow" />
              <p className="resume-info-slide__heading">You resumed mid-feed</p>
              <p className="resume-info-slide__body">
                These are <strong>@{resumedFrom}</strong>'s tweets from a saved point — not their most recent posts. Swipe right to browse from here, or load fresh.
              </p>
              <button
                className="resume-info-slide__btn"
                onClick={() => retweetRequest(resumedFrom)}
              >
                Load most recent posts
              </button>
            </div>
          </SwiperSlide>
        )}
        {liveTweets.map((tweet, index) => {
          const isLiked = media.some(
            (savedTweet) => savedTweet.tweetId === tweet.tweet_id,
          );
          const isLastVisible = index === liveTweets.length - 1 && isFetchingMore;
          const virtualIdx = isResumed ? index + 1 : index;
          return (
            <SwiperSlide
              style={
                tweet.tweetId === undefined
                  ? { display: "" }
                  : { display: "none" }
              }
              virtualIndex={virtualIdx}
              onClick={changeDirection}
              key={tweet.tweet_id}
            >
              <CarouselCard
                tweetIdStyle={
                  tweet.tweetId !== undefined
                    ? { display: "none" }
                    : { display: "" }
                }
                tweet={tweet}
                username={feedType === "account" ? tweet?.user?.username : null}
                isActive={index === activeSlideIdx}
                onPlayingChange={setIsVideoPlaying}
                onVideoError={() => setErroredIds((prev) => new Set([...prev, tweet.tweet_id]))}
                savedImages={images}
                onSavePoster={(url) => saveImage(url, tweet.tweet_id, tweet?.user?.username, tweet?.user?.user_id)}
              />
              {!tweet.video_url?.length && tweet.media_url?.length > 0 && (
                <TapImageViewer
                  images={tweet.media_url}
                  savedImages={images}
                  onSave={saveImage}
                  tweet={tweet}
                />
              )}
              <div
                style={
                  tweet.tweetId !== undefined
                    ? { display: "none" }
                    : { display: "" }
                }
                className="text-container"
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <img
                    style={{ borderRadius: 16, marginRight: 6, cursor: "pointer" }}
                    width="50px"
                    src={tweet?.user?.profile_pic_url}
                    alt=""
                    onClick={(e) => {
                      e.stopPropagation();
                      openProfileSheet(
                        tweet?.user?.user_id,
                        tweet?.user?.username,
                        tweet?.user?.profile_pic_url,
                        tweet?.user?.follower_count,
                        tweet?.user?.following_count,
                      );
                    }}
                  />
                  <div style={{ width: "85%", marginBottom: 6 }}>
                    <label style={{ width: "35%", display: "flex" }} htmlFor="">
                      {" "}
                      <button
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 8,
                          all: "unset",
                          width: 300,
                        }}
                        disabled={tweet?.retweet_status === null}
                        onClick={() =>
                          retweetRequest(tweet?.retweet_status?.user?.username)
                        }
                      >
                        <strong>{tweet?.user?.username}</strong> {tweet?.text}
                      </button>
                    </label>
                  </div>
                </div>
                <small style={{ textAlign: "right" }}>
                  {dayjs(tweet?.creation_date).fromNow()}
                </small>
                <div
                  style={
                    tweet?.video_url === null
                      ? { display: "none" }
                      : { display: "flex", justifyContent: "flex-end", marginTop: 10 }
                  }
                >
                  <HeartButton
                    isLiked={isLiked}
                    onSave={() => setPendingSave({ tweet, resumeToken: continuationToken, browseUsername: username })}
                    onDelete={() => {
                      const saved = media.find((m) => m.tweetId === tweet?.tweet_id);
                      if (saved?._id) deleteTweet(saved._id);
                    }}
                  />
                </div>
              </div>
              {isLastVisible && (
                <div className="fetching-more-indicator">
                  <i className="fa-solid fa-spinner fa-spin" />
                </div>
              )}
            </SwiperSlide>
          );
        })}

        {!runRequest && liveTweets.length > 0 && (
          <SwiperSlide
            virtualIndex={liveTweets.length + (isResumed ? 1 : 0)}
            key="end-of-feed"
          >
            <div className="end-of-feed-slide">
              <i className="fa-solid fa-flag-checkered end-of-feed-slide__icon" />
              <p className="end-of-feed-slide__heading">You've reached the end</p>
              <p className="end-of-feed-slide__body">
                {username
                  ? `No more posts from @${username}.`
                  : "No more results."}
              </p>
              <div className="end-of-feed-slide__actions">
                <button
                  className="end-of-feed-slide__btn end-of-feed-slide__btn--primary"
                  onClick={() => retweetRequest(username ?? resumedFrom)}
                >
                  <i className="fa-solid fa-rotate-right" />
                  {isResumed ? "Load fresh posts" : "Back to top"}
                </button>
              </div>
            </div>
          </SwiperSlide>
        )}
      </Swiper>

      {liveTweets.length > 0 && !isInputVisible && !isVideoPlaying && (
        <div className="feed-wordmark">
          <i className="fa-solid fa-vault feed-wordmark__icon" />
          <span className="feed-wordmark__text">
            Tweet<span className="feed-wordmark__accent">Vault</span>
          </span>
        </div>
      )}

      {resumeError && (
        <div className="resume-error-banner">
          <span>Session expired — start fresh from @{resumeError.username}?</span>
          <div className="resume-error-actions">
            <button
              className="resume-error-btn resume-error-btn--primary"
              onClick={() => { retweetRequest(resumeError.username); setResumeError(null); }}
            >
              Start fresh
            </button>
            <button
              className="resume-error-btn"
              onClick={() => setResumeError(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <UserProfileSheet />

      {pendingSave && (
        <SavePrompt
          collections={collections}
          onDismiss={() => setPendingSave(null)}
          onConfirm={(tags, note, collectionName) => {
            const { tweet, resumeToken, browseUsername } = pendingSave;
            saveTweet(
              tweet?.video_url[tweet?.video_url?.length - 1].url,
              tweet?.tweet_id,
              tweet?.user?.username,
              tweet?.extended_entities?.media[0]?.sizes?.small?.h,
              tweet?.extended_entities?.media[0]?.sizes?.small?.resize,
              tweet?.extended_entities?.media?.[0]?.media_url_https,
              tweet?.retweet_status?.user?.username,
              tweet?.retweet_status?.creation_date,
              tweet?.creation_date,
              tags,
              note,
              collectionName,
              resumeToken,
              browseUsername,
              tweet?.user?.user_id,
            );
            setPendingSave(null);
          }}
        />
      )}
    </div>
  );
}

export default Carousel;
