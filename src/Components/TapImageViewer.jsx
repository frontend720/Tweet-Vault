import { useState } from "react";
import HeartButton from "./HeartButton";
import "./TapImageViewer.css";

export default function TapImageViewer({ images, savedImages, onSave, tweet }) {
  const [idx, setIdx] = useState(0);

  if (!images?.length) return null;

  const image = images[idx];
  const isLiked = savedImages.some((s) => s.imageUrl === image);
  const total = images.length;

  function handleTap(e) {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    if (x > width / 2) {
      setIdx((prev) => Math.min(prev + 1, total - 1));
    } else {
      setIdx((prev) => Math.max(prev - 1, 0));
    }
  }

  return (
    <div className="tiv" onClick={handleTap}>
      <img className="tiv__img" src={image} alt="" />

      {total > 1 && (
        <div className="tiv__dots">
          {images.map((_, i) => (
            <span key={i} className={`tiv__dot${i === idx ? " tiv__dot--active" : ""}`} />
          ))}
        </div>
      )}

      {total > 1 && idx < total - 1 && (
        <div className="tiv__hint tiv__hint--right">
          <i className="fa-solid fa-chevron-right" />
        </div>
      )}
      {total > 1 && idx > 0 && (
        <div className="tiv__hint tiv__hint--left">
          <i className="fa-solid fa-chevron-left" />
        </div>
      )}

      <button
        className="save-image-button"
        disabled={isLiked}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        style={{ cursor: isLiked ? "not-allowed" : "pointer" }}
      >
        <HeartButton
          isLiked={isLiked}
          onSave={() => onSave(image, tweet.tweet_id, tweet?.user?.username, tweet?.user?.user_id)}
        />
      </button>
    </div>
  );
}
