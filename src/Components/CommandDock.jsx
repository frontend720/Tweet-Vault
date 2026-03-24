import { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import "./CommandDock.css";

const NAV_ITEMS = [
  { path: "/", icon: "fa-brands fa-x-twitter", label: "Posts" },
  { path: "/bookmarks", icon: "fa-solid fa-vault", label: "Vault" },
  { path: "/gallery", icon: "fa-solid fa-photo-film", label: "Gallery" },
];

export default function CommandDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  const [isDark, setIsDark] = useState(
    () => (localStorage.getItem("theme") ?? "dark") === "dark"
  );

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [isDark]);

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
        <button
          className="dock-item"
          onClick={() => setIsDark((d) => !d)}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <i className={isDark ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i>
          <span className="dock-label">{isDark ? "Light" : "Dark"}</span>
        </button>
        <button
          className="dock-item dock-item--logout"
          onClick={logout}
          aria-label="Logout"
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span className="dock-label">Logout</span>
        </button>
      </div>
    </nav>
  );
}
