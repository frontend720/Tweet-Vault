import { useContext, useEffect, useRef, useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "./Carousel.css";
import { TweetContext } from "./TweetContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Pagination, Thumbs, Virtual } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import gsap from "gsap";
import { CarouselCard } from "./Components/CarouselCard";
import { FirebaseContext } from "./FirebaseContext";
import RecentSavesComponent from "./Components/RecentSavesComponent.jsx";
import { SkeletonFeed } from "./Components/Skeleton";
import HeartButton from "./Components/HeartButton";
import SavePrompt from "./Components/SavePrompt";

dayjs.extend(relativeTime);

const ACCOUNTS = ["NASA", "NatGeo", "ArchDaily", "RedBull", "HumansOfNY"];

function Carousel() {
  const {
    getTweets,
    tweets,
    username,
    handleChange,
    isInputVisible,
    onInputVisibilityButton,
    changeDirection,
    retweetRequest,
    newRetweetRequest,
    loadingText,
    handleReachEnd,
    resetUsername,
  } = useContext(TweetContext);

  const { saveTweet, sortedTweets: media, deleteTweet, saveImage, sortedImages: images } =
    useContext(FirebaseContext);

  const [erroredIds, setErroredIds] = useState(() => new Set());
  const [pendingSave, setPendingSave] = useState(null);

  const liveTweets = useMemo(() => {
    const seen = new Map();
    tweets?.forEach((tweet) => seen.set(tweet.tweet_id, tweet));
    return Array.from(seen.values())
      .filter((tweet) => (tweet.video_url || tweet.media_url) && !erroredIds.has(tweet.tweet_id))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [tweets, erroredIds]);

  const [accountIndex, setAccountIndex] = useState(0);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  useEffect(() => {
    if (tweets.length !== 0) return;
    const intervalId = setInterval(() => {
      setAccountIndex((prev) => (prev + 1) % ACCOUNTS.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, [tweets.length]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  const accountRef = useRef(null);
  useEffect(() => {
    if (tweets.length !== 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(accountRef.current, { opacity: 1, duration: 1 });
    gsap.to(accountRef.current, { delay: 2.5, opacity: 0, duration: 0.5 });
  }, [accountIndex, tweets.length]);


  return (
    <div className="App">
      <form
        onKeyDown={(e) => {
          if (e.key === "Enter") getTweets();
        }}
        className={isInputVisible ? "form" : "form-closed"}
        style={isInputVisible ? { marginTop: 80 } : { marginTop: "" }}
        action=""
      >
        <div
          style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          <button
            onClick={onInputVisibilityButton}
            style={{ background: "transparent", border: "none", color: "#e8e8e8" }}
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
            name="username"
            value={username}
            onChange={handleChange}
            className="search-input"
            style={isInputVisible ? { display: "block" } : { display: "none" }}
            placeholder="Handle"
          />
          <button
            disabled={!username}
            style={
              isInputVisible
                ? {
                    background: "transparent",
                    border: "none",
                    position: "absolute",
                    right: 0,
                    color: "#e8e8e8",
                  }
                : { display: "none" }
            }
            onClick={getTweets}
            onKeyDown={(e) => {
              if (e.key === "Enter") getTweets();
            }}
          >
            <i style={{ color: "#e8e8e8" }} className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        <button
          className="reset-button"
          onClick={resetUsername}
          style={
            isInputVisible && username
              ? { display: "block" }
              : { display: "none" }
          }
        >
          Clear
        </button>
      </form>
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
        onSlideChange={(swiper) => setActiveSlideIdx(swiper.activeIndex)}
        grabCursor={true}
        modules={[Pagination, Thumbs, Virtual]}
        virtual={true}
        slidesPerView={1}
        autoHeight={true}
        style={
          liveTweets?.length === 0 || newRetweetRequest
            ? { display: "none" }
            : { display: "block", minWidth: "100vw" }
        }
      >
        {liveTweets.map((tweet, index) => {
          const isLiked = media.some(
            (savedTweet) => savedTweet.tweetId === tweet.tweet_id,
          );
          const isLastSlide = index === liveTweets.length - 1;
          return (
            <SwiperSlide
              style={
                tweet.tweetId === undefined
                  ? { display: "" }
                  : { display: "none" }
              }
              virtualIndex={index}
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
                isLast={isLastSlide}
                username={tweet?.user?.username}
                isActive={index === activeSlideIdx}
                onVideoError={() => setErroredIds((prev) => new Set([...prev, tweet.tweet_id]))}
              />
              <div
                style={
                  tweet.video_url !== null
                    ? { display: "none" }
                    : { display: "" }
                }
                className="image-swiper"
              >
                <Swiper
                  direction="horizontal"
                  touchStartPreventDefault={false}
                  nested={true}
                  touchReleaseOnEdges={true}
                  pagination={{ clickable: true }}
                  modules={[Pagination, Thumbs]}
                  slidesPerView={1}
                  autoHeight={true}
                  style={
                    tweet?.media_url === null
                      ? { display: "none" }
                      : {
                          height:
                            tweet?.extended_entities?.media[0]?.sizes?.small?.h,
                          objectFit:
                            tweet?.extended_entities?.media[0]?.sizes?.resize,
                        }
                  }
                >
                  {tweet?.media_url?.map((image) => {
                    const isImageLiked = images.some(
                      (savedItem) => savedItem.imageUrl === image,
                    );
                    return (
                      <SwiperSlide
                        style={
                          tweet.video_url === null
                            ? {
                                height:
                                  tweet?.extended_entities?.media[0]?.sizes
                                    ?.small?.h,
                              }
                            : { display: "none" }
                        }
                        key={image}
                      >
                        <img style={{ width: "100%" }} src={image} alt="" />
                        <button
                          className="save-image-button swiper-no-swiping"
                          disabled={isImageLiked}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          style={{
                            backgroundColor: "#555555",
                            cursor: isImageLiked ? "not-allowed" : "pointer",
                          }}
                        >
                          <HeartButton
                            isLiked={isImageLiked}
                            onSave={() => saveImage(image, tweet.tweet_id)}
                          />
                        </button>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
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
                    style={{ borderRadius: 16, marginRight: 6 }}
                    width="50px"
                    src={tweet?.user?.profile_pic_url}
                    alt=""
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
                <label
                  style={
                    tweet?.video_url === null
                      ? { display: "none" }
                      : { display: "block", textAlign: "right" }
                  }
                  htmlFor=""
                >
                  <label style={{ marginTop: 10 }} htmlFor="">
                    <HeartButton
                      isLiked={isLiked}
                      style={{ textAlign: "right", fontSize: 20, marginTop: 16 }}
                      onSave={() => setPendingSave(tweet)}
                      onDelete={() => deleteTweet(tweet?.tweet_id)}
                    />
                  </label>
                </label>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {pendingSave && (
        <SavePrompt
          onDismiss={() => setPendingSave(null)}
          onConfirm={(tags, note) => {
            saveTweet(
              pendingSave?.video_url[pendingSave?.video_url?.length - 1].url,
              pendingSave?.tweet_id,
              pendingSave?.user?.username,
              pendingSave?.extended_entities?.media[0]?.sizes?.small?.h,
              pendingSave?.extended_entities?.media[0]?.sizes?.small?.resize,
              pendingSave?.extended_entities?.media?.[0]?.media_url_https,
              pendingSave?.retweet_status?.user?.username,
              pendingSave?.retweet_status?.creation_date,
              pendingSave?.creation_date,
              tags,
              note,
            );
            setPendingSave(null);
          }}
        />
      )}
    </div>
  );
}

export default Carousel;
