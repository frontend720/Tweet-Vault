import { useState, useEffect, useRef } from "react";
import "./HeartButton.css";

export default function HeartButton({ isLiked, onSave, onDelete, style, className }) {
  const [animating, setAnimating] = useState(false);
  const prevLiked = useRef(isLiked);

  // Trigger pop when transitioning from not-liked → liked
  useEffect(() => {
    if (!prevLiked.current && isLiked) setAnimating(true);
    prevLiked.current = isLiked;
  }, [isLiked]);

  const handleClick = (e) => {
    if (isLiked) {
      onDelete?.(e);
    } else {
      if (navigator.vibrate) navigator.vibrate([10, 50, 20]);
      onSave?.(e);
    }
  };

  return (
    <i
      className={[
        isLiked ? "fa-solid" : "fa-regular",
        "fa-heart",
        "heart-btn",
        animating && "heart-btn--pop",
        className,
      ].filter(Boolean).join(" ")}
      style={{ cursor: isLiked ? "default" : "pointer", ...style }}
      onClick={handleClick}
      onAnimationEnd={() => setAnimating(false)}
    />
  );
}
