require("dotenv").config();
const path = require("path");
const express = require("express");
const https = require("https");
const http = require("http");
const { Server: IOServer } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");
const { admin, requireAuth } = require("./auth");

const app = express();

const fs = require("fs");
const CERT_DIR = process.env.CERT_DIR || path.join(__dirname, "..");
const certPath = path.join(CERT_DIR, "apple-server.tail8168ce.ts.net.crt");
const keyPath  = path.join(CERT_DIR, "apple-server.tail8168ce.ts.net.key");
const useTLS   = fs.existsSync(certPath) && fs.existsSync(keyPath);

const httpServer = useTLS
  ? https.createServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
  : http.createServer(app);

const io = new IOServer(httpServer, { cors: { origin: "*" } });

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
  res.set("Access-Control-Expose-Headers", "Accept-Ranges, Content-Range, Content-Length");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.set("Access-Control-Max-Age", "86400");
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "20mb" })); // large limit for base64 images

// ─── Constants ────────────────────────────────────────────────────────────────

const VENICE_BASE = "https://api.venice.ai/api/v1";
const HF_MODEL = "Minthy/ToriiGate-v0.4-7B";
const HF_BASE = `https://api-inference.huggingface.co/models/${HF_MODEL}/v1`;

const VL_MODELS = new Set(["qwen3-vl-235b-a22b", "e2ee-qwen3-vl-30b-a3b-p"]);
const DEFAULT_VL = "qwen3-vl-235b-a22b";

const POV_INSTRUCTIONS = {
  first: "Write in first person (narrator uses 'I', 'me', 'my'). The narrator is the persona experiencing events directly.",
  "third-limited": "Write in third person limited. Follow one character closely — their thoughts and feelings only, not others'.",
  "third-omni": "Write in third person omniscient. The narrator has access to any character's inner world.",
  second: "Write in second person (use 'you' for the protagonist). The reader inhabits the story.",
};

const POV_LABELS = {
  first: "first person",
  "third-limited": "third person limited",
  "third-omni": "third person omniscient",
  second: "second person",
};

// ─── AI Helpers ───────────────────────────────────────────────────────────────

async function veniceChat(messages, model = "venice-uncensored-1-2", temperature = 0.7) {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) throw new Error("VENICE_API_KEY is not set");
  const res = await fetch(`${VENICE_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature }),
  });
  const text = await res.text();
  console.log("Venice status:", res.status, "body:", text.slice(0, 200));
  if (!res.ok) {
    const err = new Error(`Venice ${res.status}: ${text.slice(0, 200)}`);
    err.veniceStatus = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  return data.choices?.[0]?.message?.content ?? null;
}

async function toriiGateChat(messages, temperature = 0.85) {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) throw new Error("HF_API_KEY is not set");
  const res = await fetch(`${HF_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: HF_MODEL, messages, temperature, max_tokens: 1024 }),
  });
  const text = await res.text();
  console.log("ToriiGate status:", res.status, "body:", text.slice(0, 200));
  if (!res.ok) {
    const err = new Error(`ToriiGate ${res.status}: ${text.slice(0, 200)}`);
    err.hfStatus = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  return data.choices?.[0]?.message?.content ?? null;
}

function nowString() {
  return new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
}

function buildVisionMessages(messages) {
  return messages.map((m) => {
    if (!m.imageUrl) return { role: m.role, content: m.content };
    return {
      role: m.role,
      content: [
        ...(m.content ? [{ type: "text", text: m.content }] : []),
        { type: "image_url", image_url: { url: m.imageUrl } },
      ],
    };
  });
}

// ─── AI Routes ────────────────────────────────────────────────────────────────

