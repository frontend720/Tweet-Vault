import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { TweetContext } from "../TweetContext";
import "./GalleryCard.css";

export default function GalleryCard({ image, onOpenLightbox, onDelete, lightboxOpen }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) setFlipped(false);
  }, [lightboxOpen]);
  const { retweetRequest, openProfileSheet } = useContext(TweetContext);
  const navigate = useNavigate();

  const hasUser = !!image.username;

  function handleFrontClick() {
    setFlipped(true);
  }

  function handleBackClick(e) {
    // Only flip back if the click landed on the back face itself, not a button
    if (e.target === e.currentTarget) setFlipped(false);
  }

  function handleLoadFeed(e) {
    e.stopPropagation();
    retweetRequest(image.username);
    navigate("/");
  }

  function handleProfile(e) {
    e.stopPropagation();
    openProfileSheet(image.user_id, image.username, image.imageUrl);
  }

  function handleFullSize(e) {
    e.stopPropagation();
    onOpenLightbox();
  }

  function handleDelete(e) {
    e.stopPropagation();
    onDelete();
  }

  return (
    <div className={`gc-scene${flipped ? " gc-scene--flipped" : ""}`}>
      <div className="gc-card">

        {/* ── Front ── */}
        <div className="gc-face gc-face--front" onClick={handleFrontClick}>
          <img src={image.imageUrl} alt="" className="gc-face__img" />
          {hasUser && (
            <div className="gc-face__label">@{image.username}</div>
          )}
        </div>

        {/* ── Back ── */}
        <div className="gc-face gc-face--back" onClick={handleBackClick}>
          <img src={image.imageUrl} alt="" className="gc-face__back-bg" />
          <div className="gc-face__back-veil" />

          <div className="gc-face__back-content">
            {hasUser && (
              <span className="gc-back__username">@{image.username}</span>
            )}

            <div className="gc-back__actions">
              <button className="gc-back__btn gc-back__btn--fullsize" onClick={handleFullSize}>
                <i className="fa-solid fa-expand" />
              </button>

              {hasUser && (
                <>
                  <button className="gc-back__btn gc-back__btn--feed" onClick={handleLoadFeed}>
                    <i className="fa-solid fa-photo-film" />
                    <span>Feed</span>
                  </button>
                  {image.user_id && (
                    <button className="gc-back__btn gc-back__btn--profile" onClick={handleProfile}>
                      <i className="fa-solid fa-users" />
                      <span>Profile</span>
                    </button>
                  )}
                </>
              )}

              <button className="gc-back__btn gc-back__btn--delete" onClick={handleDelete}>
                <i className="fa-solid fa-trash-can" />
              </button>
            </div>

            <button className="gc-back__flip-back" onClick={() => setFlipped(false)}>
              <i className="fa-solid fa-rotate-left" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
