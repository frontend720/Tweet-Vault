/* eslint-env node */
const functions = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const https = require("https");
const admin = require("firebase-admin");

admin.initializeApp();

const VENICE_BASE = "https://api.venice.ai/api/v1";
const HF_MODEL = "Minthy/ToriiGate-v0.4-7B";
const HF_BASE = `https://api-inference.huggingface.co/models/${HF_MODEL}/v1`;

async function toriiGateChat(messages, temperature = 0.85) {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) throw new Error("HF_API_KEY is not set");
  const res = await fetch(`${HF_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages,
      temperature,
      max_tokens: 1024,
    }),
  });
  const text = await res.text();
  console.log("ToriiGate status:", res.status, "body:", text.slice(0, 300));
  if (!res.ok) {
    const err = new Error(`ToriiGate ${res.status}: ${text.slice(0, 200)}`);
    err.hfStatus = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  return data.choices?.[0]?.message?.content ?? null;
}

async function veniceChat(messages, model = "venice-uncensored-1-2", temperature = 0.7) {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) throw new Error("VENICE_API_KEY is not set");
  const res = await fetch(`${VENICE_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
    }),
  });
  const text = await res.text();
  console.log("Venice status:", res.status, "body:", text.slice(0, 300));
  if (!res.ok) {
    const err = new Error(`Venice ${res.status}: ${text.slice(0, 200)}`);
    err.veniceStatus = res.status;
    throw err;
  }
  const data = JSON.parse(text);
  return data.choices?.[0]?.message?.content ?? null;
}

// Returns the best publicly-accessible avatar URL for a persona.
// Custom avatars stored as base64 data URLs can't be referenced in push notifications.
function personaIconUrl(persona) {
  if (persona.twitterAvatarUrl) return persona.twitterAvatarUrl;
  if (persona.avatarUrl && !persona.avatarUrl.startsWith("data:")) return persona.avatarUrl;
  return null;
}

function corsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

exports.buildPersona = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { tweets, username, model } = req.body;
  if (!tweets?.length || !username) {
    res.status(400).json({ error: "Missing tweets or username" });
    return;
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
    const message = err.veniceStatus === 429
      ? "Model is overloaded — try again in a moment."
      : "Failed to build persona.";
    res.status(status).json({ error: message });
  }
});

exports.chatWithPersona = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { summary, username, messages, model } = req.body;
  if (!summary || !messages?.length) {
    res.status(400).json({ error: "Missing summary or messages" });
    return;
  }

  const VL_MODELS = new Set(["qwen3-vl-235b-a22b", "e2ee-qwen3-vl-30b-a3b-p"]);
  const DEFAULT_VL = "qwen3-vl-235b-a22b";
  const hasImages = messages.some((m) => m.imageUrl);
  let effectiveModel = model ?? "venice-uncensored-1-2";
  if (hasImages && !VL_MODELS.has(effectiveModel)) effectiveModel = DEFAULT_VL;

  // Build content arrays for vision messages
  const builtMessages = messages.map((m) => {
    if (!m.imageUrl) return { role: m.role, content: m.content };
    return {
      role: m.role,
      content: [
        ...(m.content ? [{ type: "text", text: m.content }] : []),
        { type: "image_url", image_url: { url: m.imageUrl } },
      ],
    };
  });

  const now = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
  const systemPrompt = `The current date and time is ${now}.\n\nYou are roleplaying as @${username} based on analysis of their actual tweets. Stay in character at all times. Use their documented writing style, phrases, and worldview. Never break character or acknowledge you are an AI.\n\n${summary}`;

  try {
    const reply = await veniceChat([
      { role: "system", content: systemPrompt },
      ...builtMessages,
    ], effectiveModel, 0.85);
    if (!reply) throw new Error("Empty response");
    res.json({ message: reply });
  } catch (err) {
    console.error("chatWithPersona error:", err);
    const status = err.veniceStatus === 429 ? 503 : 500;
    const message = err.veniceStatus === 429
      ? "Model is overloaded — try again in a moment."
      : "Failed to get response.";
    res.status(status).json({ error: message });
  }
});

