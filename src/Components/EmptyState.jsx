import { useNavigate } from "react-router-dom";
import "./EmptyState.css";

export default function EmptyState({ icon, title, body }) {
  const navigate = useNavigate();

  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <i className={icon} />
      </div>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__body">{body}</p>
      <button className="empty-state__cta" onClick={() => navigate("/")}>
        Browse the feed
      </button>
    </div>
  );
}
