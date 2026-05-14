// Output price per million tokens drives the cost tier.
// Exclude models whose output price exceeds this for a hobby budget.
const MAX_OUTPUT = 10;

// Keyed by Venice model ID. output = $/M output tokens.
const PRICING = {
  "qwen3-6-27b":                          { output: 3.25 },
  "deepseek-v4-pro":                      { output: 3.80 },
  "deepseek-v4-flash":                    { output: 0.35 },
  "openai-gpt-55-pro":                    { output: 225.00 },
  "e2ee-glm-5-1":                         { output: 4.15 },
  "openai-gpt-55":                        { output: 37.50 },
  "kimi-k2-6":                            { output: 4.66 },
  "grok-4-3":                             { output: 2.83 },
  "claude-opus-4-7":                      { output: 30.00 },
  "gemma-4-uncensored":                   { output: 0.50 },
  "claude-opus-4-6-fast":                 { output: 180.00 },
  "zai-org-glm-5-1":                      { output: 5.50 },
  "qwen-3-6-plus":                        { output: 3.75 },
  "google-gemma-4-31b-it":               { output: 0.50 },
  "google-gemma-4-26b-a4b-it":           { output: 0.50 },
  "arcee-trinity-large-thinking":         { output: 1.13 },
  "z-ai-glm-5v-turbo":                    { output: 5.00 },
  "venice-uncensored-1-2":               { output: 0.90 },
  "openai-gpt-54-mini":                   { output: 5.63 },
  "aion-labs-aion-2-0":                   { output: 2.00 },
  "nvidia-nemotron-cascade-2-30b-a3b":    { output: 0.80 },
  "minimax-m27":                          { output: 1.50 },
  "e2ee-venice-uncensored-24b-p":         { output: 1.15 },
  "e2ee-gemma-3-27b-p":                   { output: 0.50 },
  "e2ee-glm-4-7-p":                       { output: 4.15 },
  "e2ee-glm-4-7-flash-p":                 { output: 0.55 },
  "e2ee-gpt-oss-20b-p":                   { output: 0.19 },
  "e2ee-gpt-oss-120b-p":                  { output: 0.65 },
  "e2ee-qwen-2-5-7b-p":                   { output: 0.13 },
  "e2ee-qwen3-30b-a3b-p":                 { output: 0.69 },
  "e2ee-qwen3-vl-30b-a3b-p":              { output: 0.90 },
  "e2ee-qwen3-5-122b-a10b":              { output: 4.00 },
  "mistral-small-2603":                   { output: 0.75 },
  "z-ai-glm-5-turbo":                     { output: 4.00 },
  "grok-4-20":                            { output: 2.83 },
  "grok-4-20-multi-agent":               { output: 2.83 },
  "qwen3-5-9b":                           { output: 0.15 },
  "openai-gpt-54":                        { output: 18.80 },
  "openai-gpt-54-pro":                    { output: 225.00 },
  "openai-gpt-4o-2024-11-20":            { output: 12.50 },
  "openai-gpt-4o-mini-2024-07-18":       { output: 0.75 },
  "qwen3-5-35b-a3b":                      { output: 1.25 },
  "openai-gpt-53-codex":                  { output: 17.50 },
  "venice-uncensored-role-play":          { output: 2.00 },
  "mercury-2":                            { output: 0.94 },
  "gemini-3-1-pro-preview":              { output: 15.00 },
  "claude-sonnet-4-6":                    { output: 18.00 },
  "qwen3-5-397b-a17b":                    { output: 4.50 },
  "minimax-m25":                          { output: 1.19 },
  "zai-org-glm-5":                        { output: 3.20 },
  "claude-opus-4-6":                      { output: 30.00 },
  "olafangensan-glm-4.7-flash-heretic":   { output: 0.80 },
  "zai-org-glm-4.7-flash":               { output: 0.50 },
  "kimi-k2-5":                            { output: 3.50 },
  "qwen3-coder-480b-a35b-instruct-turbo": { output: 1.50 },
  "nvidia-nemotron-3-nano-30b-a3b":       { output: 0.30 },
  "qwen3-vl-235b-a22b":                   { output: 1.50 },
  "mistral-small-3-2-24b-instruct":       { output: 0.25 },
  "zai-org-glm-4.7":                      { output: 2.65 },
  "gemini-3-flash-preview":               { output: 3.75 },
  "openai-gpt-52":                        { output: 17.50 },
  "claude-opus-4-5":                      { output: 30.00 },
  "deepseek-v3.2":                        { output: 0.48 },
  "openai-gpt-oss-120b":                  { output: 0.30 },
  "google-gemma-3-27b-it":               { output: 0.20 },
  "hermes-3-llama-3.1-405b":             { output: 3.00 },
  "qwen3-235b-a22b-thinking-2507":        { output: 3.50 },
  "qwen3-235b-a22b-instruct-2507":        { output: 0.75 },
  "qwen3-next-80b":                       { output: 1.90 },
  "llama-3.3-70b":                        { output: 2.80 },
  "claude-sonnet-4-5":                    { output: 18.75 },
  "openai-gpt-52-codex":                  { output: 17.50 },
  "llama-3.2-3b":                         { output: 0.60 },
  "zai-org-glm-4.6":                      { output: 2.75 },
};

