import { useRef, useEffect, useCallback } from "react";
import "./VideoScrubber.css";

/**
 * Custom video scrubber that drives position via direct DOM writes,
 * so React re-renders never snap the thumb back mid-drag.
 *
 * Props:
 *   currentTime  – current playback position in seconds (updated by parent)
 *   duration     – total video duration in seconds
 *   onSeek       – callback(timeInSeconds) called while dragging and on release
 */
export default function VideoScrubber({ currentTime, duration, onSeek }) {
  const trackRef = useRef(null);
  const fillRef  = useRef(null);
  const thumbRef = useRef(null);
  const isDragging  = useRef(false);
  // Keep latest prop values accessible inside event listeners without re-registering them
  const durationRef = useRef(duration);
  const onSeekRef   = useRef(onSeek);

  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { onSeekRef.current  = onSeek;    }, [onSeek]);

  // Write fill + thumb position directly to the DOM
  const applyPosition = useCallback((time) => {
    const dur = durationRef.current;
    if (!dur) return;
    const pct = Math.max(0, Math.min(time / dur, 1)) * 100;
    if (fillRef.current)  fillRef.current.style.width  = `${pct}%`;
    if (thumbRef.current) thumbRef.current.style.left  = `${pct}%`;
  }, []);

  // Sync from parent during playback (skip while user is dragging)
  useEffect(() => {
    if (!isDragging.current) applyPosition(currentTime);
  }, [currentTime, applyPosition]);

  // Compute time value from a mouse or touch event relative to the track
  const timeFromEvent = (e) => {
    const track = trackRef.current;
    if (!track || !durationRef.current) return 0;
    const rect    = track.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const ratio   = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
    return ratio * durationRef.current;
  };

  // Global move/end listeners so the drag works even outside the element
  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      if (e.cancelable) e.preventDefault();
      const t = timeFromEvent(e);
      applyPosition(t);
      onSeekRef.current?.(t);
    };

    const onEnd = () => {
      // Delay releasing drag lock so the parent's next timeupdate (which may
      // still carry the pre-seek time) doesn't snap the thumb back.
      setTimeout(() => { isDragging.current = false; }, 300);
    };

    document.addEventListener("mousemove",  onMove);
    document.addEventListener("mouseup",    onEnd);
    document.addEventListener("touchmove",  onMove, { passive: false });
    document.addEventListener("touchend",   onEnd);
    document.addEventListener("touchcancel",onEnd);

    return () => {
      document.removeEventListener("mousemove",  onMove);
      document.removeEventListener("mouseup",    onEnd);
      document.removeEventListener("touchmove",  onMove);
      document.removeEventListener("touchend",   onEnd);
      document.removeEventListener("touchcancel",onEnd);
    };
  }, [applyPosition]);

  const onStart = (e) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    isDragging.current = true;
    const t = timeFromEvent(e);
    applyPosition(t);
    onSeekRef.current?.(t);
  };

  return (
    <div
      ref={trackRef}
      className="scrubber-track"
      onMouseDown={onStart}
      onTouchStart={onStart}
    >
      <div ref={fillRef}  className="scrubber-fill"  />
      <div ref={thumbRef} className="scrubber-thumb" />
    </div>
  );
}
