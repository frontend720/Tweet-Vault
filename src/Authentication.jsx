import { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "./AuthContext";
import gsap from "gsap";
import "./Authentication.css";
import image from "./assets/tweetvault.png";

export default function Authentication() {
  const { createUser, returningUser, signInWithGoogle, authenticatedUser, error } =
    useContext(AuthContext);

  const [authentication, setAuthentication] = useState({ email: "", password: "" });

  function handleChange(e) {
    const { name, value } = e.target;
    setAuthentication((prev) => ({ ...prev, [name]: value }));
  }

  const [authenticationToggle, setAuthenticationToggle] = useState(
    authenticatedUser !== null
  );
  const formRef = useRef(null);

  function onAuthenticationToggleChange() {
    setAuthenticationToggle((prev) => !prev);
  }

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  function onPasswordVisibilityChange() {
    setIsPasswordVisible((prev) => !prev);
  }

  // GSAP Entrance Animation
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(formRef.current, { opacity: 1, y: 0 });
      return;
    }
    gsap.to(formRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      delay: 0.2,
    });
  }, []);

  const imageRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(imageRef.current, { opacity: 1 });
      return;
    }
    gsap.to(imageRef.current, {
      duration: 1.5,
      opacity: 1,
      delay: 0.3,
    });
  }, []);

  return (
    <div className="auth-container">
      {/* We use ref here for GSAP */}
      <form ref={formRef} className="authentication-form">
        <h1 style={{ marginTop: 0 }} className="app-name">
          TweetVault
        </h1>
        <img
          ref={imageRef}
          className="app-image"
          src={image}
          width="100%"
          alt=""
        />

        <input
          className="auth-input"
          type="email"
          name="email"
          value={authentication.email}
          onChange={handleChange}
          placeholder="Email"
          autoComplete="true"
        />

        <input
          className="auth-input"
          type={
            isPasswordVisible ? "text" : "password"
          } /* Changed to password type for security */
          name="password"
          value={authentication.password}
          onChange={handleChange}
          placeholder="Password"
          style={{ marginBottom: 0 }}
          autoComplete="true"
          onKeyDown={(e) => {
            if(e.key === "Enter"){
              e.preventDefault();
            if (authenticationToggle) {
              returningUser(authentication.email, authentication.password);
            } else {
              createUser(authentication.email, authentication.password);
            }
            }
          }}
        />
        <label
          onClick={onPasswordVisibilityChange}
          style={{
            textAlign: "right",
            marginRight: 12,
            marginTop: -15,
            marginBottom: 20,
            color: "#e8e8e8"
          }}
          htmlFor=""
        >
          {isPasswordVisible ? "Hide Password" : "Show Password"}
        </label>
        <label htmlFor="">{error}</label>
        <button
          disabled={!authentication.email || !authentication.password}
          className="auth-btn"
          onClick={(e) => {
            e.preventDefault();
            if (authenticationToggle) {
              returningUser(authentication.email, authentication.password);
            } else {
              createUser(authentication.email, authentication.password);
            }
          }}
        >
          {authenticationToggle ? "Login" : "Create Account"}
        </button>

        <button className="google-btn" onClick={signInWithGoogle}>
          <i className="fa-brands fa-google" style={{ marginRight: "8px" }}></i>
          Continue with Google
        </button>

        <label className="toggle-label" onClick={onAuthenticationToggleChange}>
          {authenticationToggle
            ? "Don't have an account? Sign up"
            : "Already have an account? Log in"}
        </label>
      </form>
    </div>
  );
}