const DEPRECATED = new Set(["grok-41-fast"]);

// ── Use-case categories ───────────────────────────────────────────────
// roleplay  → uncensored / character-focused / conversational tone
// chat      → balanced general purpose
// reasoning → deep analysis, complex synthesis, large context
// code      → technical / developer personas
export const MODEL_CATEGORY = {
  // Persona & Roleplay
  "venice-uncensored-1-2":             "roleplay",
  "venice-uncensored-role-play":       "roleplay",
  "gemma-4-uncensored":                "roleplay",
  "e2ee-venice-uncensored-24b-p":      "roleplay",
  "olafangensan-glm-4.7-flash-heretic":"roleplay",
  "hermes-3-llama-3.1-405b":          "roleplay",
  "e2ee-gemma-3-27b-p":               "roleplay",

  // General Chat
  "grok-4-3":                          "chat",
  "grok-4-20":                         "chat",
  "grok-4-20-multi-agent":             "chat",
  "openai-gpt-4o-mini-2024-07-18":    "chat",
  "llama-3.3-70b":                     "chat",
  "llama-3.2-3b":                      "chat",
  "minimax-m25":                       "chat",
  "minimax-m27":                       "chat",
  "kimi-k2-5":                         "chat",
  "kimi-k2-6":                         "chat",
  "mistral-small-3-2-24b-instruct":   "chat",
  "mistral-small-2603":                "chat",
  "deepseek-v4-flash":                 "chat",
  "deepseek-v3.2":                     "chat",
  "google-gemma-3-27b-it":            "chat",
  "google-gemma-4-31b-it":            "chat",
  "google-gemma-4-26b-a4b-it":        "chat",
  "gemini-3-flash-preview":            "chat",
  "nvidia-nemotron-3-nano-30b-a3b":   "chat",
  "nvidia-nemotron-cascade-2-30b-a3b":"chat",
  "mercury-2":                         "chat",
  "aion-labs-aion-2-0":               "chat",
  "zai-org-glm-4.7-flash":            "chat",
  "zai-org-glm-4.6":                  "chat",
  "zai-org-glm-4.7":                  "chat",
  "e2ee-glm-4-7-flash-p":             "chat",
  "e2ee-qwen-2-5-7b-p":               "chat",
  "e2ee-gpt-oss-20b-p":               "chat",
  "qwen3-235b-a22b-instruct-2507":    "chat",
  "qwen3-next-80b":                    "chat",
  "qwen3-5-9b":                        "chat",

  // Reasoning & Analysis
  "arcee-trinity-large-thinking":      "reasoning",
  "qwen3-235b-a22b-thinking-2507":    "reasoning",
  "deepseek-v4-pro":                   "reasoning",
  "qwen3-5-397b-a17b":                 "reasoning",
  "qwen-3-6-plus":                     "reasoning",
  "qwen3-6-27b":                       "reasoning",
  "qwen3-5-35b-a3b":                   "reasoning",
  "zai-org-glm-5-1":                   "reasoning",
  "zai-org-glm-5":                     "reasoning",
  "z-ai-glm-5-turbo":                  "reasoning",
  "e2ee-glm-5-1":                      "reasoning",
  "e2ee-glm-4-7-p":                    "reasoning",
  "e2ee-qwen3-5-122b-a10b":           "reasoning",
  "e2ee-qwen3-30b-a3b-p":             "reasoning",
  "openai-gpt-54-mini":                "reasoning",
  "qwen3-vl-235b-a22b":               "reasoning",
  "e2ee-qwen3-vl-30b-a3b-p":          "reasoning",

  // Technical & Code
  "qwen3-coder-480b-a35b-instruct-turbo": "code",
  "openai-gpt-oss-120b":               "code",
  "e2ee-gpt-oss-120b-p":              "code",
};

export const CATEGORY_META = {
  roleplay:  { label: "🎭  Persona & Roleplay", order: 0 },
  chat:      { label: "💬  General Chat",        order: 1 },
  reasoning: { label: "🧠  Reasoning & Analysis",order: 2 },
  code:      { label: "💻  Technical & Code",    order: 3 },
  other:     { label: "◦  Other",               order: 4 },
};

// $ < $1/M  ·  $$ $1–5/M  ·  $$$ $5–10/M  ·  excluded > $10/M
export function modelTier(id) {
  const p = PRICING[id];
  if (!p) return null;
  if (p.output < 1) return "$";
  if (p.output < 5) return "$$";
  if (p.output <= MAX_OUTPUT) return "$$$";
  return null; // over budget
}

export function isModelAllowed(id) {
  if (DEPRECATED.has(id)) return false;
  const p = PRICING[id];
  if (!p) return true; // unknown cost — include and let user decide
  return p.output <= MAX_OUTPUT;
}

export function modelLabel(id) {
  const tier = modelTier(id);
  const p = PRICING[id];
  if (!tier || !p) return id;
  return `${id}  ·  ${tier}  ($${p.output.toFixed(2)}/M out)`;
}
