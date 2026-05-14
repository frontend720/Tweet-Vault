import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "./AuthContext";
import { TweetContext } from "./TweetContext";
import { FirebaseContext } from "./FirebaseContext";
import { isModelAllowed, modelTier, modelLabel, MODEL_CATEGORY, CATEGORY_META } from "./veniceModels";
import "./Settings.css";

function ToggleSwitch({ on, onToggle }) {
  return (
    <button
      className={`settings-toggle${on ? " settings-toggle--on" : ""}`}
      onClick={onToggle}
      role="switch"
      aria-checked={on}
    />
  );
}

function compressDataUrl(dataUrl, max = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > max || height > max) {
        if (width > height) { height = Math.round(height * max / width); width = max; }
        else { width = Math.round(width * max / height); height = max; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = dataUrl;
  });
}

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 256;
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

function PersonaEditSheet({ persona, onSave, onClose }) {
  const [name, setName] = useState(persona.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(persona.avatarUrl ?? persona.twitterAvatarUrl ?? "");
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);

  const fileRef = useRef(null);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    setAvatarUrl(dataUrl);
    setAiResult(null);
    e.target.value = "";
  }

  function handleUrlApply() {
    const url = urlInput.trim();
    if (url) { setAvatarUrl(url); setAiResult(null); }
    setUrlInput("");
    setShowUrlInput(false);
  }

  async function generateVariant() {
    if (!avatarUrl || !aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setAiResult(null);
    setAiError(null);

    // Convert URL→compressed base64 JPEG client-side
    let imageToSend = avatarUrl;
    if (!avatarUrl.startsWith("data:")) {
      try {
        const resp = await fetch(avatarUrl);
        if (!resp.ok) throw new Error(`${resp.status}`);
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        imageToSend = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const MIN = 256, MAX = 1024;
            let { width, height } = img;
            // Upscale if below Venice's 65536-pixel minimum (256×256)
            if (width < MIN || height < MIN) {
              if (width > height) { height = Math.round(height * MIN / width); width = MIN; }
              else { width = Math.round(width * MIN / height); height = MIN; }
            }
            // Downscale if above max
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
          img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("decode failed")); };
          img.crossOrigin = "anonymous";
          img.src = objectUrl;
        });
      } catch {
        setAiError("Could not load avatar image. Try uploading a custom photo first.");
        setIsGenerating(false);
        return;
      }
    }

    try {
      const res = await fetch(`${FUNCTIONS_BASE}/editPersonaAvatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageToSend, prompt: aiPrompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Generation failed");
      const r = data.result;
      let url = null;
      if (typeof r === "string") {
        url = (r.startsWith("http") || r.startsWith("data:")) ? r : `data:image/jpeg;base64,${r}`;
      } else if (r?.images?.[0]?.url) {
        url = r.images[0].url;
      } else if (r?.images?.[0]?.b64_json) {
        url = `data:image/jpeg;base64,${r.images[0].b64_json}`;
      } else if (r?.data?.[0]?.url) {
        url = r.data[0].url;
      } else if (r?.data?.[0]?.b64_json) {
        url = `data:image/jpeg;base64,${r.data[0].b64_json}`;
      }
      if (!url) throw new Error("Unexpected response format");
      setAiResult(url);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function acceptVariant() {
    const compressed = await compressDataUrl(aiResult);
    setAvatarUrl(compressed);
    setAiResult(null);
    setAiPrompt("");
    setShowAiPanel(false);
  }

  async function handleSave() {
    setIsSaving(true);
    await onSave({
      displayName: name.trim() || null,
      avatarUrl: avatarUrl || null,
    });
    onClose();
  }

  return (
    <div className="persona-edit-overlay" onClick={onClose}>
      <div className="persona-edit-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="persona-edit-sheet__handle" />

        <div className="persona-edit-avatar-row">
          <div
            className="persona-edit-avatar"
            onClick={() => fileRef.current?.click()}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="" />
              : <i className="fa-solid fa-user" />
            }
            <span className="persona-edit-avatar__label">
              <i className="fa-solid fa-camera" />
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <div className="persona-edit-avatar-btns">
            <button
              className="persona-edit-url-toggle"
              onClick={() => setShowUrlInput((v) => !v)}
            >
              {showUrlInput ? "Cancel" : "Use URL"}
            </button>
            {avatarUrl && (
              <button
                className={`persona-edit-ai-toggle${showAiPanel ? " persona-edit-ai-toggle--active" : ""}`}
                onClick={() => { setShowAiPanel((v) => !v); setAiResult(null); setAiError(null); }}
              >
                <i className="fa-solid fa-wand-magic-sparkles" /> AI edit
              </button>
            )}
          </div>
        </div>

        {showUrlInput && (
          <div className="persona-edit-url-row">
            <input
              className="persona-edit-url-input"
              placeholder="Paste image URL…"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlApply()}
            />
            <button
              className="persona-edit-url-go"
              onClick={handleUrlApply}
              disabled={!urlInput.trim()}
            >
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        )}

        {showAiPanel && (
          <div className="persona-edit-ai-panel">
            <p className="persona-edit-ai-hint">
              Describe changes to the avatar — expression, clothing, background, style…
            </p>
            <div className="persona-edit-ai-row">
              <input
                className="persona-edit-ai-input"
                placeholder="e.g. smiling, wearing a hoodie, city background"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateVariant()}
              />
              <button
                className="persona-edit-ai-go"
                onClick={generateVariant}
                disabled={!aiPrompt.trim() || isGenerating}
              >
                {isGenerating
                  ? <i className="fa-solid fa-circle-notch fa-spin" />
                  : <i className="fa-solid fa-arrow-right" />
                }
              </button>
            </div>

            {aiError && (
              <p className="persona-edit-ai-error">{aiError}</p>
            )}

            {aiResult && (
              <div className="persona-edit-ai-result">
                <img src={aiResult} alt="AI variant" />
                <div className="persona-edit-ai-result-actions">
                  <button className="persona-edit-ai-accept" onClick={acceptVariant}>
                    <i className="fa-solid fa-check" /> Use this
                  </button>
                  <button className="persona-edit-ai-discard" onClick={() => setAiResult(null)}>
                    <i className="fa-solid fa-xmark" /> Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="persona-edit-field">
          <label className="persona-edit-label">Display name</label>
          <input
            className="persona-edit-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`@${persona.username}`}
            maxLength={50}
          />
        </div>

        <p className="persona-edit-hint">
          Based on @{persona.username} · {persona.tweetCount} tweets
        </p>

        <button
          className="persona-edit-save"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <i className="fa-solid fa-circle-notch fa-spin" /> : "Save"}
        </button>
      </div>
    </div>
  );
}

const FUNCTIONS_BASE = new URL(import.meta.env.VITE_FUNCTION_URL).origin;
const DEFAULT_MODEL = "venice-uncensored-1-2";

export default function Settings() {
  const { logout, authenticatedUser } = useContext(AuthContext);
  const { personaModeEnabled, setPersonaModeEnabled } = useContext(TweetContext);
  const { personas, deletePersona, updatePersona, notificationSettings, updateNotificationSettings } = useContext(FirebaseContext);
  const navigate = useNavigate();

  const [isUpdatingNotif, setIsUpdatingNotif] = useState(false);
  const [testNotifState, setTestNotifState] = useState("idle"); // idle | sending | sent | error
  const notifPermission = typeof Notification !== "undefined" ? Notification.permission : "default";

  async function handleNotifToggle() {
    setIsUpdatingNotif(true);
    await updateNotificationSettings(!notificationSettings.enabled, notificationSettings.frequency);
    setIsUpdatingNotif(false);
  }

  async function sendTestNotification() {
    if (!notificationSettings.fcmToken) return;
    setTestNotifState("sending");
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/testChatNotification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fcmToken: notificationSettings.fcmToken, email: authenticatedUser }),
      });
      if (!res.ok) throw new Error("Request failed");
      setTestNotifState("sent");
      setTimeout(() => setTestNotifState("idle"), 4000);
    } catch {
      setTestNotifState("error");
      setTimeout(() => setTestNotifState("idle"), 4000);
    }
  }

  async function handleFrequencyChange(freq) {
    if (!notificationSettings.enabled) return;
    setIsUpdatingNotif(true);
    await updateNotificationSettings(true, freq);
    setIsUpdatingNotif(false);
  }

  const [isDark, setIsDark] = useState(
    () => (localStorage.getItem("theme") ?? "dark") === "dark",
  );
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem("tv_persona_model") ?? DEFAULT_MODEL,
  );
  const [editingPersona, setEditingPersona] = useState(null);

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [isDark]);

  useEffect(() => {
    fetch(`${FUNCTIONS_BASE}/listModels`)
      .then((r) => r.json())
      .then((data) => {
        const textModels = (data.data ?? []).filter(
          (m) => m.type === "text" && isModelAllowed(m.id),
        );
        if (textModels.length > 0) setModels(textModels);
      })
      .catch(() => {});
  }, []);

  const sortedPersonas = [...personas].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="settings">
      <h1 className="settings-title">Settings</h1>

      <section className="settings-section">
        <h2 className="settings-section-title">Appearance</h2>
        <div className="settings-row">
          <span className="settings-label">Dark mode</span>
          <ToggleSwitch on={isDark} onToggle={() => setIsDark((d) => !d)} />
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">AI Personas</h2>
        <div className="settings-row">
          <div className="settings-row__text">
            <span className="settings-label">Persona mode</span>
            <p className="settings-description">
              Collects text tweets as you browse to build AI personas you can chat with
            </p>
          </div>
          <ToggleSwitch
            on={personaModeEnabled}
            onToggle={() => setPersonaModeEnabled((p) => !p)}
          />
        </div>

        {models.length > 0 && (() => {
          const grouped = models.reduce((acc, m) => {
            const cat = MODEL_CATEGORY[m.id] ?? "other";
            (acc[cat] ??= []).push(m);
            return acc;
          }, {});
          const sortedCats = Object.entries(CATEGORY_META)
            .filter(([key]) => grouped[key]?.length)
            .sort(([, a], [, b]) => a.order - b.order);
          return (
            <div className="settings-row settings-row--col">
              <div className="settings-row settings-row--inner">
                <span className="settings-label">Model</span>
                <select
                  className="settings-select"
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    localStorage.setItem("tv_persona_model", e.target.value);
                  }}
                >
                  {sortedCats.map(([key, meta]) => (
                    <optgroup key={key} label={meta.label}>
                      {grouped[key].map((m) => (
                        <option key={m.id} value={m.id}>{modelLabel(m.id)}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              {modelTier(selectedModel) && (
                <p className={`settings-model-cost settings-model-cost--${modelTier(selectedModel).length}`}>
                  {modelTier(selectedModel) === "$" && "Budget-friendly · low cost per build"}
                  {modelTier(selectedModel) === "$$" && "Moderate cost · good balance"}
                  {modelTier(selectedModel) === "$$$" && "Higher cost per build — use sparingly"}
                </p>
              )}
            </div>
          );
        })()}

        {sortedPersonas.length > 0 && (
          <div className="settings-personas">
            {sortedPersonas.map((p) => (
              <div key={p._id} className="settings-persona-row">
                <div className="settings-persona-row__avatar">
                  {(p.avatarUrl ?? p.twitterAvatarUrl)
                    ? <img src={p.avatarUrl ?? p.twitterAvatarUrl} alt="" />
                    : <i className="fa-solid fa-user" />
                  }
                </div>
                <div className="settings-persona-row__info">
                  <span className="settings-persona-row__username">
                    {p.displayName ?? `@${p.username}`}
                  </span>
                  <span className="settings-persona-row__meta">
                    {p.displayName ? `@${p.username} · ` : ""}{p.tweetCount} tweets
                  </span>
                </div>
                <div className="settings-persona-row__actions">
                  <button
                    className="settings-persona-btn settings-persona-btn--edit"
                    onClick={() => setEditingPersona(p)}
                  >
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button
                    className="settings-persona-btn settings-persona-btn--chat"
                    onClick={() => navigate(`/chat/${p.username}`, { state: { persona: p } })}
                  >
                    <i className="fa-solid fa-comment" />
                  </button>
                  <button
                    className="settings-persona-btn settings-persona-btn--delete"
                    onClick={() => deletePersona(p._id)}
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedPersonas.length === 0 && personaModeEnabled && (
          <p className="settings-empty">
            Browse a profile feed to start collecting tweets. A build button will appear once enough are gathered.
          </p>
        )}
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Chat Notifications</h2>
        <div className="settings-row">
          <div className="settings-row__text">
            <span className="settings-label">Re-engagement pings</span>
            <p className="settings-description">
              Your persona will send you an in-character message to continue a stale chat
            </p>
          </div>
          <ToggleSwitch
            on={notificationSettings.enabled}
            onToggle={handleNotifToggle}
          />
        </div>

        {notifPermission === "denied" && (
          <p className="settings-notif-blocked">
            <i className="fa-solid fa-triangle-exclamation" /> Notifications are blocked in your browser. Enable them in site settings to use this feature.
          </p>
        )}

        {notificationSettings.enabled && notifPermission !== "denied" && (
          <div className="settings-row settings-row--col">
            <div className="settings-row settings-row--inner">
              <span className="settings-label">Frequency</span>
              <div className="settings-freq-pills">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    className={`settings-freq-pill${notificationSettings.frequency === n ? " settings-freq-pill--active" : ""}`}
                    onClick={() => handleFrequencyChange(n)}
                    disabled={isUpdatingNotif}
                  >
                    {n}×
                  </button>
                ))}
              </div>
            </div>
            <p className="settings-description" style={{ padding: "0 2px" }}>
              {notificationSettings.frequency === 1 && "Up to once a day per active chat"}
              {notificationSettings.frequency === 2 && "Up to twice a day per active chat"}
              {notificationSettings.frequency === 3 && "Up to three times a day per active chat"}
            </p>
            {notificationSettings.fcmToken && (
              <button
                className={`settings-notif-test${testNotifState === "sent" ? " settings-notif-test--sent" : testNotifState === "error" ? " settings-notif-test--error" : ""}`}
                onClick={sendTestNotification}
                disabled={testNotifState === "sending"}
              >
                {testNotifState === "sending" && <><i className="fa-solid fa-circle-notch fa-spin" /> Sending…</>}
                {testNotifState === "sent" && <><i className="fa-solid fa-check" /> Notification sent</>}
                {testNotifState === "error" && <><i className="fa-solid fa-xmark" /> Failed — check console</>}
                {testNotifState === "idle" && <><i className="fa-solid fa-bell" /> Send a test notification</>}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="settings-section settings-section--account">
        <button className="settings-logout" onClick={logout}>
          <i className="fa-solid fa-arrow-right-from-bracket" />
          Sign out
        </button>
      </section>

      {editingPersona && (
        <PersonaEditSheet
          persona={editingPersona}
          onSave={(updates) => updatePersona(editingPersona._id, updates)}
          onClose={() => setEditingPersona(null)}
        />
      )}
    </div>
  );
}