app.post("/buildPersona", async (req, res) => {
  const { tweets, username, model } = req.body;
  if (!tweets?.length || !username) {
    return res.status(400).json({ error: "Missing tweets or username" });
  }

  const tweetList = tweets.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const userPrompt = `Analyze these ${tweets.length} original tweets from @${username} and write a detailed persona document.\n\nTWEETS:\n${tweetList}\n\nReturn exactly these sections:\nWRITING STYLE: sentence structure, punctuation habits, capitalization, average length\nRECURRING THEMES: topics they return to most\nTONE: emotional register, humor style, aggression level, warmth\nSIGNATURE PHRASES: specific words, expressions, or constructions they use\nWORLDVIEW: apparent values, opinions, and perspective\nROLEPLAY INSTRUCTIONS: specific guidance for embodying this person in chat — reference their actual patterns, do not break character`;

  try {
    const summary = await veniceChat([
      { role: "system", content: "You are an expert at analyzing writing styles and producing detailed persona documents for AI roleplay." },
      { role: "user", content: userPrompt },
    ], model, 0.5);
    if (!summary) throw new Error("Empty response");
    res.json({ summary });
  } catch (err) {
    console.error("buildPersona error:", err);
    const status = err.veniceStatus === 429 ? 503 : 500;
    const message = err.veniceStatus === 429 ? "Model is overloaded — try again in a moment." : "Failed to build persona.";
    res.status(status).json({ error: message });
  }
});

app.post("/chatWithPersona", async (req, res) => {
  const { summary, username, messages, model } = req.body;
  if (!summary || !messages?.length) {
    return res.status(400).json({ error: "Missing summary or messages" });
  }

  const hasImages = messages.some((m) => m.imageUrl);
  let effectiveModel = model ?? "venice-uncensored-1-2";
  if (hasImages && !VL_MODELS.has(effectiveModel)) effectiveModel = DEFAULT_VL;

  const systemPrompt = `The current date and time is ${nowString()}.\n\nYou are roleplaying as @${username} based on analysis of their actual tweets. Stay in character at all times. Use their documented writing style, phrases, and worldview. Never break character or acknowledge you are an AI.\n\n${summary}`;

  try {
    const reply = await veniceChat([
      { role: "system", content: systemPrompt },
      ...buildVisionMessages(messages),
    ], effectiveModel, 0.85);
    if (!reply) throw new Error("Empty response");
    res.json({ message: reply });
  } catch (err) {
    console.error("chatWithPersona error:", err);
    const status = err.veniceStatus === 429 ? 503 : 500;
    const message = err.veniceStatus === 429 ? "Model is overloaded — try again in a moment." : "Failed to get response.";
    res.status(status).json({ error: message });
  }
});

app.post("/chatWithToriiGate", async (req, res) => {
  const { summary, username, messages } = req.body;
  if (!summary || !messages?.length) {
    return res.status(400).json({ error: "Missing summary or messages" });
  }

  const systemPrompt = `The current date and time is ${nowString()}.\n\nYou are roleplaying as @${username} based on analysis of their actual tweets. Stay in character at all times. Use their documented writing style, phrases, and worldview. Never break character or acknowledge you are an AI.\n\n${summary}`;

  try {
    const reply = await toriiGateChat([
      { role: "system", content: systemPrompt },
      ...buildVisionMessages(messages),
    ]);
    if (!reply) throw new Error("Empty response");
    res.json({ message: reply });
  } catch (err) {
    console.error("chatWithToriiGate error:", err);
    const status = err.hfStatus === 503 ? 503 : 500;
    const message = err.hfStatus === 503 ? "Model is loading — wait a moment and try again." : "Failed to get response.";
    res.status(status).json({ error: message });
  }
});

app.post("/generateScenarios", async (req, res) => {
  const { summary, username, model } = req.body;
  if (!summary || !username) {
    return res.status(400).json({ error: "Missing summary or username" });
  }

  const prompt = `Based on your personality, interests, and opinions, suggest exactly 3 fun roleplay scenarios a user could do with you. Make them specific to who you actually are — not generic.

Respond ONLY with valid JSON, no extra text:
{"scenarios":[{"title":"short title (max 5 words)","description":"one sentence describing the scenario","opener":"your opening line to kick off the scenario, written in your voice as if you're starting it"},{"title":"...","description":"...","opener":"..."},{"title":"...","description":"...","opener":"..."}]}`;

  try {
    const reply = await veniceChat([
      { role: "system", content: `You are @${username}. ${summary}` },
      { role: "user", content: prompt },
    ], model, 0.92);
    if (!reply) throw new Error("Empty response");
    const match = reply.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.scenarios)) throw new Error("Invalid shape");
    res.json({ scenarios: parsed.scenarios });
  } catch (err) {
    console.error("generateScenarios error:", err);
    const status = err.veniceStatus === 429 ? 503 : 500;
    const message = err.veniceStatus === 429 ? "Model is overloaded — try again in a moment." : "Failed to generate scenarios.";
    res.status(status).json({ error: message });
  }
});

