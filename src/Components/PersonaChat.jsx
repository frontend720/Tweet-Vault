import { useState, useRef, useEffect, useContext } from "react";
import { useLocation, useParams, useNavigate, useSearchParams } from "react-router";
import ReactMarkdown from "react-markdown";
import { io } from "socket.io-client";
import { auth } from "../config";
import { TweetContext } from "../TweetContext";
import { FirebaseContext } from "../FirebaseContext";
import { AuthContext } from "../AuthContext";
import StoryMode from "./StoryMode";
import "./PersonaChat.css";

const FUNCTIONS_BASE = new URL(import.meta.env.VITE_FUNCTION_URL).origin;
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

function formatTime(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" }) + ` ${time}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` ${time}`;
}

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = objectUrl;
  });
}

export default function PersonaChat() {
  const { username } = useParams();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { retweetRequest } = useContext(TweetContext);
  const { sortedImages } = useContext(FirebaseContext);
  const { authenticatedUser } = useContext(AuthContext);

  const [persona, setPersona] = useState(state?.persona ?? null);
  const [personaLoading, setPersonaLoading] = useState(!state?.persona);

  // Fetch persona from Express server when navigated via push notification (no router state).
  useEffect(() => {
    if (persona) { setPersonaLoading(false); return; }
    const pid = searchParams.get("pid");
    if (!pid || !authenticatedUser) { setPersonaLoading(false); return; }
    auth.getIdToken()
      .then(({ data }) => fetch(`${SERVER_URL}/api/personas/${pid}`, {
        headers: { Authorization: `Bearer ${data?.token}` },
      }))
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setPersona(data); })
      .catch(console.error)
      .finally(() => setPersonaLoading(false));
  }, [persona, searchParams, authenticatedUser]);

  function goToFeed() {
    retweetRequest(username);
    navigate("/");
  }

  const [mode, setMode] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [attachedImage, setAttachedImage] = useState(null);
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const [scenarios, setScenarios] = useState(null);
  const [isFetchingScenarios, setIsFetchingScenarios] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  // Socket.io connection — replaces Firebase RTDB onValue listener
  useEffect(() => {
    if (!persona?._id) return;

    let socket;
    auth.getIdToken().then(({ data }) => {
      socket = io(SERVER_URL, { auth: { token: data?.token } });
      socketRef.current = socket;

      socket.on("connect_error", (err) => console.error("[socket] connect error:", err.message));
      socket.on("connect", () => socket.emit("join_chat", persona._id));

      socket.on("chat_history", (history) => setMessages(history));
      // new_message is only used for real-time sync to other open tabs/sessions.
      // All state for this session is managed directly via setMessages — no handler needed here.
      socket.on("chat_cleared", () => setMessages([]));
    });

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [persona?._id]);

  useEffect(() => {
    if (mode !== "play" || scenarios !== null || isFetchingScenarios) return;
    setIsFetchingScenarios(true);
    fetch(`${FUNCTIONS_BASE}/generateScenarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: persona.summary,
        username,
        model: localStorage.getItem("tv_persona_model") ?? undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => setScenarios(data.scenarios ?? []))
      .catch(() => setScenarios([]))
      .finally(() => setIsFetchingScenarios(false));
  }, [mode, scenarios, isFetchingScenarios, persona, username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (personaLoading) {
    return (
      <div className="pchat pchat--error">
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 24, color: "var(--text-secondary)" }} />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="pchat pchat--error">
        <p>Persona not found.</p>
        <button onClick={() => navigate("/settings")}>Back to Settings</button>
      </div>
    );
  }

  function clearChat() {
    if (socketRef.current?.connected) {
      socketRef.current.emit("clear_chat", persona._id);
    } else {
      setMessages([]);
    }
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    setAttachedImage(dataUrl);
    setShowAttachPanel(false);
    e.target.value = "";
  }

  function handleUrlAttach() {
    const url = urlInput.trim();
    if (!url) return;
    setAttachedImage(url);
    setUrlInput("");
    setShowAttachPanel(false);
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !attachedImage) || isLoading) return;

    setInput("");
    if (inputRef.current) { inputRef.current.style.height = "auto"; }
    const imageUrl = attachedImage;
    setAttachedImage(null);
    setShowAttachPanel(false);
    setIsLoading(true);

    const userMsg = { role: "user", content: text, ...(imageUrl && { imageUrl }), timestamp: Date.now() };

    // Always show immediately; emit via socket for persistence only
    setMessages((prev) => [...prev, userMsg]);
    socketRef.current?.emit("send_message", { personaId: persona._id, ...userMsg });

    const history = [...messages, userMsg];

    try {
      const res = await fetch(`${FUNCTIONS_BASE}/chatWithPersona`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: persona.summary,
          username,
          messages: history,
          model: localStorage.getItem("tv_persona_model") ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      if (data.message) {
        const aiMsg = { role: "assistant", content: data.message, timestamp: Date.now() };
        setMessages((prev) => [...prev, aiMsg]);
        socketRef.current?.emit("send_message", { personaId: persona._id, ...aiMsg });
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg = { role: "assistant", content: err.message ?? "Something went wrong. Try again.", timestamp: Date.now() };
      setMessages((prev) => [...prev, errMsg]);
      socketRef.current?.emit("send_message", { personaId: persona._id, ...errMsg });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  async function selectScenario(scenario) {
    clearChat();
    await new Promise((r) => setTimeout(r, 100));
    const openerMsg = { role: "assistant", content: scenario.opener, timestamp: Date.now() };
    setMessages([openerMsg]);
    socketRef.current?.emit("send_message", { personaId: persona._id, ...openerMsg });
    setMode("chat");
  }

  function feelingLucky() {
    if (!scenarios?.length) return;
    selectScenario(scenarios[Math.floor(Math.random() * scenarios.length)]);
  }

  function retryScenarios() {
    setScenarios(null);
  }

  return (
    <div className="pchat">
      <div className="pchat-header">
        <button className="pchat-back" onClick={() => navigate("/settings")}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        {(persona.avatarUrl ?? persona.twitterAvatarUrl)
          ? <img className="pchat-header__avatar pchat-header__avatar--tap" src={persona.avatarUrl ?? persona.twitterAvatarUrl} alt="" onClick={goToFeed} />
          : <div className="pchat-header__avatar pchat-header__avatar--default pchat-header__avatar--tap" onClick={goToFeed}><i className="fa-solid fa-user" /></div>
        }
        <div className="pchat-header__info">
          <span className="pchat-header__username">{persona.displayName ?? `@${username}`}</span>
          <span className="pchat-header__label">
            {persona.displayName ? `@${username} · ` : ""}AI Persona · {persona.tweetCount} tweets
          </span>
        </div>
        {mode === "chat" && messages.length > 0 && (
          <button className="pchat-clear" onClick={clearChat} title="Clear conversation">
            <i className="fa-solid fa-trash" />
          </button>
        )}
      </div>

      <div className="pchat-tabs">
        <button
          className={`pchat-tab${mode === "chat" ? " pchat-tab--active" : ""}`}
          onClick={() => setMode("chat")}
        >
          Chat
        </button>
        <button
          className={`pchat-tab${mode === "play" ? " pchat-tab--active" : ""}`}
          onClick={() => setMode("play")}
        >
          Play
        </button>
        <button
          className={`pchat-tab${mode === "story" ? " pchat-tab--active" : ""}`}
          onClick={() => setMode("story")}
        >
          Story
        </button>
      </div>

      {mode === "chat" ? (
        <>
          <div className="pchat-messages" onClick={() => setShowAttachPanel(false)}>
            {messages.length === 0 && (
              <p className="pchat-empty">
                Start a conversation with @{username}&apos;s persona
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`pchat-bubble pchat-bubble--${msg.role === "user" ? "user" : "ai"}`}
              >
                {msg.imageUrl && (
                  <img className="pchat-bubble__image" src={msg.imageUrl} alt="" />
                )}
                {msg.content && (
                  msg.role === "user"
                    ? <span>{msg.content}</span>
                    : <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
                {msg.timestamp && (
                  <span className="pchat-bubble__time">{formatTime(msg.timestamp)}</span>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="pchat-bubble pchat-bubble--ai pchat-bubble--loading">
                <span /><span /><span />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form ref={formRef} className="pchat-form" onSubmit={sendMessage}>
            {showAttachPanel && (
              <div className="pchat-attach-panel">
                <div className="pchat-attach-panel__url-row">
                  <input
                    className="pchat-attach-url-input"
                    placeholder="Paste image URL…"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlAttach())}
                  />
                  <button
                    type="button"
                    className="pchat-attach-url-go"
                    onClick={handleUrlAttach}
                    disabled={!urlInput.trim()}
                  >
                    <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
                <button
                  type="button"
                  className="pchat-attach-panel__file-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="fa-solid fa-image" /> Upload image
                </button>
                {sortedImages.length > 0 && (
                  <button
                    type="button"
                    className="pchat-attach-panel__file-btn"
                    onClick={() => { setShowGalleryPicker(true); setShowAttachPanel(false); }}
                  >
                    <i className="fa-solid fa-photo-film" /> From Gallery
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
              </div>
            )}

            {attachedImage && (
              <div className="pchat-attach-preview">
                <img src={attachedImage} alt="attachment preview" />
                <button
                  type="button"
                  className="pchat-attach-preview__remove"
                  onClick={() => setAttachedImage(null)}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            )}

            <div className="pchat-form-row">
              <button
                type="button"
                className={`pchat-attach-btn${showAttachPanel ? " pchat-attach-btn--active" : ""}`}
                onClick={() => setShowAttachPanel((p) => !p)}
                title="Attach image"
              >
                <i className="fa-solid fa-paperclip" />
              </button>
              <textarea
                ref={inputRef}
                className="pchat-input"
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    formRef.current?.requestSubmit();
                  }
                }}
                placeholder={attachedImage ? "Add a message…" : `Message @${username}…`}
                autoComplete="off"
              />
              <button
                className="pchat-send"
                type="submit"
                disabled={(!input.trim() && !attachedImage) || isLoading}
              >
                <i className="fa-solid fa-paper-plane" />
              </button>
            </div>
          </form>
        </>
      ) : mode === "play" ? (
        <div className="pchat-play">
          {isFetchingScenarios ? (
            <div className="pchat-play__loading">
              <i className="fa-solid fa-circle-notch fa-spin" />
              <span>Dreaming up scenarios…</span>
            </div>
          ) : scenarios?.length ? (
            <>
              <p className="pchat-play__hint">
                Pick a scenario — the persona will open the scene. You take it from there.
              </p>
              <div className="pchat-play__cards">
                {scenarios.map((s, i) => (
                  <button
                    key={i}
                    className="pchat-scenario-card"
                    onClick={() => selectScenario(s)}
                  >
                    <span className="pchat-scenario-card__title">{s.title}</span>
                    <span className="pchat-scenario-card__desc">{s.description}</span>
                  </button>
                ))}
              </div>
              <button className="pchat-play__lucky" onClick={feelingLucky}>
                <i className="fa-solid fa-dice" /> Feeling Lucky
              </button>
            </>
          ) : (
            <div className="pchat-play__error">
              <p>Couldn&apos;t generate scenarios.</p>
              <button onClick={retryScenarios}>Try again</button>
            </div>
          )}
        </div>
      ) : (
        <StoryMode persona={persona} username={username} />
      )}

      {showGalleryPicker && (
        <div className="pchat-gallery-overlay" onClick={() => setShowGalleryPicker(false)}>
          <div className="pchat-gallery-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="pchat-gallery-sheet__handle" />
            <div className="pchat-gallery-sheet__header">
              <span className="pchat-gallery-sheet__title">Your Gallery</span>
              <button className="pchat-gallery-sheet__close" onClick={() => setShowGalleryPicker(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="pchat-gallery-grid">
              {sortedImages.slice(0, 60).map((img) => (
                <button
                  key={img._id}
                  className="pchat-gallery-item"
                  onClick={() => {
                    setAttachedImage(img.imageUrl);
                    setShowGalleryPicker(false);
                  }}
                >
                  <img src={img.imageUrl} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
