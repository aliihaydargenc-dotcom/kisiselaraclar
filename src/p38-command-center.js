import { categories, tools } from "./catalog.js";

const NOTES_KEY = "kisiselaraclar:p16:notes";
const TASKS_KEY = "kisiselaraclar:p16:tasks";
const RECENT_KEY = "kisiselaraclar:recent-tools";
const LOCAL_CHANGE = "kisiselaraclar:local-change";
const REMOTE_CHANGE = "kisiselaraclar:remote-change";
const NAVIGATE = "kisiselaraclar:navigate-tool";
const categoryNames = new Map(categories.map((item) => [item.id, item.label]));

let root = null;
let input = null;
let resultsNode = null;
let metaNode = null;
let activeIndex = 0;
let currentResults = [];
let previouslyFocused = null;

function storage() {
  try { return globalThis.localStorage; } catch { return null; }
}

function parseArray(key) {
  try {
    const value = JSON.parse(storage()?.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ı", "i")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value, max = 72) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
}

function writeArray(key, value) {
  const target = storage();
  if (!target?.setItem) return false;
  try {
    target.setItem(key, JSON.stringify(value));
    globalThis.dispatchEvent(new CustomEvent(LOCAL_CHANGE, { detail: { key } }));
    globalThis.dispatchEvent(new CustomEvent(REMOTE_CHANGE, { detail: { key, source: "command-center" } }));
    return true;
  } catch {
    return false;
  }
}

function toolSearchText(tool) {
  return normalize([
    tool.title,
    tool.description,
    categoryNames.get(tool.category),
    ...(Array.isArray(tool.aliases) ? tool.aliases : [])
  ].join(" "));
}

function queryTokens(query) {
  return normalize(query).split(" ").filter(Boolean);
}

function scoreText(text, tokens, title = "") {
  const haystack = normalize(text);
  const heading = normalize(title);
  if (!tokens.length || !tokens.every((token) => haystack.includes(token))) return -1;
  let score = 0;
  for (const token of tokens) {
    if (heading === token) score += 18;
    else if (heading.startsWith(token)) score += 10;
    else if (heading.includes(token)) score += 6;
    else score += 2;
  }
  return score;
}

function recentTools(limit = 5) {
  try {
    const ids = JSON.parse(storage()?.getItem(RECENT_KEY) || "[]");
    if (!Array.isArray(ids)) return [];
    return ids.map((id) => tools.find((tool) => tool.id === id)).filter(Boolean).slice(0, limit);
  } catch {
    return [];
  }
}

function commandFrom(query) {
  const raw = String(query || "").trim();
  const match = raw.match(/^(not|note|g[oö]rev|task)\s*:\s*(.+)$/i);
  if (!match) return null;
  const normalizedCommand = normalize(match[1]);
  return {
    type: normalizedCommand === "not" || normalizedCommand === "note" ? "create-note" : "create-task",
    value: match[2].trim()
  };
}

function searchableResults(query) {
  const tokens = queryTokens(query);
  const command = commandFrom(query);
  const output = [];

  if (command?.value) {
    output.push({
      type: command.type,
      id: `command:${command.type}`,
      title: command.type === "create-note" ? "Notu şimdi kaydet" : "Görevi bugün için oluştur",
      detail: compact(command.value, 110),
      badge: "Hızlı işlem",
      value: command.value,
      score: 1000
    });
  }

  for (const tool of tools) {
    const score = scoreText(toolSearchText(tool), tokens, tool.title);
    if (score < 0) continue;
    output.push({
      type: "tool",
      id: `tool:${tool.id}`,
      toolId: tool.id,
      title: tool.title,
      detail: compact(tool.description, 96),
      badge: categoryNames.get(tool.category) || "Araç",
      score: score + 20
    });
  }

  for (const note of parseArray(NOTES_KEY)) {
    if (!note || typeof note !== "object") continue;
    const title = String(note.title || "").trim() || compact(note.text, 48) || "Adsız not";
    const score = scoreText(`${note.title || ""} ${note.text || ""}`, tokens, title);
    if (score < 0) continue;
    output.push({
      type: "note",
      id: `note:${note.id || title}`,
      itemId: String(note.id || ""),
      title,
      detail: compact(note.text || "Not", 96),
      badge: "Not",
      score: score + 14 + Math.min(4, Number(note.updatedAt || 0) / 1e13)
    });
  }

  for (const task of parseArray(TASKS_KEY)) {
    if (!task || typeof task !== "object") continue;
    const title = String(task.title || "").trim();
    if (!title) continue;
    const score = scoreText(title, tokens, title);
    if (score < 0) continue;
    output.push({
      type: "task",
      id: `task:${task.id || title}`,
      itemId: String(task.id || ""),
      title,
      detail: task.done ? "Tamamlandı" : [task.date === today() ? "Bugün" : task.date, task.time].filter(Boolean).join(" · ") || "Açık görev",
      badge: task.done ? "Tamamlanan" : "Görev",
      score: score + (task.done ? 4 : 12)
    });
  }

  return output.sort((a, b) => b.score - a.score).slice(0, 12);
}

function defaultResults() {
  const quick = [
    { type: "tool", id: "quick-note", toolId: "quick-note", title: "Yeni not", detail: "Boş bir not aç", badge: "Hızlı", score: 50, action: "new-note" },
    { type: "tool", id: "quick-task", toolId: "tasks-calendar", title: "Yeni görev", detail: "Bugün için görev ekle", badge: "Hızlı", score: 49, action: "new-task" },
    { type: "tool", id: "quick-voice", toolId: "voice-note", title: "Sesli yaz", detail: "Mikrofonla metin yakala", badge: "Hızlı", score: 48 }
  ];
  const seen = new Set(quick.map((item) => item.toolId));
  for (const tool of recentTools(5)) {
    if (seen.has(tool.id)) continue;
    quick.push({
      type: "tool",
      id: `recent:${tool.id}`,
      toolId: tool.id,
      title: tool.title,
      detail: compact(tool.description, 88),
      badge: "Son kullanılan",
      score: 30
    });
    seen.add(tool.id);
  }
  return quick;
}

function iconFor(result) {
  if (result.type === "note" || result.type === "create-note") return "✎";
  if (result.type === "task" || result.type === "create-task") return "✓";
  return "↗";
}

function render() {
  if (!input || !resultsNode) return;
  const query = input.value.trim();
  currentResults = query ? searchableResults(query) : defaultResults();
  activeIndex = Math.max(0, Math.min(activeIndex, currentResults.length - 1));
  metaNode.textContent = query
    ? `${currentResults.length} sonuç · araçlar, notlar ve görevler birlikte aranıyor`
    : "Araç aç, not bul veya komut yaz";

  if (!currentResults.length) {
    resultsNode.innerHTML = `
      <div class="p38-empty">
        <strong>Sonuç yok.</strong>
        <span>Yeni not için <kbd>not:</kbd>, görev için <kbd>görev:</kbd> yazabilirsin.</span>
      </div>`;
    return;
  }

  resultsNode.innerHTML = currentResults.map((result, index) => `
    <button type="button" class="p38-result ${index === activeIndex ? "is-active" : ""}" data-p38-index="${index}" role="option" aria-selected="${index === activeIndex ? "true" : "false"}">
      <span class="p38-result-icon" aria-hidden="true">${iconFor(result)}</span>
      <span class="p38-result-copy">
        <strong>${escapeHtml(result.title)}</strong>
        <small>${escapeHtml(result.detail)}</small>
      </span>
      <span class="p38-badge">${escapeHtml(result.badge)}</span>
    </button>
  `).join("");
}

function navigate(toolId, action = "") {
  globalThis.dispatchEvent(new CustomEvent(NAVIGATE, { detail: { id: toolId, action } }));
}

function createNote(value) {
  const notes = parseArray(NOTES_KEY);
  notes.unshift({
    id: makeId("note"),
    title: compact(value, 46),
    text: value,
    kind: "written",
    pinned: false,
    completed: false,
    noteDate: today(),
    updatedAt: Date.now()
  });
  return writeArray(NOTES_KEY, notes);
}

function createTask(value) {
  const tasks = parseArray(TASKS_KEY);
  const now = Date.now();
  tasks.push({
    id: makeId("task"),
    title: value,
    date: today(),
    time: "",
    done: false,
    createdAt: now,
    updatedAt: now
  });
  return writeArray(TASKS_KEY, tasks);
}

function flash(message, tone = "ok") {
  const status = root?.querySelector("[data-p38-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
  clearTimeout(Number(status.dataset.timer || 0));
  const timer = setTimeout(() => {
    status.textContent = "";
    status.dataset.tone = "";
  }, 1700);
  status.dataset.timer = String(timer);
}

function activate(result = currentResults[activeIndex]) {
  if (!result) return;
  if (result.type === "create-note") {
    if (createNote(result.value)) {
      input.value = "";
      render();
      flash("Not kaydedildi");
    } else flash("Not kaydedilemedi", "error");
    return;
  }
  if (result.type === "create-task") {
    if (createTask(result.value)) {
      input.value = "";
      render();
      flash("Görev bugüne eklendi");
    } else flash("Görev kaydedilemedi", "error");
    return;
  }
  if (result.type === "note") {
    close();
    navigate("quick-note", result.itemId ? `note:${result.itemId}` : "");
    return;
  }
  if (result.type === "task") {
    close();
    navigate("tasks-calendar");
    return;
  }
  if (result.type === "tool") {
    close();
    navigate(result.toolId, result.action || "");
  }
}

function setActive(index) {
  if (!currentResults.length) return;
  activeIndex = (index + currentResults.length) % currentResults.length;
  resultsNode.querySelectorAll("[data-p38-index]").forEach((node, itemIndex) => {
    const active = itemIndex === activeIndex;
    node.classList.toggle("is-active", active);
    node.setAttribute("aria-selected", active ? "true" : "false");
    if (active) node.scrollIntoView({ block: "nearest" });
  });
}

function open(seed = "") {
  ensure();
  previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  root.hidden = false;
  document.body.classList.add("p38-command-open");
  input.value = seed;
  activeIndex = 0;
  render();
  requestAnimationFrame(() => {
    input.focus({ preventScroll: true });
    input.select();
  });
}

function close() {
  if (!root || root.hidden) return;
  root.hidden = true;
  document.body.classList.remove("p38-command-open");
  previouslyFocused?.focus?.({ preventScroll: true });
  previouslyFocused = null;
}

function ensure() {
  if (root?.isConnected) return root;
  root = document.createElement("section");
  root.id = "p38CommandCenter";
  root.className = "p38-command";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "p38CommandTitle");
  root.innerHTML = `
    <button class="p38-backdrop" type="button" data-p38-close aria-label="Komut merkezini kapat"></button>
    <div class="p38-panel">
      <header class="p38-head">
        <div>
          <span>COMMAND CENTER</span>
          <h2 id="p38CommandTitle">Ne yapmak istiyorsun?</h2>
        </div>
        <button type="button" class="p38-close" data-p38-close aria-label="Kapat">×</button>
      </header>
      <label class="p38-search">
        <span aria-hidden="true">⌕</span>
        <input type="text" data-p38-input autocomplete="off" spellcheck="false" placeholder="Ara veya ‘not: …’ / ‘görev: …’ yaz" aria-label="Araç, not ve görev ara" aria-controls="p38CommandResults" />
        <kbd>ESC</kbd>
      </label>
      <div class="p38-meta" data-p38-meta></div>
      <div class="p38-results" id="p38CommandResults" data-p38-results role="listbox"></div>
      <footer class="p38-foot">
        <div><kbd>↑</kbd><kbd>↓</kbd><span>gez</span><kbd>↵</kbd><span>aç / çalıştır</span></div>
        <span data-p38-status aria-live="polite"></span>
      </footer>
    </div>`;
  document.body.append(root);
  input = root.querySelector("[data-p38-input]");
  resultsNode = root.querySelector("[data-p38-results]");
  metaNode = root.querySelector("[data-p38-meta]");

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-p38-close]")) return close();
    const resultButton = event.target.closest("[data-p38-index]");
    if (!resultButton) return;
    activeIndex = Number(resultButton.dataset.p38Index || 0);
    activate();
  });

  input.addEventListener("input", () => {
    activeIndex = 0;
    render();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      activate();
    }
  });
  return root;
}

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase("tr-TR") === "k") {
    event.preventDefault();
    root && !root.hidden ? close() : open();
    return;
  }
  if (event.key === "Escape" && root && !root.hidden) {
    event.preventDefault();
    close();
  }
}, true);

document.addEventListener("click", (event) => {
  const commandTrigger = event.target.closest("#headerSearchButton,.p37-dock-add,[data-mobile-action='search']");
  if (!commandTrigger) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  open();
}, true);

globalThis.addEventListener("kisiselaraclar:open-command", (event) => open(String(event.detail?.query || "")));