exports.chatWithToriiGate = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { summary, username, messages } = req.body;
  if (!summary || !messages?.length) {
    res.status(400).json({ error: "Missing summary or messages" });
    return;
  }

  // Build vision-compatible content arrays where needed
  const builtMessages = messages.map((m) => {
    if (!m.imageUrl) return { role: m.role, content: m.content };
    return {
      role: m.role,
      content: [
        ...(m.content ? [{ type: "text", text: m.content }] : []),
        { type: "image_url", image_url: { url: m.imageUrl } },
      ],
    };
  });

  const now = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
  const systemPrompt = `The current date and time is ${now}.\n\nYou are roleplaying as @${username} based on analysis of their actual tweets. Stay in character at all times. Use their documented writing style, phrases, and worldview. Never break character or acknowledge you are an AI.\n\n${summary}`;

  try {
    const reply = await toriiGateChat([
      { role: "system", content: systemPrompt },
      ...builtMessages,
    ]);
    if (!reply) throw new Error("Empty response");
    res.json({ message: reply });
  } catch (err) {
    console.error("chatWithToriiGate error:", err);
    const isLoading = err.hfStatus === 503;
    const status = isLoading ? 503 : 500;
    const message = isLoading
      ? "Model is loading — wait a moment and try again."
      : "Failed to get response.";
    res.status(status).json({ error: message });
  }
});

exports.generateScenarios = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { summary, username, model } = req.body;
  if (!summary || !username) {
    res.status(400).json({ error: "Missing summary or username" });
    return;
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
    const message = err.veniceStatus === 429
      ? "Model is overloaded — try again in a moment."
      : "Failed to generate scenarios.";
    res.status(status).json({ error: message });
  }
});

exports.listModels = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "VENICE_API_KEY is not set" }); return; }

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

exports.editPersonaAvatar = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { image, prompt, model = "firered-image-edit" } = req.body;
  if (!image || !prompt) {
    res.status(400).json({ error: "image and prompt are required" });
    return;
  }

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "VENICE_API_KEY is not set" }); return; }

  // Client always converts URLs to base64 before sending; strip data URL prefix if present
  let base64Image = image.startsWith("data:") ? image.split(",")[1] : image;

  try {
    const r = await fetch(`${VENICE_BASE}/image/edit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image, prompt, model }),
    });
    const contentType = r.headers.get("content-type") ?? "";
    console.log("editPersonaAvatar status:", r.status, "content-type:", contentType);

    if (!r.ok) {
      const text = await r.text();
      let errMsg = "Image edit failed";
      try { errMsg = JSON.parse(text)?.error ?? errMsg; } catch { /* ignore */ }
      res.status(r.status).json({ error: errMsg, detail: text.slice(0, 500) });
      return;
    }

    // Venice may return binary image data directly
    if (contentType.includes("image/")) {
      const buffer = await r.arrayBuffer();
      const b64 = Buffer.from(buffer).toString("base64"); // eslint-disable-line no-undef
      const mime = contentType.split(";")[0].trim();
      res.json({ result: `data:${mime};base64,${b64}` });
      return;
    }

    // Otherwise expect JSON (URL or base64 string)
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    res.json({ result: parsed });
  } catch (err) {
    console.error("editPersonaAvatar error:", err);
    res.status(500).json({ error: "Failed to edit image" });
  }
});

exports.testChatNotification = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { fcmToken, email } = req.body;
  if (!fcmToken || !email) {
    res.status(400).json({ error: "fcmToken and email are required" });
    return;
  }

  try {
    const firestore = admin.firestore();
    const rtdb = admin.database();

    // Find a persona that has chat history to make the test realistic
    const personasSnap = await firestore.collection("users").doc(email).collection("personas").get();
    if (personasSnap.empty) {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title: "TweetVault", body: "Push notifications are working!" },
        webpush: { fcmOptions: { link: "/" } },
      });
      res.json({ success: true, type: "generic" });
      return;
    }

    // Pick a random persona; prefer one with a real chat history
    const personas = personasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Fetch the uid once — it's stored in the notification settings doc
    const notifSnap = await firestore.collection("users").doc(email).collection("settings").doc("notifications").get();
    const uid = notifSnap.data()?.uid ?? null;

    let chosenPersona = null;
    let recent = [];

    if (uid) {
      for (const p of personas.sort(() => Math.random() - 0.5)) {
        const chatSnap = await rtdb.ref(`chats/${uid}/${p.id}`).once("value");
        const chatData = chatSnap.val();
        if (chatData) {
          recent = Object.values(chatData).sort((a, b) => a.timestamp - b.timestamp).slice(-4);
          chosenPersona = p;
          break;
        }
      }
    }

    // Fall back to any persona even without chat history
    if (!chosenPersona) chosenPersona = personas[Math.floor(Math.random() * personas.length)];

    // Generate in-character test message via Venice
    const history = recent.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content || "" }));
    const systemPrompt = `You are roleplaying as @${chosenPersona.username}. ${chosenPersona.summary}\n\nWrite ONE short, in-character message (1-2 sentences max) as if you're reaching out to continue a conversation or start a new one. Sound like a casual text message.`;

    let body;
    try {
      body = await veniceChat([
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: "[Send a short re-engagement message now.]" },
      ], "venice-uncensored-1-2", 0.9);
    } catch {
      body = "Hey, you around? We should pick up where we left off.";
    }

    const displayName = chosenPersona.displayName ?? `@${chosenPersona.username}`;
    const icon = personaIconUrl(chosenPersona);
    await admin.messaging().send({
      token: fcmToken,
      notification: { title: displayName, body: (body ?? "").slice(0, 200) },
      data: { chatUsername: chosenPersona.username, personaId: chosenPersona.id },
      webpush: {
        notification: { icon: icon ?? "/icon.svg", badge: "/icon.svg" },
        fcmOptions: { link: `/chat/${chosenPersona.username}?pid=${chosenPersona.id}` },
      },
    });
    res.json({ success: true, persona: displayName });
  } catch (err) {
    console.error("testChatNotification error:", err);
    res.status(500).json({ error: err.message ?? "Internal error" });
  }
});

