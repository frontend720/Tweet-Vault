import { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { TweetContext } from "../TweetContext";
import gsap from "gsap";
import "./Menu.css";
import { AuthContext } from "../AuthContext";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const { onMenuToggle, menuToggle } = useContext(TweetContext);
  const { logout } = useContext(AuthContext);
  const [selectedTab, setSelectedTab] = useState(null);
  const navVisibilityRef = useRef(null);
  const menuRef = useRef(null);

  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reducedMotion()) {
      gsap.set(navVisibilityRef.current, { opacity: 1 });
      return;
    }
    gsap.to(navVisibilityRef.current, {
      opacity: 1,
      duration: 0.75,
    });
  }, []);

  useEffect(() => {
    if (reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.to(".nav-item .nav-item-spacing", {
        duration: 1,
        x: 0,
        ease: "power2.inOut",
        overwrite: true,
      });
      if (selectedTab) {
        gsap.to(".nav-item-selected .nav-item-spacing", {
          duration: 0.5,
          x: 50,
          ease: "power2.inOut",
          delay: 0.1,
          overwrite: true,
        });
      }
      gsap.to(".nav-item-selected .icon", {
        duration: 0.75,
        rotation: 360,
        overwrite: true,
      });
      gsap.to(".nav-item .icon", {
        duration: 0.75,
        rotation: -360,
        overwrite: true,
      });
    }, navVisibilityRef);

    return () => ctx.revert();
  }, [selectedTab]);

  useEffect(() => {
    if (reducedMotion()) {
      gsap.set(".item-visibility-stagger", { opacity: 1 });
      return;
    }
    gsap.to(".item-visibility-stagger", {
      opacity: 1,
      duration: 1,
      stagger: 0.33,
      delay: 0.5,
    });
  }, [selectedTab]);

  useEffect(() => {
    if (menuToggle === false) {
      gsap.to(menuRef.current, { duration: reducedMotion() ? 0 : 1, opacity: 0 });
    }
  }, [menuToggle]);

  function menuAnimation() {
    if (reducedMotion()) {
      onMenuToggle();
      return;
    }
    gsap.to(menuRef.current, {
      opacity: 0,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        onMenuToggle();
      },
    });
  }

  const navigation = useNavigate();
  function handleDestination(destination = null) {
    if (reducedMotion()) {
      onMenuToggle();
      if (destination) navigation(destination);
      return;
    }
    gsap.to(".nav-list-item", {
      duration: 0.5,
      opacity: 0,
      stagger: 0.16,
      onComplete: () => {
        onMenuToggle();
        if (destination) {
          navigation(destination);
        }
      },
    });
  }

  return (
    <div ref={menuRef} className="Menu">
      <nav className="nav-wrapper">
        <div ref={navVisibilityRef} className="inner-nav">
          <div className="close-button" onClick={menuAnimation}>
            <i
              style={{ marginTop: "7%" }}
              className="fa-solid fa-xmark"
            ></i>
          </div>
          <Link to="/">
            <div
              onClick={() => {
                setSelectedTab("home");
                handleDestination("/");
              }}
              className={`item-visibility-stagger ${selectedTab === "home" ? "nav-item-selected" : "nav-item"}`}
            >
              <label className="nav-list-item">
                <i className="icon fa-brands fa-x-twitter"></i>
                <span className="nav-item-spacing">Posts</span>
              </label>
            </div>
          </Link>
          <Link to="/bookmarks">
            <div
              onClick={() => {
                setSelectedTab("bookmarks");
                handleDestination("/bookmarks");
              }}
              className={`item-visibility-stagger ${selectedTab === "bookmarks" ? "nav-item-selected" : "nav-item"}`}
            >
              <label className="nav-list-item">
                <i className="icon fa-solid fa-vault"></i>
                <span className="nav-item-spacing">Vault</span>
              </label>
            </div>
          </Link>
          <Link to="/gallery">
            <div
              onClick={() => {
                setSelectedTab("gallery");
                handleDestination("/gallery");
              }}
              className={`item-visibility-stagger ${selectedTab === "gallery" ? "nav-item-selected" : "nav-item"}`}
            >
              <i className="icon fa-solid fa-photo-film"></i>
              <span className="nav-item-spacing">Photos</span>
            </div>
          </Link>
          <div
            onClick={() => setSelectedTab("account")}
            className={`item-visibility-stagger ${selectedTab === "account" ? "nav-item-selected" : "nav-item"}`}
          >
            <label className="nav-list-item">
              <i className="icon fa-solid fa-user-astronaut"></i>
              <span className="nav-item-spacing">Account</span>
            </label>
          </div>
          <div
            onClick={() => {
              handleDestination();
              logout();
            }}
          >
            <label htmlFor="" className="nav-list-item nav-item">
              Logout
            </label>
          </div>
        </div>
      </nav>
    </div>
  );
}
