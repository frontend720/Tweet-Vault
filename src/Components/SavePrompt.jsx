import { useState } from "react";
import "./SavePrompt.css";

const TAGS = ["Reference", "Inspiration", "Follow-up", "Watch Later"];
const STORAGE_KEY = "tv_recent_tags";
const MAX_RECENT = 3;

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

export default function SavePrompt({ onConfirm, onDismiss }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [note, setNote] = useState("");
  const [recentCombos] = useState(() => loadRecent());

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function applyCombo(combo) {
    setSelectedTags(combo);
  }

  function handleConfirm() {
    persistRecent(selectedTags);
    onConfirm(selectedTags, note.trim());
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