// Runs every hour — checks each user's chat notification preferences and sends
// an in-character re-engagement message for any chat idle longer than the threshold.
exports.sendChatReengagement = onSchedule("every 60 minutes", async () => {
  const firestore = admin.firestore();
  const rtdb = admin.database();

  // Fetch all users who have notifications enabled and an FCM token
  const usersSnap = await firestore.collectionGroup("settings").where("enabled", "==", true).get();
  if (usersSnap.empty) return null;

  const now = Date.now();

  await Promise.allSettled(usersSnap.docs.map(async (settingsDoc) => {
    const { fcmToken, frequency = 1, uid, lastNotifiedAt = 0 } = settingsDoc.data();
    if (!fcmToken || !uid) return;

    // Respect frequency: minimum gap between notifications in ms
    const minGapMs = (24 / frequency) * 60 * 60 * 1000;
    if (now - lastNotifiedAt < minGapMs) return;

    // Find idle chats for this user
    const chatsSnap = await rtdb.ref(`chats/${uid}`).once("value");
    const chatsData = chatsSnap.val();
    if (!chatsData) return;

    // settingsDoc path: users/{email}/settings/notifications — parent is users/{email}
    const email = settingsDoc.ref.parent.parent.id;

    // Find chats idle for at least 6 hours (RTDB keys are now persona doc IDs)
    const IDLE_MS = 6 * 60 * 60 * 1000;
    const idleChats = Object.entries(chatsData)
      .map(([personaId, msgs]) => {
        const messages = Object.values(msgs).sort((a, b) => a.timestamp - b.timestamp);
        const lastMsg = messages[messages.length - 1];
        return { personaId, messages, lastTimestamp: lastMsg?.timestamp ?? 0 };
      })
      .filter(({ lastTimestamp }) => now - lastTimestamp > IDLE_MS);

    if (!idleChats.length) return;

    // Pick a random idle chat
    const chat = idleChats[Math.floor(Math.random() * idleChats.length)];
    const recent = chat.messages.slice(-6);

    // Look up the persona by its Firestore doc ID (the RTDB key)
    const personaDoc = await firestore
      .collection("users").doc(email)
      .collection("personas").doc(chat.personaId).get();
    if (!personaDoc.exists) return;
    const persona = personaDoc.data();

    // Generate in-character re-engagement message via Venice
    const history = recent.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content || "" }));
    const systemPrompt = `You are roleplaying as @${chat.username}. ${persona.summary}\n\nThe user hasn't replied in a while. Write ONE short, in-character message (1-2 sentences max) inviting them back to the conversation. Reference something from the recent chat context. Sound natural — like a text message, not a notification.`;

    let reengagementMsg;
    try {
      reengagementMsg = await veniceChat([
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: "[The user has been away for a while. Send a re-engagement message now.]" },
      ], "venice-uncensored-1-2", 0.9);
    } catch (err) {
      console.error("Venice re-engagement error:", err);
      return;
    }
    if (!reengagementMsg) return;

    // Send FCM push notification
    const displayName = persona.displayName ?? `@${chat.username}`;
    const icon = personaIconUrl(persona);
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: displayName,
          body: reengagementMsg.slice(0, 200),
        },
        data: { chatUsername: chat.username, personaId: chat.personaId },
        webpush: {
          notification: { icon: icon ?? "/icon.svg", badge: "/icon.svg" },
          fcmOptions: { link: `/chat/${chat.username}?pid=${chat.personaId}` },
        },
      });
      // Update lastNotifiedAt
      await settingsDoc.ref.update({ lastNotifiedAt: now });
    } catch (err) {
      console.error("FCM send error:", err);
      // Token may be stale — disable notifications for this user
      if (err.code === "messaging/registration-token-not-registered") {
        await settingsDoc.ref.update({ enabled: false, fcmToken: null });
      }
    }
  }));

  return null;
});

