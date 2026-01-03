import { useContext, useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "./Carousel.css";
import { AxiosContext } from "./AxiosContext";
import ReactPlayer from "react-player";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Pagination, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import gsap from "gsap";
import { CarouselCard } from "./Components/CarouselCard";

dayjs.extend(relativeTime);

function Carousel() {
  const {
    getTweets,
    tweets,
    username,
    handleChange,
    isInputVisible,
    onInputVisibilityButton,
  } = useContext(AxiosContext);


  const uniqueMediaMap = new Map();

  tweets.forEach((tweet) => {
    const hasMedia = tweet.video_url !== null || tweet.media_url !== null;

    if (hasMedia) {
      uniqueMediaMap.set(tweet.tweet_id, tweet);
    }
  });

  const mediaArray = Array.from(uniqueMediaMap.values()).sort(
    (a, b) => b.timestamp - a.timestamp
  );

    const [accountIndex, setAccountIndex] = useState(0);
  const accounts = ["NASA", "NatGeo", "ArchDaily", "RedBull", "HumansOfNY"];

  useEffect(() => {
    if (mediaArray.length !== 0) {
      return;
    } else {
      const intervalId = setInterval(() => {
        setAccountIndex((prev) => (prev + 1) % accounts.length);
      }, 3000);
      () => clearInterval(intervalId);
    }
  }, []);

  const accountRef = useRef(null);
  useEffect(() => {
    if (mediaArray.length !== 0) {
      return;
    } else {
      gsap.to(accountRef.current, {
        opacity: 1,
        duration: 1,
      });
      gsap.to(accountRef.current, {
        delay: 2.5,
        opacity: 0,
        duration: 0.5,
      });
    }
  }, [accountIndex]);

  return (
    <div className="App">
      <form className={isInputVisible ? "form" : "form-closed"} action="">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <button
            onClick={onInputVisibilityButton}
            style={{
              background: "transparent",
              border: "none",
              color: "#e8e8e8",
            }}
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
            disabled={!username ? true : false}
            style={
              isInputVisible
                ? {
                    background: "transparent",
                    border: "none",
                    position: "absolute",
                    right: 0,
                  }
                : { display: "none" }
            }
            onClick={getTweets}
          >
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </form>
      <div
        style={mediaArray.length === 0 ? { display: "" } : { display: "none" }}
        className="cta"
      >
        <div className="cta-text-container">
          <label>
            Ready to browse? Type a handle like (
            <span ref={accountRef}>@{accounts[accountIndex]}</span>) to see
            their videos and photos.
          </label>
        </div>
      </div>
      <Swiper
        modules={[Pagination, Thumbs]}
        slidesPerView={1}
        style={
          mediaArray?.length === 0
            ? { display: "none" }
            : { display: "block", minHeight: "100vh", minWidth: "100vw" }
        }
      >
        {mediaArray.map((tweet) => (
          <SwiperSlide key={tweet.tweet_id}>
            <CarouselCard tweet={tweet} />
            <div
              style={
                tweet.video_url !== null ? { display: "none" } : { display: "" }
              }
              className="image-swiper"
            >
              <Swiper
                direction="vertical"
                pagination={{ clickable: true }}
                modules={[Pagination, Thumbs]}
                slidesPerView={1}
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
                {tweet?.media_url?.map((image) => (
                  <SwiperSlide
                    style={
                      tweet.video_url === null
                        ? {
                            height:
                              tweet?.extended_entities?.media[0]?.sizes?.small
                                ?.h,
                          }
                        : { display: "none" }
                    }
                    key={image}
                  >
                    <img style={{ width: "100%" }} src={image} alt="" />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="text-container">
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
                  src={tweet.user.profile_pic_url}
                  alt=""
                />
                <div style={{width: "85%", marginBottom: 6}}>

                <label style={{width: "50%"}} htmlFor="">
                  {" "}
                  <strong>{tweet?.user?.username}</strong> {tweet?.text}
                </label>
                </div>
              </div>
              <small style={{ textAlign: "right" }}>
                {dayjs(tweet?.creation_date).fromNow()}
              </small>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default Carousel;