app.get("/listModels", async (_req, res) => {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "VENICE_API_KEY is not set" });
  try {
    const r = await fetch(`${VENICE_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("listModels error:", err);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

app.post("/editPersonaAvatar", async (req, res) => {
  const { image, prompt, model = "firered-image-edit" } = req.body;
  if (!image || !prompt) return res.status(400).json({ error: "image and prompt are required" });

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "VENICE_API_KEY is not set" });

  const base64Image = image.startsWith("data:") ? image.split(",")[1] : image;

  try {
    const r = await fetch(`${VENICE_BASE}/image/edit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image, prompt, model }),
    });
    const contentType = r.headers.get("content-type") ?? "";
    console.log("editPersonaAvatar status:", r.status, "content-type:", contentType);

    if (!r.ok) {
      const text = await r.text();
      let errMsg = "Image edit failed";
      try { errMsg = JSON.parse(text)?.error ?? errMsg; } catch { /* ignore */ }
      return res.status(r.status).json({ error: errMsg, detail: text.slice(0, 500) });
    }

    if (contentType.includes("image/")) {
      const buffer = await r.arrayBuffer();
      const b64 = Buffer.from(buffer).toString("base64");
      const mime = contentType.split(";")[0].trim();
      return res.json({ result: `data:${mime};base64,${b64}` });
    }

    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    res.json({ result: parsed });
  } catch (err) {
    console.error("editPersonaAvatar error:", err);
    res.status(500).json({ error: "Failed to edit image" });
  }
});

app.post("/generateStorySeeds", async (req, res) => {
  const { summary, username, pov } = req.body;
  if (!summary || !username || !pov) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const prompt = `Generate exactly 3 story opening seeds for a short collaborative story written in the voice of @${username}, told in ${POV_LABELS[pov] || "third person"}.

Each seed must feel specific to who this persona actually is — their obsessions, tensions, contradictions, worldview. Not generic genre pitches.

Each seed needs:
- title: 3–5 evocative words
- hook: one sentence capturing the core dramatic tension
- openingProse: the opening 2–3 paragraphs of the story in this persona's voice and the specified POV. Establish atmosphere immediately. End on a moment that demands continuation.

Return valid JSON only, no extra text:
{"seeds":[{"title":"...","hook":"...","openingProse":"..."},{"title":"...","hook":"...","openingProse":"..."},{"title":"...","hook":"...","openingProse":"..."}]}`;

  try {
    const reply = await veniceChat([
      { role: "system", content: `You are a skilled literary author writing in the voice and worldview of @${username}. ${summary}` },
      { role: "user", content: prompt },
    ], "venice-uncensored-1-2", 0.92);
    const match = reply?.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.seeds)) throw new Error("Invalid shape");
    res.json({ seeds: parsed.seeds });
  } catch (err) {
    console.error("generateStorySeeds error:", err);
    const status = err.veniceStatus === 429 ? 503 : 500;
    res.status(status).json({ error: "Failed to generate story seeds" });
  }
});

app.post("/advanceStory", async (req, res) => {
  const { summary, username, pov, turns = [], direction, isEnding = false } = req.body;
  if (!summary || !username || !pov) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const baseSystem = `You are writing a short literary story in the distinctive voice and worldview of @${username}.

${summary}

${POV_INSTRUCTIONS[pov] || ""}

Write 2–4 paragraphs per turn. Render prose only — no headers, no chapter numbers, no meta-commentary, no acknowledgment of the user's direction. Maintain consistent voice, tense, and POV throughout. Build tension across turns; don't resolve threads prematurely.`;

  const endingAddendum = `\n\nThis is the FINAL turn. Resolve all open story threads. Deliver a payoff that feels earned and complete. Close with intention — no "The End", no epilogue label, no meta-commentary.`;
  const systemPrompt = isEnding ? baseSystem + endingAddendum : baseSystem;

  const messages = [];
  if (turns.length > 0) {
    messages.push({ role: "assistant", content: turns[0].prose });
    for (let i = 1; i < turns.length; i++) {
      if (turns[i].direction) messages.push({ role: "user", content: turns[i].direction });
      messages.push({ role: "assistant", content: turns[i].prose });
    }
  }
  messages.push({ role: "user", content: direction || (isEnding ? "Write the ending." : "Continue the story.") });

  try {
    const prose = await veniceChat(
      [{ role: "system", content: systemPrompt }, ...messages],
      "venice-uncensored-1-2",
      0.88,
    );
    if (!prose) throw new Error("Empty response");
    res.json({ prose });
  } catch (err) {
    console.error("advanceStory error:", err);
    const status = err.veniceStatus === 429 ? 503 : 500;
    res.status(status).json({ error: "Failed to advance story" });
  }
});

