import { useNavigate, useLocation } from "react-router-dom";
import "./CommandDock.css";

const NAV_ITEMS = [
  { path: "/", icon: "fa-brands fa-x-twitter", label: "Posts" },
  { path: "/bookmarks", icon: "fa-solid fa-vault", label: "Vault" },
  { path: "/gallery", icon: "fa-solid fa-photo-film", label: "Gallery" },
  { path: "/settings", icon: "fa-solid fa-sliders", label: "Settings" },
];

export default function CommandDock() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith("/chat/")) return null;

  return (
    <nav className="command-dock">
      <div className="dock-inner">
        {NAV_ITEMS.map(({ path, icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              className={`dock-item ${isActive ? "dock-item--active" : ""}`}
              onClick={() => navigate(path)}
              aria-label={label}
            >
              <i className={icon}></i>
              <span className="dock-label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
