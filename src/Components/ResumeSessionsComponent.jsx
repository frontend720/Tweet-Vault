import { useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./ResumeSessionsComponent.css";

dayjs.extend(relativeTime);

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function ResumeSessionsComponent({ sessions, onResume }) {
  const sorted = useMemo(
    () => [...sessions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8),
    [sessions],
  );

  if (sorted.length === 0) return null;

  return (
    <div className="resume-sessions">
      <span className="resume-sessions__label">Sessions</span>
      <div className="resume-sessions__scroll">
        {sorted.map((item) => {
          const ageMs = Date.now() - item.timestamp;
          const expired = ageMs > STALE_THRESHOLD_MS;
          return (
            <button
              key={item.tweetId}
              className={`resume-session-card${expired ? " resume-session-card--stale" : ""}`}
              onClick={() => onResume(item.browseUsername, item.resumeToken)}
            >
              {item.poster && (
                <img
                  src={item.poster}
                  alt=""
                  className="resume-session-card__poster"
                />
              )}
              <div className="resume-session-card__overlay">
                <span className="resume-session-card__username">
                  @{item.browseUsername}
                </span>
                <span className={`resume-session-card__age${expired ? " resume-session-card__age--stale" : ""}`}>
                  {expired ? "⚠ " : ""}{dayjs(item.timestamp).fromNow()}
                </span>
              </div>
              <div className="resume-session-card__icon">
                <i className="fa-solid fa-arrow-right" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