exports.proxyVideo = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Range, Content-Type");
  res.set("Access-Control-Expose-Headers", "Accept-Ranges, Content-Range, Content-Length");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET");
    res.status(204).send("");
    return;
  }

  const videoUrl = req.query.url;
  if (!videoUrl) {
    res.status(400).send("Missing 'url' query parameter");
    return;
  }

  const parsed = new URL(videoUrl);
  const options = {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: "GET",
    headers: {},
  };

  // Forward Range header so Chrome can seek (byte-range requests)
  if (req.headers.range) {
    options.headers["Range"] = req.headers.range;
  }

  const proxyReq = https.request(options, (upstreamRes) => {
    // Pass through 200, 206, 404, etc. unchanged
    res.status(upstreamRes.statusCode);

    if (upstreamRes.headers["content-type"]) {
      res.set("Content-Type", upstreamRes.headers["content-type"]);
    }
    if (upstreamRes.headers["content-length"]) {
      res.set("Content-Length", upstreamRes.headers["content-length"]);
    }
    // Required for Chrome to enable the scrubber
    if (upstreamRes.headers["content-range"]) {
      res.set("Content-Range", upstreamRes.headers["content-range"]);
    }
    res.set("Accept-Ranges", upstreamRes.headers["accept-ranges"] || "bytes");

    upstreamRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy Error:", err);
    res.status(500).send("Failed to proxy video");
  });

  proxyReq.end();
});

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

exports.generateStorySeeds = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { summary, username, pov } = req.body;
  if (!summary || !username || !pov) {
    res.status(400).json({ error: "Missing required fields" });
    return;
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

exports.advanceStory = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const { summary, username, pov, turns = [], direction, isEnding = false } = req.body;
  if (!summary || !username || !pov) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const baseSystem = `You are writing a short literary story in the distinctive voice and worldview of @${username}.

${summary}

${POV_INSTRUCTIONS[pov] || ""}

Write 2–4 paragraphs per turn. Render prose only — no headers, no chapter numbers, no meta-commentary, no acknowledgment of the user's direction. Maintain consistent voice, tense, and POV throughout. Build tension across turns; don't resolve threads prematurely.`;

  const endingAddendum = `\n\nThis is the FINAL turn. Resolve all open story threads. Deliver a payoff that feels earned and complete. Close with intention — no "The End", no epilogue label, no meta-commentary.`;

  const systemPrompt = isEnding ? baseSystem + endingAddendum : baseSystem;

  // Build alternating message history from turn log
  const messages = [];
  if (turns.length > 0) {
    messages.push({ role: "assistant", content: turns[0].prose }); // opening
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
