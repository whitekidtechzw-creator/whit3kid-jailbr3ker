const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let chatHistory = [];
let selectedLanguage = "JavaScript";
let toastTimer;

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

const pageNames = {
  dashboard: "Dashboard", ai: "AI Workspace", commands: "Command Directory",
  lab: "Code Lab", tools: "Developer Tools", security: "Security Center",
  settings: "Settings", terms: "Terms of Service", about: "About"
};

function showPage(name) {
  if (!pageNames[name]) return;
  $$(".page").forEach(page => page.classList.toggle("active", page.id === `page-${name}`));
  $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.page === name));
  $("#pageHeading").textContent = pageNames[name];
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$$(".nav-item").forEach(button => button.addEventListener("click", () => showPage(button.dataset.page)));
$$("[data-go]").forEach(button => button.addEventListener("click", () => showPage(button.dataset.go)));
$("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#themeToggle").addEventListener("click", () => document.body.classList.toggle("low-glow"));

async function loadStatus() {
  try {
    const response = await fetch("/api/status");
    const data = await response.json();
    const entries = Object.entries(data.providers);
    const count = entries.filter(([, ready]) => ready).length;
    $("#providerCount").textContent = `${count} / 3`;
    $("#systemStatus").textContent = count ? "AI READY" : "SETUP REQUIRED";
    const markup = entries.map(([name, ready]) =>
      `<div class="provider-row"><span>${name[0].toUpperCase() + name.slice(1)}</span><span class="${ready ? "ready" : ""}">${ready ? "● CONFIGURED" : "○ NOT CONFIGURED"}</span></div>`
    ).join("");
    $("#providerStatus").innerHTML = markup;
    $("#settingsProviders").innerHTML = markup;
  } catch {
    $("#systemStatus").textContent = "SERVER OFFLINE";
    $("#providerStatus").textContent = "Could not reach backend. Start the Node.js server.";
    $("#settingsProviders").textContent = "Could not reach backend.";
  }
}
$("#refreshStatus").addEventListener("click", loadStatus);

const commands = [
  ["/help", "Show help and available assistant capabilities", "chat"],
  ["/menu", "Show the command directory", "chat"],
  ["/code", "Generate complete source code for a feature", "code"],
  ["/debug", "Investigate an error and propose a fix", "debug"],
  ["/explain", "Explain code, APIs or technical concepts", "explain"],
  ["/optimize", "Improve performance and maintainability", "optimize"],
  ["/review", "Review code for bugs, security and quality", "review"],
  ["/build", "Plan a project architecture and implementation", "build"],
  ["/status", "Check configured AI provider status", "chat"],
  ["/reset", "Clear the current conversation session", "chat"]
];
function renderCommands(query = "") {
  const grid = $("#commandGrid");
  grid.innerHTML = "";
  const matches = commands.filter(item => item.join(" ").toLowerCase().includes(query.toLowerCase()));
  matches.forEach(([command, description, mode]) => {
    const card = document.createElement("article");
    card.className = "command-card";
    const info = document.createElement("div");
    const code = document.createElement("code");
    code.textContent = command;
    const desc = document.createElement("p");
    desc.textContent = description;
    info.append(code, desc);
    const copy = document.createElement("button");
    copy.className = "copy-command";
    copy.textContent = "COPY";
    copy.addEventListener("click", async () => {
      await copyText(command);
      toast(`${command} copied`);
    });
    card.append(info, copy);
    card.addEventListener("dblclick", () => {
      $("#modeSelect").value = mode;
      $("#messageInput").value = `${command} `;
      showPage("ai");
      $("#messageInput").focus();
    });
    grid.append(card);
  });
  if (!matches.length) grid.textContent = "No commands match your search.";
}
$("#commandSearch").addEventListener("input", event => renderCommands(event.target.value));
renderCommands();

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
}

