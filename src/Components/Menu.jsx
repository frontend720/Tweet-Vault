import { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { AxiosContext } from "../AxiosContext";
import gsap from "gsap";
import "./Menu.css";
import { FirebaseContext } from "../FirebaseContext";
import { useNavigate } from "react-router-dom";

export default function App() {
  const { onMenuToggle, menuToggle } = useContext(AxiosContext);
  const { logout } = useContext(FirebaseContext);
  const [selectedTab, setSelectedTab] = useState(null);
  const navVisibilityRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    gsap.to(navVisibilityRef.current, {
      opacity: 1,
      duration: 0.75,
    });
  }, []);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".nav-item .nav-item-spacing", {
        duration: 1,
        x: 0,
        ease: "power2.inOut",
        overwrite: true
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
    gsap.to("#item-visibility-stagger", {
      opacity: 1,
      duration: 1,
      stagger: 0.33,
      delay: 0.5,
    });
  }, [selectedTab]);

  function menuAnimation() {
    gsap.to(menuRef.current, {
      opacity: 0,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        onMenuToggle();
      },
    });
  }

  const menuRef = useRef(null);

  useEffect(() => {
    if (menuToggle === false) {
      gsap.to(menuRef.current, {
        duration: 1,
        opacity: 0,
      });
    }
    if (menuToggle === true) {
      return;
    }
  }, [menuToggle]);

  const navigation = useNavigate();
  function handleDestination(destination = null) {
    gsap.to(".nav-list-item", {
      duration: 0.50,
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
            <i id="icon" className="fa-solid fa-xmark"></i>
          </div>
          <Link to="/">
            <div
              onClick={() => {
                setSelectedTab("home");
                handleDestination("/");
              }}
              className={
                selectedTab === "home" ? "nav-item-selected" : "nav-item"
              }
              id="item-visibility-stagger"
            >
              <label className="nav-list-item">
                <i
                  id="icon"
                  ref={iconRef}
                  className="icon fa-brands fa-x-twitter"
                ></i>
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
              className={
                selectedTab === "bookmarks" ? "nav-item-selected" : "nav-item"
              }
              id="item-visibility-stagger"
            >
              <label className="nav-list-item">
                <i
                  id="icon"
                  ref={iconRef}
                  className="icon fa-solid fa-vault"
                ></i>
                <span className="nav-item-spacing">Vault</span>
              </label>
            </div>
          </Link>
          <div
            onClick={() => setSelectedTab("account")}
            className={
              selectedTab === "account" ? "nav-item-selected" : "nav-item"
            }
            id="item-visibility-stagger"
          >
            <label className="nav-list-item">
              <i
                id="icon"
                ref={iconRef}
                className="icon fa-solid fa-user-astronaut"
              ></i>
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