// ─── Video / Image Proxy ──────────────────────────────────────────────────────

const HOP_BY_HOP = new Set([
  "connection", "keep-alive", "transfer-encoding", "te",
  "trailer", "upgrade", "proxy-authenticate", "proxy-authorization",
]);

const MAX_REDIRECTS = 5;

function fetchWithRedirects(url, requestHeaders, redirectCount, res) {
  if (redirectCount > MAX_REDIRECTS) return res.status(502).send("Too many redirects");

  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).send("Invalid URL"); }

  const transport = parsed.protocol === "https:" ? https : http;
  const req = transport.get(
    { hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers: requestHeaders },
    (upstream) => {
      const status = upstream.statusCode;
      if ([301, 302, 307, 308].includes(status) && upstream.headers.location) {
        upstream.resume();
        const next = upstream.headers.location.startsWith("http")
          ? upstream.headers.location
          : new URL(upstream.headers.location, url).href;
        fetchWithRedirects(next, requestHeaders, redirectCount + 1, res);
        return;
      }
      const responseHeaders = { "access-control-allow-origin": "*", "accept-ranges": "bytes" };
      for (const [key, value] of Object.entries(upstream.headers)) {
        if (!HOP_BY_HOP.has(key.toLowerCase())) responseHeaders[key] = value;
      }
      res.writeHead(status, responseHeaders);
      upstream.pipe(res);
    },
  );
  req.on("error", (err) => {
    console.error("Upstream error:", err.message);
    if (!res.headersSent) res.status(502).send("Upstream error");
  });
}

app.get("/proxy", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("No URL");
  const requestHeaders = {};
  if (req.headers.range) requestHeaders["Range"] = req.headers.range;
  fetchWithRedirects(url, requestHeaders, 0, res);
});

// ─── Bookmarks ────────────────────────────────────────────────────────────────

app.get("/api/bookmarks", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM bookmarks WHERE user_id = ? ORDER BY timestamp DESC").all(req.uid);
  res.json(rows.map(deserializeBookmark));
});

app.post("/api/bookmarks", requireAuth, (req, res) => {
  const b = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO bookmarks (id, user_id, post, username, tweet_id, timestamp, height, fit, poster,
      retweet_username, tweet_creation_timestamp, tweet_timestamp, tags, note, collection_name,
      resume_token, browse_username, tweet_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.uid, b.post ?? null, b.username ?? null, b.tweetId ?? null,
    b.timestamp ?? Date.now(), b.height ?? null, b.fit ?? null, b.poster ?? null,
    b.retweet_username ?? null, b.tweet_creation_timestamp ?? null, b.tweet_timestamp ?? null,
    JSON.stringify(b.tags ?? []), b.note ?? null, b.collectionName ?? null,
    b.resumeToken ?? null, b.browseUsername ?? null, b.user_id ?? null,
  );
  res.status(201).json({ id });
});