const languages = [
  ["Python", "🐍", "main.py", 'def main():\n    print("Hello from WHIT3KID-JAILBR3KER")\n\nif __name__ == "__main__":\n    main()\n'],
  ["JavaScript", "JS", "app.js", 'function main() {\n  console.log("Hello from WHIT3KID-JAILBR3KER");\n}\n\nmain();\n'],
  ["HTML / CSS", "🌐", "index.html", '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello, world!</h1>\n</body>\n</html>\n'],
  ["C#", "C#", "Program.cs", 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, world!");\n    }\n}\n'],
  ["Unity", "🎮", "MainBehaviour.cs", 'using UnityEngine;\n\npublic class MainBehaviour : MonoBehaviour {\n    void Start() {\n        Debug.Log("Hello from Unity");\n    }\n}\n'],
  ["Android", "📱", "MainActivity.kt", 'package com.example.app\n\nimport android.os.Bundle\nimport androidx.appcompat.app.AppCompatActivity\n\nclass MainActivity : AppCompatActivity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        super.onCreate(savedInstanceState)\n    }\n}\n'],
  ["API Development", "🔌", "server.js", 'const express = require("express");\nconst app = express();\napp.use(express.json());\napp.get("/api/health", (req, res) => res.json({ status: "ok" }));\napp.listen(3000);\n'],
  ["Architecture", "🏗", "ARCHITECTURE.md", '# Project Architecture\n\n## Components\n- Frontend\n- Backend API\n- Data layer\n- Authentication\n\n## Data flow\nDescribe how requests move through the system.\n']
];
function selectLanguage(name) {
  selectedLanguage = name;
  const item = languages.find(lang => lang[0] === name);
  $("#editorLanguage").textContent = `EDITOR / ${name.toUpperCase()} / ${item[2]}`;
  $("#codeEditor").value = item[3];
  $$(".language-card").forEach(button => button.classList.toggle("selected", button.dataset.language === name));
  updateCharCount();
}
function renderLanguages() {
  const grid = $("#languageGrid");
  languages.forEach(([name, icon, filename]) => {
    const button = document.createElement("button");
    button.className = "language-card";
    button.dataset.language = name;
    const symbol = document.createElement("span");
    symbol.textContent = icon;
    const title = document.createElement("strong");
    title.textContent = name;
    const file = document.createElement("small");
    file.textContent = filename;
    button.append(symbol, title, file);
    button.addEventListener("click", () => selectLanguage(name));
    grid.append(button);
  });
}
renderLanguages();
selectLanguage("JavaScript");
function updateCharCount() { $("#charCount").textContent = `${$("#codeEditor").value.length} characters`; }
$("#codeEditor").addEventListener("input", updateCharCount);
$("#copyCode").addEventListener("click", async () => { await copyText($("#codeEditor").value); toast("Code copied to clipboard"); });
$("#clearCode").addEventListener("click", () => { $("#codeEditor").value = ""; updateCharCount(); });
$("#downloadCode").addEventListener("click", () => {
  const item = languages.find(lang => lang[0] === selectedLanguage);
  const blob = new Blob([$("#codeEditor").value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = item[2]; a.click();
  URL.revokeObjectURL(url);
  toast(`Downloaded ${item[2]}`);
});
$("#sendEditorToAI").addEventListener("click", () => {
  $("#modeSelect").value = "review";
  $("#messageInput").value = `Review this ${selectedLanguage} code. Explain issues and provide improvements:\n\n${$("#codeEditor").value}`;
  showPage("ai");
  $("#messageInput").focus();
});

const tools = [
  ["✳", "AI Code Generator", "Generate functions, components and complete code files.", "code", "Generate code for this requirement: "],
  ["⌕", "Bug Analyzer", "Find likely causes of errors and suggest fixes.", "debug", "Debug this code or error. Identify the root cause and provide a fix:\n"],
  ["▧", "UI Architect", "Plan modern responsive interfaces and components.", "build", "Act as a UI architect. Design a responsive interface for: "],
  ["▤", "File Planner", "Create clean project folders and file responsibilities.", "build", "Create a project file structure for: "],
  ["↗", "Performance Analyzer", "Review bottlenecks and optimization opportunities.", "optimize", "Analyze performance and suggest improvements for: "],
  ["▣", "Documentation Writer", "Create setup guides, READMEs and API documentation.", "docs", "Write professional documentation for: "]
];
tools.forEach(([icon, title, description, mode, prompt]) => {
  const card = document.createElement("article");
  card.className = "tool-card";
  const symbol = document.createElement("div"); symbol.className = "tool-icon"; symbol.textContent = icon;
  const heading = document.createElement("h3"); heading.textContent = title;
  const desc = document.createElement("p"); desc.textContent = description;
  const button = document.createElement("button"); button.className = "btn ghost"; button.textContent = "OPEN WORKFLOW ↗";
  button.addEventListener("click", () => { $("#modeSelect").value = mode; $("#messageInput").value = prompt; showPage("ai"); $("#messageInput").focus(); });
  card.append(symbol, heading, desc, button);
  $("#toolGrid").append(card);
});

function addMessage(role, text) {
  const welcome = $(".welcome-message", $("#chatMessages"));
  if (welcome) welcome.remove();
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "assistant" ? "W" : "YOU";
  const body = document.createElement("div");
  body.className = "message-body";
  const name = document.createElement("div");
  name.className = "message-name";
  name.textContent = role === "assistant" ? "WHIT3KID AI" : "YOU";
  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = text;
  body.append(name, content);
  row.append(avatar, body);
  $("#chatMessages").append(row);
  $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
  return content;
}

async function sendMessage() {
  const input = $("#messageInput");
  const message = input.value.trim();
  if (!message) return;
  const button = $("#sendButton");
  const mode = $("#modeSelect").value;
  const provider = $("#providerSelect").value;
  input.value = "";
  addMessage("user", message);
  const loading = addMessage("assistant", "Thinking… contacting AI provider.");
  button.disabled = true;
  button.textContent = "THINKING...";
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: chatHistory, mode, provider })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AI request failed");
    loading.textContent = data.answer;
    $("#chatProviderLabel").textContent = `Answered by ${data.provider}`;
    chatHistory.push({ role: "user", content: message }, { role: "assistant", content: data.answer });
    chatHistory = chatHistory.slice(-16);
  } catch (error) {
    loading.textContent = `ERROR: ${error.message}`;
    toast("AI request failed — check provider setup");
  } finally {
    button.disabled = false;
    button.innerHTML = 'SEND MESSAGE <span>↑</span>';
    $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
  }
}
$("#sendButton").addEventListener("click", sendMessage);
$("#messageInput").addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); }
});
$$(".suggestions button").forEach(button => button.addEventListener("click", () => {
  $("#messageInput").value = button.dataset.prompt;
  $("#messageInput").focus();
}));
$("#clearChat").addEventListener("click", () => {
  chatHistory = [];
  $("#chatMessages").innerHTML = '<div class="welcome-message"><div class="ai-avatar">W</div><h2>Session cleared</h2><p>Your in-browser conversation history has been reset.</p></div>';
  $("#chatProviderLabel").textContent = "Auto provider";
  toast("Chat session cleared");
});
$("#resetSession").addEventListener("click", () => $("#clearChat").click());
$$(".swatches button").forEach(button => button.addEventListener("click", () => {
  document.documentElement.style.setProperty("--red", button.dataset.color);
  document.documentElement.style.setProperty("--glow", `${button.dataset.color}2b`);
  toast("Accent updated");
}));
loadStatus();
  
