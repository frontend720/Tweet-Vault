import { useState } from "react";
import "./SavePrompt.css";

const TAGS = ["Reference", "Inspiration", "Follow-up", "Watch Later"];
const STORAGE_KEY = "tv_recent_tags";
const LAST_COLLECTION_KEY = "tv_last_collection";
const MAX_RECENT = 3;
const DEFAULT_COLLECTION = "Saved";

function loadLastCollection() {
  try { return localStorage.getItem(LAST_COLLECTION_KEY) ?? DEFAULT_COLLECTION; }
  catch { return DEFAULT_COLLECTION; }
}

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function persistRecent(tags) {
  if (tags.length === 0) return;
  const key = [...tags].sort().join(",");
  const filtered = loadRecent().filter(
    (combo) => [...combo].sort().join(",") !== key,
  );
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([tags, ...filtered].slice(0, MAX_RECENT)),
  );
}

export default function SavePrompt({ onConfirm, onDismiss, collections = [] }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [note, setNote] = useState("");
  const [recentCombos] = useState(() => loadRecent());

  const [collectionName, setCollectionName] = useState(() => loadLastCollection());
  const [showNewInput, setShowNewInput] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function applyCombo(combo) {
    setSelectedTags(combo);
  }

  function selectCollection(name) {
    setCollectionName((prev) => (prev === name ? null : name));
    setShowNewInput(false);
  }

  function confirmNewCollection() {
    const trimmed = newCollectionName.trim().toLowerCase();
    if (!trimmed) return;
    const existing = collections.find((c) => c.toLowerCase() === trimmed);
    setCollectionName(existing ?? trimmed);
    setShowNewInput(false);
    setNewCollectionName("");
  }

  function handleConfirm() {
    persistRecent(selectedTags);
    if (collectionName) {
      try { localStorage.setItem(LAST_COLLECTION_KEY, collectionName); } catch {}
    }
    onConfirm(selectedTags, note.trim(), collectionName);
  }

  return (
    <>
      <div className="save-prompt-backdrop" onClick={onDismiss} />
      <div className="save-prompt">
        <div className="save-prompt__handle" />
        <p className="save-prompt__title">Why are you saving this?</p>

        {recentCombos.length > 0 && (
          <div className="save-prompt__recent">
            <span className="save-prompt__recent-label">Recent</span>
            <div className="save-prompt__recent-combos">
              {recentCombos.map((combo) => {
                const key = combo.join("+");
                const isActive =
                  combo.length === selectedTags.length &&
                  combo.every((t) => selectedTags.includes(t));
                return (
                  <button
                    key={key}
                    className={`save-prompt__recent-combo${isActive ? " save-prompt__recent-combo--active" : ""}`}
                    onClick={() => applyCombo(combo)}
                  >
                    {combo.join(" · ")}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="save-prompt__tags">
          {TAGS.map((tag) => (
            <button
              key={tag}
              className={`save-prompt__tag${selectedTags.includes(tag) ? " save-prompt__tag--active" : ""}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="save-prompt__collection">
          <span className="save-prompt__recent-label">Collection</span>
          <div className="save-prompt__collection-row">
            {!collections.includes(DEFAULT_COLLECTION) && (
              <button
                className={`save-prompt__collection-chip${collectionName === DEFAULT_COLLECTION ? " save-prompt__collection-chip--active" : ""}`}
                onClick={() => selectCollection(DEFAULT_COLLECTION)}
              >
                {DEFAULT_COLLECTION}
              </button>
            )}
            {collections.map((name) => (
              <button
                key={name}
                className={`save-prompt__collection-chip${collectionName === name ? " save-prompt__collection-chip--active" : ""}`}
                onClick={() => selectCollection(name)}
              >
                {name}
              </button>
            ))}
            {showNewInput ? (
              <input
                className="save-prompt__collection-input"
                placeholder="Collection name"
                value={newCollectionName}
                autoFocus
                maxLength={30}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmNewCollection();
                  if (e.key === "Escape") {
                    setShowNewInput(false);
                    setNewCollectionName("");
                  }
                }}
                onBlur={confirmNewCollection}
              />
            ) : (
              <button
                className="save-prompt__collection-new"
                onClick={() => {
                  setShowNewInput(true);
                  setCollectionName(null);
                }}
              >
                <i className="fa-solid fa-plus" /> New
              </button>
            )}
          </div>
        </div>

        <input
          className="save-prompt__note"
          placeholder="Add a note… (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
        />
        <div className="save-prompt__actions">
          <button className="save-prompt__btn save-prompt__btn--cancel" onClick={onDismiss}>
            Cancel
          </button>
          <button
            className="save-prompt__btn save-prompt__btn--save"
            onClick={handleConfirm}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