app.patch("/api/bookmarks/:id/collection", requireAuth, (req, res) => {
  const { collectionName } = req.body;
  const info = db.prepare(
    "UPDATE bookmarks SET collection_name = ? WHERE id = ? AND user_id = ?"
  ).run(collectionName ?? null, req.params.id, req.uid);
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.delete("/api/bookmarks/:id", requireAuth, (req, res) => {
  const info = db.prepare("DELETE FROM bookmarks WHERE id = ? AND user_id = ?").run(req.params.id, req.uid);
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// ─── Photos ───────────────────────────────────────────────────────────────────

app.get("/api/photos", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM photos WHERE user_id = ? ORDER BY timestamp DESC").all(req.uid);
  res.json(rows.map((r) => ({ _id: r.id, imageUrl: r.image_url, tweetId: r.tweet_id, timestamp: r.timestamp, username: r.username, user_id: r.tweet_user_id })));
});

app.post("/api/photos", requireAuth, (req, res) => {
  const { imageUrl, tweetId, username, user_id } = req.body;
  const id = uuidv4();
  db.prepare(
    "INSERT INTO photos (id, user_id, image_url, tweet_id, timestamp, username, tweet_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, req.uid, imageUrl ?? null, tweetId ?? null, Date.now(), username ?? null, user_id ?? null);
  res.status(201).json({ id });
});

app.delete("/api/photos/by-tweet/:tweetId", requireAuth, (req, res) => {
  db.prepare("DELETE FROM photos WHERE tweet_id = ? AND user_id = ?").run(req.params.tweetId, req.uid);
  res.json({ ok: true });
});

// ─── Personas ─────────────────────────────────────────────────────────────────

app.get("/api/personas", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM personas WHERE user_id = ? ORDER BY created_at DESC").all(req.uid);
  res.json(rows.map(deserializePersona));
});

app.get("/api/personas/:id", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM personas WHERE id = ? AND user_id = ?").get(req.params.id, req.uid);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(deserializePersona(row));
});

app.post("/api/personas", requireAuth, (req, res) => {
  const { username, summary, tweetCount, twitterAvatarUrl } = req.body;
  const id = uuidv4();
  db.prepare(
    "INSERT INTO personas (id, user_id, username, summary, tweet_count, created_at, twitter_avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, req.uid, username, summary, tweetCount ?? 0, Date.now(), twitterAvatarUrl ?? null);
  res.status(201).json({ id });
});

app.patch("/api/personas/:id", requireAuth, (req, res) => {
  const allowed = ["display_name", "avatar_url", "summary", "tweet_count", "twitter_avatar_url"];
  const updates = req.body;
  const setClauses = [];
  const values = [];

  // Map camelCase client keys to snake_case column names
  const keyMap = { displayName: "display_name", avatarUrl: "avatar_url", twitterAvatarUrl: "twitter_avatar_url", summary: "summary", tweetCount: "tweet_count" };
  for (const [clientKey, col] of Object.entries(keyMap)) {
    if (clientKey in updates && allowed.includes(col)) {
      setClauses.push(`${col} = ?`);
      values.push(updates[clientKey] ?? null);
    }
  }
  if (setClauses.length === 0) return res.status(400).json({ error: "No valid fields" });

  values.push(req.params.id, req.uid);
  const info = db.prepare(`UPDATE personas SET ${setClauses.join(", ")} WHERE id = ? AND user_id = ?`).run(...values);
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.delete("/api/personas/:id", requireAuth, (req, res) => {
  const info = db.prepare("DELETE FROM personas WHERE id = ? AND user_id = ?").run(req.params.id, req.uid);
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// ─── Chat Messages ────────────────────────────────────────────────────────────

app.get("/api/chat/:personaId", requireAuth, (req, res) => {
  const rows = db.prepare(
    "SELECT * FROM chat_messages WHERE user_id = ? AND persona_id = ? ORDER BY timestamp ASC"
  ).all(req.uid, req.params.personaId);
  res.json(rows.map((r) => ({ id: r.id, role: r.role, content: r.content, imageUrl: r.image_url ?? undefined, timestamp: r.timestamp })));
});

app.post("/api/chat/:personaId", requireAuth, (req, res) => {
  const { role, content, imageUrl } = req.body;
  const info = db.prepare(
    "INSERT INTO chat_messages (user_id, persona_id, role, content, image_url, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(req.uid, req.params.personaId, role, content ?? null, imageUrl ?? null, Date.now());
  res.status(201).json({ id: info.lastInsertRowid });
});

app.delete("/api/chat/:personaId", requireAuth, (req, res) => {
  db.prepare("DELETE FROM chat_messages WHERE user_id = ? AND persona_id = ?").run(req.uid, req.params.personaId);
  res.json({ ok: true });
});

// ─── Notification Settings ────────────────────────────────────────────────────

app.get("/api/settings/notifications", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM notification_settings WHERE user_id = ?").get(req.uid);
  if (!row) return res.json({ enabled: false, frequency: 1 });
  res.json({ enabled: !!row.enabled, frequency: row.frequency, fcmToken: row.fcm_token ?? undefined });
});

app.put("/api/settings/notifications", requireAuth, (req, res) => {
  const { enabled, frequency, fcmToken } = req.body;
  db.prepare(`
    INSERT INTO notification_settings (user_id, email, enabled, frequency, fcm_token)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      email = excluded.email,
      enabled = excluded.enabled,
      frequency = excluded.frequency,
      fcm_token = COALESCE(excluded.fcm_token, fcm_token)
  `).run(req.uid, req.email ?? null, enabled ? 1 : 0, frequency ?? 1, fcmToken ?? null);
  res.json({ ok: true });
});

// ─── Deserializers ────────────────────────────────────────────────────────────

function deserializeBookmark(r) {
  return {
    _id: r.id,
    post: r.post,
    username: r.username,
    tweetId: r.tweet_id,
    timestamp: r.timestamp,
    height: r.height,
    fit: r.fit,
    poster: r.poster,
    retweet_username: r.retweet_username,
    tweet_creation_timestamp: r.tweet_creation_timestamp,
    tweet_timestamp: r.tweet_timestamp,
    tags: r.tags ? JSON.parse(r.tags) : [],
    note: r.note,
    collectionName: r.collection_name,
    resumeToken: r.resume_token,
    browseUsername: r.browse_username,
    user_id: r.tweet_user_id,
  };
}

function deserializePersona(r) {
  return {
    _id: r.id,
    username: r.username,
    summary: r.summary,
    tweetCount: r.tweet_count,
    createdAt: r.created_at,
    twitterAvatarUrl: r.twitter_avatar_url,
    avatarUrl: r.avatar_url,
    displayName: r.display_name,
  };
}

// ─── Socket.io — Real-time Chat ───────────────────────────────────────────────
// Replaces Firebase RTDB onValue listener in PersonaChat.jsx.
// Client connects with { auth: { token: firebaseIdToken } }, then joins a room
// per persona. Messages are persisted to SQLite and broadcast to the room.

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Missing auth token"));
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    socket.uid = decoded.uid;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const { uid } = socket;

  socket.on("join_chat", (personaId) => {
    socket.join(`${uid}:${personaId}`);
    // Send full history on join
    const rows = db.prepare(
      "SELECT * FROM chat_messages WHERE user_id = ? AND persona_id = ? ORDER BY timestamp ASC"
    ).all(uid, personaId);
    socket.emit("chat_history", rows.map((r) => ({
      id: r.id, role: r.role, content: r.content,
      imageUrl: r.image_url ?? undefined, timestamp: r.timestamp,
    })));
  });

  socket.on("send_message", ({ personaId, role, content, imageUrl }) => {
    const timestamp = Date.now();
    const info = db.prepare(
      "INSERT INTO chat_messages (user_id, persona_id, role, content, image_url, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(uid, personaId, role, content ?? null, imageUrl ?? null, timestamp);
    const msg = { id: info.lastInsertRowid, role, content, imageUrl: imageUrl ?? undefined, timestamp };
    io.to(`${uid}:${personaId}`).emit("new_message", msg);
  });

  socket.on("clear_chat", (personaId) => {
    db.prepare("DELETE FROM chat_messages WHERE user_id = ? AND persona_id = ?").run(uid, personaId);
    io.to(`${uid}:${personaId}`).emit("chat_cleared");
  });
});

// ─── Static Frontend ──────────────────────────────────────────────────────────

const DIST = path.join(__dirname, "../dist");
app.use(express.static(DIST));
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(DIST, "index.html")));

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 4500;
httpServer.listen(PORT, () => {
  console.log(`Tweet Vault server listening on :${PORT}`);
  const counts = {
    bookmarks: db.prepare("SELECT COUNT(*) as n FROM bookmarks").get().n,
    photos:    db.prepare("SELECT COUNT(*) as n FROM photos").get().n,
    personas:  db.prepare("SELECT COUNT(*) as n FROM personas").get().n,
    chats:     db.prepare("SELECT COUNT(*) as n FROM chat_messages").get().n,
  };
  console.log("DB:", counts);
});
