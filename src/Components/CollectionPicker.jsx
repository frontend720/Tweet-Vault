import { useState } from "react";
import "./CollectionPicker.css";

export default function CollectionPicker({ currentCollection, collections = [], onConfirm, onDismiss }) {
  const [selected, setSelected] = useState(currentCollection ?? null);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");

  function confirmNewCollection() {
    const trimmed = newName.trim().toLowerCase();
    if (!trimmed) return;
    const existing = collections.find((c) => c.toLowerCase() === trimmed);
    setSelected(existing ?? trimmed);
    setShowNewInput(false);
    setNewName("");
  }

  function selectChip(name) {
    setSelected((prev) => (prev === name ? null : name));
    setShowNewInput(false);
  }

  return (
    <>
      <div className="collection-picker-backdrop" onClick={onDismiss} />
      <div className="collection-picker">
        <div className="collection-picker__handle" />
        <p className="collection-picker__title">Move to collection</p>

        <div className="collection-picker__row">
          <button
            className={`collection-picker__chip${selected === null ? " collection-picker__chip--active" : ""}`}
            onClick={() => { setSelected(null); setShowNewInput(false); }}
          >
            None
          </button>
          {collections.map((name) => (
            <button
              key={name}
              className={`collection-picker__chip${selected === name ? " collection-picker__chip--active" : ""}`}
              onClick={() => selectChip(name)}
            >
              {name}
            </button>
          ))}
          {showNewInput ? (
            <input
              className="collection-picker__input"
              placeholder="Collection name"
              value={newName}
              autoFocus
              maxLength={30}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmNewCollection();
                if (e.key === "Escape") { setShowNewInput(false); setNewName(""); }
              }}
              onBlur={confirmNewCollection}
            />
          ) : (
            <button
              className="collection-picker__new"
              onClick={() => { setShowNewInput(true); setSelected(null); }}
            >
              <i className="fa-solid fa-plus" /> New
            </button>
          )}
        </div>

        <div className="collection-picker__actions">
          <button className="collection-picker__btn collection-picker__btn--cancel" onClick={onDismiss}>
            Cancel
          </button>
          <button
            className="collection-picker__btn collection-picker__btn--save"
            onClick={() => onConfirm(selected)}
          >
            Move
          </button>
        </div>
      </div>
    </>
  );
}
