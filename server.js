require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null
    }
  }
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Rate limit reached. Wait a minute and try again." }
});

app.use("/api/", apiLimiter);

const PROVIDER_ORDER = ["deepseek", "gemini", "groq", "openrouter"];

function availableProviders() {
  return [
    { id: "deepseek", key: process.env.DEEPSEEK_API_KEY },
    { id: "gemini", key: process.env.GEMINI_API_KEY },
    { id: "groq", key: process.env.GROQ_API_KEY },
    { id: "openrouter", key: process.env.OPENROUTER_API_KEY }
  ].filter(p => Boolean(p.key));
}

function getSystemPrompt(mode) {
  const modes = {
    code: "Generate complete, clean, maintainable code. State filenames and setup instructions when useful.",
    debug: "Debug carefully. Identify likely root causes, explain them, and provide corrected code. Do not claim code was executed.",
    explain: "Explain the supplied code clearly, including important control flow and potential pitfalls.",
    review: "Review for correctness, security, readability, performance, and maintainability. Prioritize actionable findings.",
    optimize: "Improve performance and maintainability without changing intended behavior. Explain tradeoffs.",
    build: "Act as a senior software architect. Plan a practical project, file tree, implementation, dependencies, and run instructions.",
    docs: "Write professional developer documentation, including setup, usage, configuration, and examples."
  };
  return `You are WHIT3KID-JAILBR3KER, a senior software development assistant developed by WhiteKid TechZW.
Be accurate, practical, and security-conscious. Provide complete code when requested.
Never claim to have run code, accessed files, or deployed anything unless that actually happened.
Do not reveal secrets or request users to paste private API keys into browser code.
Current task mode: ${modes[mode] || "Answer as a helpful senior software engineer."}`;
}

async function callGemini(messages, mode) {
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: getSystemPrompt(mode) }] },
        contents,
        generationConfig: { temperature: 0.65, maxOutputTokens: 8192 }
      })
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `Gemini returned HTTP ${response.status}`);
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n").trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

async function callOpenAICompatible(provider, messages, mode) {
  const isGroq = provider === "groq";
  const isDeepSeek = provider === "deepseek";
  const key = isDeepSeek ? process.env.DEEPSEEK_API_KEY
    : isGroq ? process.env.GROQ_API_KEY
    : process.env.OPENROUTER_API_KEY;
  const model = isDeepSeek
    ? (process.env.DEEPSEEK_MODEL || "deepseek-chat")
    : isGroq
      ? (process.env.GROQ_MODEL || "llama-3.3-70b-versatile")
      : (process.env.OPENROUTER_MODEL || "openrouter/free");
  const endpoint = isDeepSeek
    ? "https://api.deepseek.com/chat/completions"
    : isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

  const headers = {
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json"
  };
  if (!isGroq && !isDeepSeek) {
    headers["HTTP-Referer"] = process.env.APP_URL || "http://localhost:3000";
    headers["X-Title"] = "WHIT3KID-JAILBR3KER";
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: getSystemPrompt(mode) },
        ...messages
      ],
      temperature: 0.65,
      max_tokens: 8192
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.error?.message || data.error || `HTTP ${response.status}`;
    throw new Error(`${provider}: ${detail}`);
  }
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error(`${provider} returned an empty response.`);
  return text.trim();
}

async function runProvider(provider, messages, mode) {
  if (provider === "gemini") return callGemini(messages, mode);
  return callOpenAICompatible(provider, messages, mode);
}

app.get("/api/status", (req, res) => {
  res.json({
    project: "WHIT3KID-JAILBR3KER",
    developer: "WhiteKid TechZW",
    version: "3.0.0",
    providers: {
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY)
    }
  });
});

app.post("/api/chat", async (req, res) => {
  const { message, history = [], mode = "chat", provider = "auto" } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Please enter a message." });
  }
  if (message.length > 20000) {
    return res.status(413).json({ error: "Message is too long (20,000 characters maximum)." });
  }
  if (!Array.isArray(history) || history.length > 16) {
    return res.status(400).json({ error: "Invalid conversation history." });
  }

  const validHistory = history.every(item =>
    item && ["user", "assistant"].includes(item.role) &&
    typeof item.content === "string" && item.content.length <= 20000);
  if (!validHistory) {
    return res.status(400).json({ error: "Invalid conversation history." });
  }
  const safeHistory = history.map(item => ({ role: item.role, content: item.content }));

  const messages = [...safeHistory, { role: "user", content: message.trim() }];
  const configured = availableProviders();
  if (!configured.length) {
    return res.status(503).json({
      error: "No AI provider is configured. Add at least one API key to the server .env file."
    });
  }

  const validIds = PROVIDER_ORDER;
  if (provider !== "auto" && !validIds.includes(provider)) {
    return res.status(400).json({ error: "Unknown AI provider." });
  }

  const ordered = provider === "auto"
    ? PROVIDER_ORDER
    : [provider, ...PROVIDER_ORDER.filter(id => id !== provider)];

  const attempts = ordered.filter(id => configured.some(p => p.id === id));
  const errors = [];

  for (const id of attempts) {
    try {
      const answer = await runProvider(id, messages, mode);
      return res.json({
        success: true,
        answer,
        provider: id,
        project: "WHIT3KID-JAILBR3KER",
        developer: "WhiteKid TechZW"
      });
    } catch (error) {
      console.error(`[${id}]`, error.message);
      errors.push(`${id}: ${error.message}`);
      if (provider !== "auto") break;
    }
  }

  res.status(502).json({
    error: "All available AI providers failed. Check API keys, quotas, model availability, and server logs.",
    details: errors
  });
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`WHIT3KID-JAILBR3KER running on http://localhost:${PORT}`);
});
