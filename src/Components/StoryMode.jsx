import { useState, useRef, useEffect, useCallback } from "react";
import "./StoryMode.css";

const FUNCTIONS_BASE = new URL(import.meta.env.VITE_FUNCTION_URL).origin;

const POV_OPTIONS = [
  { id: "first", label: "Through my eyes", sub: "First person" },
  { id: "third-limited", label: "Close over the shoulder", sub: "Third person limited" },
  { id: "third-omni", label: "Watching from above", sub: "Third person omniscient" },
  { id: "second", label: "You are there", sub: "Second person" },
];

const MAX_TURNS = 18;
const NUDGE_AT = 13;

function progressKey(personaId) { return `tv_story_${personaId}`; }
function libraryKey(personaId) { return `tv_stories_${personaId}`; }

function loadProgress(personaId) {
  try { return JSON.parse(localStorage.getItem(progressKey(personaId))); } catch { return null; }
}
function saveProgress(personaId, data) {
  try { localStorage.setItem(progressKey(personaId), JSON.stringify(data)); } catch { /* quota */ }
}
function clearProgress(personaId) {
  localStorage.removeItem(progressKey(personaId));
}
function loadLibrary(personaId) {
  try { return JSON.parse(localStorage.getItem(libraryKey(personaId))) ?? []; } catch { return []; }
}
function saveToLibrary(personaId, story) {
  try {
    const lib = loadLibrary(personaId);
    lib.unshift(story); // newest first
    localStorage.setItem(libraryKey(personaId), JSON.stringify(lib.slice(0, 50)));
  } catch { /* quota */ }
}
function clearLibrary(personaId) {
  localStorage.removeItem(libraryKey(personaId));
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function storyPreview(turns) {
  const prose = turns[0]?.prose ?? "";
  return prose.slice(0, 100) + (prose.length > 100 ? "…" : "");
}

export default function StoryMode({ persona, username }) {
  // phases: pov | seeds | own | story | complete | library | reading
  const [phase, setPhase] = useState(() => {
    const saved = loadProgress(persona._id);
    return (saved?.turns?.length > 0) ? "story" : "pov";
  });
  const [pov, setPov] = useState(() => loadProgress(persona._id)?.pov ?? null);
  const [seeds, setSeeds] = useState(null);
  const [isFetchingSeeds, setIsFetchingSeeds] = useState(false);
  const [seedError, setSeedError] = useState(false);
  const [turns, setTurns] = useState(() => loadProgress(persona._id)?.turns ?? []);
  const [input, setInput] = useState("");
  const [ownOpener, setOwnOpener] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(false);
  const [library, setLibrary] = useState(() => loadLibrary(persona._id));
  const [readingStory, setReadingStory] = useState(null); // story object being read

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const ownRef = useRef(null);

  const proseCount = turns.length;
  const showNudge = proseCount >= NUDGE_AT && phase === "story";
  const atCap = proseCount >= MAX_TURNS;

  // Auto-save progress on every turn change
  useEffect(() => {
    if (turns.length > 0 && phase === "story") {
      saveProgress(persona._id, { pov, turns });
    }
  }, [turns, pov, phase, persona._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isGenerating, phase]);

  useEffect(() => {
    if (phase === "own") ownRef.current?.focus();
    if (phase === "story") inputRef.current?.focus();
  }, [phase]);

  async function fetchSeeds(selectedPov) {
    setIsFetchingSeeds(true);
    setSeedError(false);
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/generateStorySeeds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: persona.summary, username, pov: selectedPov }),
      });
      const data = await res.json();
      if (!res.ok || !data.seeds?.length) throw new Error();
      setSeeds(data.seeds);
    } catch {
      setSeedError(true);
      setSeeds([]);
    } finally {
      setIsFetchingSeeds(false);
    }
  }

  function selectPov(povId) {
    setPov(povId);
    setPhase("seeds");
    fetchSeeds(povId);
  }

  function selectSeed(seed) {
    const opening = [{ prose: seed.openingProse }];
    setTurns(opening);
    setPhase("story");
  }

  async function submitOwn() {
    const text = ownOpener.trim();
    if (!text || isGenerating) return;
    setIsGenerating(true);
    setGenError(false);
    setPhase("story");
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/advanceStory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: persona.summary, username, pov, turns: [], direction: text }),
      });
      const data = await res.json();
      if (!res.ok || !data.prose) throw new Error();
      setTurns([{ prose: data.prose }]);
    } catch {
      setGenError(true);
      setPhase("own");
    } finally {
      setIsGenerating(false);
    }
  }

  async function advance(isEnding = false) {
    const text = input.trim();
    if ((!text && !isEnding) || isGenerating) return;
    setInput("");
    setIsGenerating(true);
    setGenError(false);
    const snapshot = [...turns];
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/advanceStory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: persona.summary,
          username,
          pov,
          turns: snapshot,
          direction: text || undefined,
          isEnding,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.prose) throw new Error();
      const next = [...snapshot, { direction: text || null, prose: data.prose }];
      setTurns(next);
      if (isEnding) {
        const completed = { id: Date.now(), completedAt: Date.now(), pov, turns: next };
        saveToLibrary(persona._id, completed);
        setLibrary(loadLibrary(persona._id));
        clearProgress(persona._id);
        setPhase("complete");
      }
    } catch {
      setGenError(true);
    } finally {
      setIsGenerating(false);
      if (!isEnding) inputRef.current?.focus();
    }
  }

  const restart = useCallback(() => {
    clearProgress(persona._id);
    setPov(null);
    setSeeds(null);
    setTurns([]);
    setInput("");
    setOwnOpener("");
    setGenError(false);
    setSeedError(false);
    setPhase("pov");
  }, [persona._id]);

  function handleClearLibrary() {
    clearLibrary(persona._id);
    setLibrary([]);
  }

  // ── Library view ────────────────────────────────────────────────
  if (phase === "library") {
    return (
      <div className="story-library">
        <div className="story-library__header">
          <button className="story-library__back" onClick={() => setPhase("pov")}>
            <i className="fa-solid fa-arrow-left" />
          </button>
          <span className="story-library__title">Saved Stories</span>
          {library.length > 0 && (
            <button className="story-library__clear" onClick={handleClearLibrary}>
              Reset
            </button>
          )}
        </div>
        {library.length === 0 ? (
          <p className="story-library__empty">No completed stories yet.</p>
        ) : (
          <div className="story-library__list">
            {library.map((story) => (
              <button
                key={story.id}
                className="story-library__item"
                onClick={() => { setReadingStory(story); setPhase("reading"); }}
              >
                <span className="story-library__preview">{storyPreview(story.turns)}</span>
                <span className="story-library__meta">{formatDate(story.completedAt)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Reading a saved story ────────────────────────────────────────
  if (phase === "reading" && readingStory) {
    const fullProse = readingStory.turns.map((t) => t.prose).join("\n\n");
    return (
      <div className="story-complete">
        <div className="story-complete__scroll">
          <p className="story-complete__prose">{fullProse}</p>
          <div ref={bottomRef} />
        </div>
        <div className="story-complete__footer">
          <button className="story-complete__restart" onClick={() => { setReadingStory(null); setPhase("library"); }}>
            <i className="fa-solid fa-arrow-left" /> Back to Library
          </button>
        </div>
      </div>
    );
  }

  // ── POV selection ────────────────────────────────────────────────
  if (phase === "pov") {
    return (
      <div className="story-pov">
        {turns.length > 0 && (
          <div className="story-pov__resume">
            <span>You have a story in progress.</span>
            <div className="story-pov__resume-actions">
              <button className="story-pov__resume-btn" onClick={() => setPhase("story")}>Resume</button>
              <button className="story-pov__discard-btn" onClick={restart}>Discard</button>
            </div>
          </div>
        )}
        <p className="story-pov__prompt">How should the story be told?</p>
        <div className="story-pov__grid">
          {POV_OPTIONS.map((opt) => (
            <button key={opt.id} className="story-pov__card" onClick={() => selectPov(opt.id)}>
              <span className="story-pov__label">{opt.label}</span>
              <span className="story-pov__sub">{opt.sub}</span>
            </button>
          ))}
        </div>
        {library.length > 0 && (
          <button className="story-pov__library-btn" onClick={() => setPhase("library")}>
            <i className="fa-solid fa-book-open" /> Saved Stories ({library.length})
          </button>
        )}
      </div>
    );
  }

  // ── Seed loading / selection ─────────────────────────────────────
  if (phase === "seeds") {
    if (isFetchingSeeds) {
      return (
        <div className="story-loading">
          <i className="fa-solid fa-circle-notch fa-spin" />
          <span>Finding the story…</span>
        </div>
      );
    }
    return (
      <div className="story-seeds">
        <p className="story-seeds__prompt">
          {seedError ? "Couldn't generate seeds." : "Pick a story to tell"}
        </p>
        {!seedError && (
          <div className="story-seeds__cards">
            {seeds?.map((seed, i) => (
              <button key={i} className="story-seed-card" onClick={() => selectSeed(seed)}>
                <span className="story-seed-card__title">{seed.title}</span>
                <span className="story-seed-card__hook">{seed.hook}</span>
              </button>
            ))}
          </div>
        )}
        <div className="story-seeds__footer">
          {seedError && (
            <button
              className="story-seeds__retry"
              onClick={() => { setSeedError(false); setSeeds(null); fetchSeeds(pov); }}
            >
              Try again
            </button>
          )}
          <button className="story-seeds__own" onClick={() => setPhase("own")}>
            Write your own opening
          </button>
        </div>
      </div>
    );
  }

  // ── Write your own opener ────────────────────────────────────────
  if (phase === "own") {
    return (
      <div className="story-own">
        <p className="story-own__prompt">Describe your opening scene</p>
        <textarea
          ref={ownRef}
          className="story-own__input"
          value={ownOpener}
          onChange={(e) => setOwnOpener(e.target.value)}
          placeholder="A detective walks into the bar she swore she'd never enter again…"
          rows={5}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitOwn();
          }}
        />
        {genError && <p className="story-own__error">Something went wrong. Try again.</p>}
        <div className="story-own__actions">
          <button className="story-own__back" onClick={() => setPhase("seeds")}>
            <i className="fa-solid fa-arrow-left" /> Back
          </button>
          <button
            className="story-own__submit"
            onClick={submitOwn}
            disabled={!ownOpener.trim() || isGenerating}
          >
            {isGenerating ? <i className="fa-solid fa-circle-notch fa-spin" /> : "Begin"}
          </button>
        </div>
      </div>
    );
  }

  // ── Completed story (prose-only view) ───────────────────────────
  if (phase === "complete") {
    const fullProse = turns.map((t) => t.prose).join("\n\n");
    return (
      <div className="story-complete">
        <div className="story-complete__scroll">
          <p className="story-complete__prose">{fullProse}</p>
          <div ref={bottomRef} />
        </div>
        <div className="story-complete__footer">
          <button className="story-complete__library" onClick={() => setPhase("library")}>
            <i className="fa-solid fa-book-open" /> Library
          </button>
          <button className="story-complete__restart" onClick={restart}>
            <i className="fa-solid fa-rotate-left" /> New Story
          </button>
        </div>
      </div>
    );
  }

  // ── Active story ─────────────────────────────────────────────────
  return (
    <div className="story">
      <div className="story-canvas">
        {turns.map((turn, i) => (
          <div key={i}>
            {turn.direction && (
              <p className="story-direction">{turn.direction}</p>
            )}
            <p className="story-prose">{turn.prose}</p>
          </div>
        ))}
        {isGenerating && (
          <div className="story-generating">
            <span /><span /><span />
          </div>
        )}
        {genError && (
          <p className="story-error">Something went wrong. Try again.</p>
        )}
        {showNudge && !isGenerating && (
          <div className="story-nudge">
            <span>Getting close to the end.</span>
            <button onClick={() => advance(true)}>Write the ending</button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!atCap ? (
        <form
          className="story-form"
          onSubmit={(e) => { e.preventDefault(); advance(false); }}
        >
          <textarea
            ref={inputRef}
            className="story-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Direct the story…"
            rows={2}
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                advance(false);
              }
            }}
          />
          <div className="story-form-row">
            <button
              type="button"
              className="story-end-btn"
              onClick={() => advance(true)}
              disabled={isGenerating}
            >
              Write the ending
            </button>
            <button
              type="submit"
              className="story-send"
              disabled={!input.trim() || isGenerating}
            >
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </form>
      ) : (
        <div className="story-cap">
          <button
            className="story-cap__end"
            onClick={() => advance(true)}
            disabled={isGenerating}
          >
            {isGenerating
              ? <i className="fa-solid fa-circle-notch fa-spin" />
              : "Write the ending"}
          </button>
        </div>
      )}
    </div>
  );
}
