import { ensurePrivateSession } from "./appwrite-cloud.js";

const NOTES_KEY = "kisiselaraclar:p16:notes";
const TASKS_KEY = "kisiselaraclar:p16:tasks";
const CHANGE_EVENT = "kisiselaraclar:local-change";
const REMOTE_EVENT = "kisiselaraclar:remote-change";

const state = {
  view: "today",
  selectedDate: localDate(),
  activeNoteId: "",
  noteSearch: "",
  searchQuery: "",
  mobileEditor: false,
  calendarCursor: monthStart(new Date())
};

const app = document.querySelector("#app");
let viewRoot = null;
let noteSaveTimer = 0;
let dailySaveTimer = 0;

const icons = {
  today: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.8 12 4l8 6.8v8.7a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5z"/><path d="M9 20v-6h6v6"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.8h9l3 3V20H6z"/><path d="M15 4v4h4M9 12h6M9 16h5"/></svg>`,
  tasks: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>`,
  search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.8"/><path d="m15 15 5 5"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3v5M16 3v5M4 10h16"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 6 0 .8 5 2.2 2.2v1.6H6v-1.6L8.2 9zM12 13v7"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>`
};

function localDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateFromKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function shiftDate(value, amount) {
  const date = dateFromKey(value);
  date.setDate(date.getDate() + Number(amount || 0));
  return localDate(date);
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
}

function storage() {
  try { return globalThis.localStorage; } catch { return null; }
}

function readArray(key) {
  try {
    const parsed = JSON.parse(storage()?.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray(key, value) {
  const target = storage();
  if (!target?.setItem) return false;
  try {
    target.setItem(key, JSON.stringify(value));
    globalThis.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
    return true;
  } catch {
    return false;
  }
}

function notes() {
  return readArray(NOTES_KEY)
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const updatedAt = Number(item.updatedAt) || Date.now();
      return {
        ...item,
        id: String(item.id || uid("note")),
        title: String(item.title || ""),
        text: String(item.text || ""),
        type: item.type === "daily" ? "daily" : "note",
        tags: Array.isArray(item.tags) ? item.tags.map(String).filter(Boolean) : [],
        pinned: Boolean(item.pinned),
        completed: Boolean(item.completed),
        noteDate: /^\d{4}-\d{2}-\d{2}$/.test(String(item.noteDate || "")) ? String(item.noteDate) : localDate(new Date(updatedAt)),
        createdAt: Number(item.createdAt) || updatedAt,
        updatedAt
      };
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

function tasks() {
  return readArray(TASKS_KEY)
    .filter((item) => item && String(item.title || "").trim())
    .map((item) => {
      const done = Boolean(item.done);
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || "")) ? String(item.date) : "";
      return {
        ...item,
        id: String(item.id || uid("task")),
        title: String(item.title || "").trim(),
        notes: String(item.notes || ""),
        date,
        time: /^\d{2}:\d{2}$/.test(String(item.time || "")) ? String(item.time) : "",
        lane: done ? "done" : ["inbox", "today", "doing"].includes(item.lane) ? item.lane : (date === localDate() ? "today" : "inbox"),
        done,
        createdAt: Number(item.createdAt) || Date.now(),
        updatedAt: Number(item.updatedAt) || Number(item.createdAt) || Date.now()
      };
    })
    .sort((a, b) => Number(a.done) - Number(b.done) || `${a.date || "9999-99-99"} ${a.time || "99:99"}`.localeCompare(`${b.date || "9999-99-99"} ${b.time || "99:99"}`, "tr"));
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compact(value, max = 110) {
  const text = String(value || "")
    .replace(/[*_#>`~[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function prettyDate(value = state.selectedDate) {
  try {
    return new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(dateFromKey(value));
  } catch {
    return value;
  }
}

function shortDate(value) {
  if (!value) return "Tarihsiz";
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(dateFromKey(value));
  } catch {
    return value;
  }
}

function clock(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(Number(value)));
  } catch {
    return "";
  }
}

function relativeDate(value) {
  if (!value) return "Inbox";
  if (value === localDate()) return "Bugün";
  if (value === shiftDate(localDate(), 1)) return "Yarın";
  return shortDate(value);
}

function wordCount(value) {
  const match = String(value || "").trim().match(/\S+/g);
  return match?.length || 0;
}

function parseTags(value) {
  return [...new Set(String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 12))];
}

function tagCloud() {
  const counts = new Map();
  notes().forEach((note) => note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr")).slice(0, 7);
}

function ensureDaily(date) {
  const all = notes();
  let item = all.find((note) => note.type === "daily" && note.noteDate === date);
  if (item) return item;
  item = {
    id: uid("daily"),
    title: prettyDate(date),
    text: "",
    type: "daily",
    tags: ["günlük"],
    pinned: false,
    completed: false,
    noteDate: date,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  all.unshift(item);
  writeArray(NOTES_KEY, all);
  return item;
}

function saveNote(id, patch) {
  const all = notes();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return false;
  all[index] = { ...all[index], ...patch, updatedAt: Date.now() };
  return writeArray(NOTES_KEY, all);
}

function createNote() {
  flushPendingSaves();
  const all = notes();
  const item = {
    id: uid("note"),
    title: "",
    text: "",
    type: "note",
    tags: [],
    pinned: false,
    completed: false,
    noteDate: localDate(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  all.unshift(item);
  writeArray(NOTES_KEY, all);
  state.activeNoteId = item.id;
  state.view = "notes";
  state.mobileEditor = true;
  render();
  requestAnimationFrame(() => document.querySelector("#noteTitle")?.focus());
}

function deleteNote(id) {
  const remaining = notes().filter((item) => item.id !== id);
  writeArray(NOTES_KEY, remaining);
  state.activeNoteId = remaining.find((item) => item.type !== "daily")?.id || "";
  state.mobileEditor = false;
  render();
}

function createTask(title, date = "", time = "") {
  const value = String(title || "").trim();
  if (!value) return false;
  const all = tasks();
  const now = Date.now();
  all.push({
    id: uid("task"),
    title: value,
    notes: "",
    date,
    time,
    lane: date === localDate() ? "today" : "inbox",
    done: false,
    createdAt: now,
    updatedAt: now
  });
  return writeArray(TASKS_KEY, all);
}

function updateTask(id, patch) {
  const all = tasks();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return false;
  const next = { ...all[index], ...patch, updatedAt: Date.now() };
  if (next.done) next.lane = "done";
  if (!next.done && next.lane === "done") next.lane = next.date === localDate() ? "today" : "inbox";
  all[index] = next;
  return writeArray(TASKS_KEY, all);
}

function isMobile() {
  return globalThis.matchMedia?.("(max-width: 760px)")?.matches ?? false;
}

function navButton(view, label, icon, extra = "") {
  return `<button type="button" data-view="${view}" class="${state.view === view ? "active" : ""}">${icon}<span>${label}</span>${extra}</button>`;
}

function mountShell() {
  app.innerHTML = `
    <div class="calm-shell">
      <aside class="app-sidebar" aria-label="Ana navigasyon">
        <a class="brand" href="#" data-view="today" aria-label="Bugün">
          <span class="brand-leaf">◒</span>
          <span><strong>Notlar</strong><small>kişisel çalışma alanı</small></span>
        </a>
        <button class="new-note-button" type="button" data-create-note>${icons.plus}<span>Yeni not</span><kbd>⌘N</kbd></button>
        <nav class="desktop-nav">
          ${navButton("today", "Bugün", icons.today)}
          ${navButton("notes", "Notlar", icons.notes)}
          ${navButton("tasks", "Görevler", icons.tasks)}
          ${navButton("calendar", "Takvim", icons.calendar)}
          ${navButton("search", "Ara", icons.search)}
        </nav>
        <section class="sidebar-library">
          <header><span>ETİKETLER</span></header>
          <div id="sidebarTags"></div>
        </section>
        <div class="sidebar-spacer"></div>
        <nav class="site-nav" aria-label="Senkron ve oturum"></nav>
      </aside>
      <main class="app-main">
        <header class="mobile-header">
          <button class="mobile-brand" type="button" data-view="today"><span class="brand-leaf">◒</span><strong>Notlar</strong></button>
          <div>
            <button type="button" data-view="search" aria-label="Ara">${icons.search}</button>
            <button class="mobile-create" type="button" data-create-note aria-label="Yeni not">${icons.plus}</button>
          </div>
        </header>
        <div id="workspaceView"></div>
      </main>
      <nav class="mobile-nav" aria-label="Mobil navigasyon">
        ${navButton("today", "Bugün", icons.today)}
        ${navButton("notes", "Notlar", icons.notes)}
        ${navButton("tasks", "Görevler", icons.tasks)}
        ${navButton("search", "Ara", icons.search)}
      </nav>
    </div>`;
  viewRoot = document.querySelector("#workspaceView");
  installEvents();
}

function refreshSidebar() {
  const node = document.querySelector("#sidebarTags");
  if (!node) return;
  node.innerHTML = tagCloud().map(([tag, count], index) => `
    <button type="button" data-tag="${esc(tag)}"><i style="--tag-index:${index}"></i><span>${esc(tag)}</span><small>${count}</small></button>
  `).join("") || `<span class="sidebar-empty">Henüz etiket yok.</span>`;
}

function updateNav() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    if (button.closest(".brand")) return;
    button.classList.toggle("active", button.dataset.view === state.view);
  });
}

function taskRow(task, compactMode = false) {
  return `<article class="task-row ${task.done ? "done" : ""}">
    <button class="task-check" type="button" data-toggle-task="${esc(task.id)}" aria-label="${task.done ? "Görevi yeniden aç" : "Görevi tamamla"}">${task.done ? "✓" : ""}</button>
    <div class="task-copy">
      <strong>${esc(task.title)}</strong>
      ${compactMode ? "" : `<small>${esc(relativeDate(task.date))}${task.time ? ` · ${esc(task.time)}` : ""}</small>`}
    </div>
    ${task.time ? `<time>${esc(task.time)}</time>` : ""}
  </article>`;
}

function weekStrip() {
  const center = dateFromKey(state.selectedDate);
  const day = center.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(center);
  monday.setDate(center.getDate() + mondayOffset);
  const labels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  return `<div class="week-strip" role="group" aria-label="Haftanın günleri">
    ${labels.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = localDate(date);
      return `<button type="button" data-set-date="${key}" class="${key === state.selectedDate ? "active" : ""}">
        <span>${label}</span><strong>${date.getDate()}</strong>
      </button>`;
    }).join("")}
  </div>`;
}

function noteCard(note, active = false) {
  const preview = compact(note.text, 92) || "Henüz içerik yok.";
  return `<button class="note-card ${active ? "active" : ""}" type="button" data-open-note="${esc(note.id)}">
    <span class="note-card-main">
      <strong>${note.pinned ? `<span class="pin-mark">◆</span>` : ""}${esc(note.title || "Adsız not")}</strong>
      <time>${esc(shortDate(note.noteDate))}</time>
    </span>
    <p>${esc(preview)}</p>
    <footer>
      ${note.tags.slice(0, 3).map((tag) => `<span>${esc(tag)}</span>`).join("")}
      <small>${clock(note.updatedAt)}</small>
    </footer>
  </button>`;
}

function todayView() {
  const daily = ensureDaily(state.selectedDate);
  const allTasks = tasks();
  const dayTasks = allTasks.filter((item) => item.date === state.selectedDate && !item.done);
  const completed = allTasks.filter((item) => item.date === state.selectedDate && item.done);
  const total = dayTasks.length + completed.length;
  const progress = total ? Math.round((completed.length / total) * 100) : 0;
  const recent = notes().filter((item) => item.type !== "daily").slice(0, 5);

  return `<section class="view-shell today-view">
    <header class="editorial-heading">
      <div>
        <span class="eyebrow">BUGÜN</span>
        <h1>${state.selectedDate === localDate() ? "Bugün" : esc(shortDate(state.selectedDate))}</h1>
        <p>${esc(prettyDate(state.selectedDate))}</p>
      </div>
      <button class="quiet-button" type="button" data-view="calendar">${icons.calendar}<span>Takvim</span></button>
    </header>
    ${weekStrip()}
    <div class="today-grid">
      <section class="today-note">
        <header class="section-heading">
          <div><span>GÜNÜN NOTU</span><h2>Düşün, yaz, devam et.</h2></div>
          <div class="save-stack"><small id="dailySaveState">Otomatik kayıt</small><small id="dailyStats">${wordCount(daily.text)} kelime</small></div>
        </header>
        <textarea id="dailyEditor" aria-label="Günün notu" placeholder="Bugün aklında ne var?">${esc(daily.text)}</textarea>
      </section>
      <aside class="today-tasks">
        <header class="section-heading compact">
          <div><span>PLAN</span><h2>Bugünün görevleri</h2></div>
          <strong>${completed.length}/${total || 0}</strong>
        </header>
        <div class="progress-track"><i style="width:${progress}%"></i></div>
        <form class="quick-task" id="todayTaskForm">
          <input id="todayTaskInput" autocomplete="off" placeholder="Yeni görev…">
          <button aria-label="Görev ekle">${icons.plus}</button>
        </form>
        <div class="today-task-list">${dayTasks.map((task) => taskRow(task)).join("") || `<div class="empty-state">Bugün için açık görev yok.</div>`}</div>
        ${completed.length ? `<details class="completed-details"><summary>Tamamlananlar <span>${completed.length}</span></summary>${completed.map((task) => taskRow(task, true)).join("")}</details>` : ""}
      </aside>
      <section class="recent-notes">
        <header class="section-heading compact"><div><span>YAKINDA</span><h2>Son notlar</h2></div><button class="text-link" type="button" data-view="notes">Tümünü gör →</button></header>
        <div class="recent-list">${recent.map((note) => noteCard(note)).join("") || `<div class="empty-state">Henüz not yok.</div>`}</div>
      </section>
    </div>
  </section>`;
}

function filteredNotes() {
  const query = state.noteSearch.trim().toLocaleLowerCase("tr-TR");
  return notes().filter((item) => {
    if (item.type === "daily") return false;
    if (!query) return true;
    return `${item.title} ${item.text} ${item.tags.join(" ")}`.toLocaleLowerCase("tr-TR").includes(query);
  });
}

function activeNote(list = filteredNotes()) {
  let note = notes().find((item) => item.id === state.activeNoteId && item.type !== "daily");
  if (!note) note = list[0] || notes().find((item) => item.type !== "daily") || null;
  if (note) state.activeNoteId = note.id;
  return note;
}

function noteToolbar() {
  return `<div class="editor-toolbar" role="toolbar" aria-label="Not biçimlendirme">
    <button type="button" data-format="h2" title="Alt başlık">Aa</button>
    <span></span>
    <button type="button" data-format="bold" title="Kalın"><b>B</b></button>
    <button type="button" data-format="italic" title="İtalik"><i>I</i></button>
    <button type="button" data-format="bullet" title="Madde">•≡</button>
    <button type="button" data-format="number" title="Numaralı liste">1≡</button>
    <button type="button" data-format="check" title="Kontrol listesi">☐</button>
    <button type="button" data-format="link" title="Bağlantı">↗</button>
  </div>`;
}

function noteEditor(note) {
  if (!note) {
    return `<section class="editor-sheet empty-editor"><div><span class="empty-symbol">✦</span><h2>Bir not seç.</h2><p>Ya da yeni bir düşünce için temiz bir sayfa aç.</p><button class="primary-button" type="button" data-create-note>Yeni not</button></div></section>`;
  }
  return `<section class="editor-sheet">
    <div class="mobile-editor-bar">
      <button type="button" data-back-notes aria-label="Not listesine dön">${icons.back}<span>Notlar</span></button>
      <span id="mobileSaveState">Kaydedildi</span>
      <button type="button" data-pin-note="${esc(note.id)}" class="${note.pinned ? "active" : ""}" aria-label="Sabitle">${icons.pin}</button>
    </div>
    <div class="editor-topline">
      <div><span id="noteSaveState">Kaydedildi · ${esc(clock(note.updatedAt))}</span></div>
      <div>
        <button type="button" data-pin-note="${esc(note.id)}" class="${note.pinned ? "active" : ""}">${icons.pin}<span>${note.pinned ? "Sabit" : "Sabitle"}</span></button>
        <button type="button" data-delete-note="${esc(note.id)}">•••</button>
      </div>
    </div>
    <textarea id="noteTitle" class="note-title" rows="1" placeholder="Başlık">${esc(note.title)}</textarea>
    <div class="tag-line">
      <input id="noteTags" value="${esc(note.tags.join(", "))}" aria-label="Etiketler" placeholder="Etiket ekle…">
      <input id="noteDate" type="date" value="${esc(note.noteDate)}" aria-label="Not tarihi">
    </div>
    ${noteToolbar()}
    <textarea id="noteText" class="note-text" spellcheck="true" placeholder="Yazmaya başla…">${esc(note.text)}</textarea>
    <footer class="editor-footer">
      <span><i></i> Otomatik kayıt açık</span>
      <div><small id="noteWordCount">${wordCount(note.text)} kelime</small><button type="button" data-note-to-task="${esc(note.id)}">Göreve dönüştür</button></div>
    </footer>
  </section>`;
}

function noteContext(note) {
  if (!note) return `<aside class="note-context"></aside>`;
  const allTasks = tasks();
  const dayTasks = allTasks.filter((task) => !task.done && task.date === localDate()).slice(0, 6);
  return `<aside class="note-context">
    <section>
      <header><span>BUGÜNÜN GÖREVLERİ</span><strong>${dayTasks.length}</strong></header>
      <div class="context-progress"><i style="width:${Math.min(100, dayTasks.length * 16)}%"></i></div>
      <div>${dayTasks.map((task) => taskRow(task, true)).join("") || `<p class="context-empty">Açık görev yok.</p>`}</div>
      <button class="text-link" type="button" data-view="tasks">Tüm görevleri gör →</button>
    </section>
    <section class="note-details">
      <header><span>DETAYLAR</span></header>
      <dl>
        <div><dt>Tarih</dt><dd>${esc(shortDate(note.noteDate))}</dd></div>
        <div><dt>Kelime</dt><dd>${wordCount(note.text)}</dd></div>
        <div><dt>Son düzenleme</dt><dd>${esc(clock(note.updatedAt))}</dd></div>
      </dl>
    </section>
    <section>
      <header><span>ETİKETLER</span></header>
      <div class="context-tags">${note.tags.map((tag) => `<button type="button" data-tag="${esc(tag)}">${esc(tag)}</button>`).join("") || `<p class="context-empty">Etiket yok.</p>`}</div>
    </section>
  </aside>`;
}

function notesListPanel(list, note) {
  return `<aside class="notes-list-column">
    <header class="notes-list-header">
      <div><span>NOT DEFTERİ</span><h1>Notlar</h1></div>
      <button type="button" data-create-note aria-label="Yeni not">${icons.plus}</button>
    </header>
    <label class="note-search">${icons.search}<input id="noteSearch" type="search" value="${esc(state.noteSearch)}" placeholder="Notlarda ara…" autocomplete="off"></label>
    <div class="notes-tabs"><button class="active" type="button">Tümü</button><button type="button" data-show-pinned>Sabitli</button><span>${list.length} not</span></div>
    <div id="noteList" class="note-list">${list.map((item) => noteCard(item, item.id === note?.id)).join("") || `<div class="empty-state">Aramana uygun not yok.</div>`}</div>
  </aside>`;
}

function notesView() {
  const list = filteredNotes();
  const note = activeNote(list);
  const mobileDetailClass = state.mobileEditor ? "mobile-detail" : "";
  return `<section class="view-shell notes-view ${mobileDetailClass}">
    <div class="notes-layout">
      ${notesListPanel(list, note)}
      ${noteEditor(note)}
      ${noteContext(note)}
    </div>
  </section>`;
}

function taskGroup(title, items, extraClass = "") {
  return `<section class="task-section ${extraClass}">
    <header><h2>${title}</h2><span>${items.length}</span></header>
    <div>${items.map((task) => taskRow(task)).join("") || `<div class="empty-state">Burada görev yok.</div>`}</div>
  </section>`;
}

function tasksView() {
  const all = tasks();
  const today = localDate();
  const open = all.filter((item) => !item.done);
  const todayItems = open.filter((item) => item.date === today);
  const overdue = open.filter((item) => item.date && item.date < today);
  const upcoming = open.filter((item) => item.date && item.date > today);
  const inbox = open.filter((item) => !item.date);
  const done = all.filter((item) => item.done).slice(0, 20);
  const todayTotal = todayItems.length + all.filter((item) => item.done && item.date === today).length;
  const todayDone = all.filter((item) => item.done && item.date === today).length;
  const pct = todayTotal ? Math.round(todayDone / todayTotal * 100) : 0;

  return `<section class="view-shell tasks-view">
    <header class="editorial-heading">
      <div><span class="eyebrow">PLAN</span><h1>Görevler</h1><p>Planla, odaklan, tamamla.</p></div>
      <button class="quiet-button" type="button" data-view="calendar">${icons.calendar}<span>Takvim</span></button>
    </header>
    <section class="task-progress-card"><div><span>Bugünün ilerlemesi</span><strong>${todayDone}/${todayTotal || 0} tamamlandı</strong></div><div class="progress-track"><i style="width:${pct}%"></i></div></section>
    <form class="task-composer" id="taskComposer">
      <input id="taskTitleInput" placeholder="Yeni görev…" autocomplete="off" required>
      <input id="taskDateInput" type="date" value="${today}">
      <input id="taskTimeInput" type="time">
      <button>Ekle</button>
    </form>
    <div class="task-sections">
      ${overdue.length ? taskGroup("Geciken", overdue, "overdue") : ""}
      ${taskGroup("Bugün", todayItems)}
      ${inbox.length ? taskGroup("Inbox", inbox) : ""}
      ${taskGroup("Yaklaşan", upcoming)}
      ${done.length ? taskGroup("Tamamlanan", done, "completed-section") : ""}
    </div>
  </section>`;
}

function searchResultsMarkup(query = state.searchQuery) {
  const q = String(query || "").trim().toLocaleLowerCase("tr-TR");
  const noteMatches = q ? notes().filter((item) => item.type !== "daily" && `${item.title} ${item.text} ${item.tags.join(" ")}`.toLocaleLowerCase("tr-TR").includes(q)).slice(0, 12) : [];
  const taskMatches = q ? tasks().filter((item) => `${item.title} ${item.notes}`.toLocaleLowerCase("tr-TR").includes(q)).slice(0, 12) : [];
  if (!q) return `<div class="search-empty"><span>⌕</span><h2>Ne arıyorsun?</h2><p>Notların, görevlerin ve etiketlerin aynı yerde.</p></div>`;
  return `<div class="search-results">
    <section>
      <header><h2>Notlar</h2><span>${noteMatches.length}</span></header>
      ${noteMatches.map((note) => noteCard(note)).join("") || `<div class="empty-state">Not bulunamadı.</div>`}
    </section>
    <section>
      <header><h2>Görevler</h2><span>${taskMatches.length}</span></header>
      ${taskMatches.map((task) => taskRow(task)).join("") || `<div class="empty-state">Görev bulunamadı.</div>`}
    </section>
  </div>`;
}

function searchView() {
  return `<section class="view-shell search-view">
    <header class="editorial-heading"><div><span class="eyebrow">ARAMA</span><h1>Ara</h1><p>Notların ve görevlerin arasında hızlıca dolaş.</p></div></header>
    <label class="global-search-box">${icons.search}<input id="searchInput" type="search" value="${esc(state.searchQuery)}" placeholder="Bir şey yaz…" autocomplete="off"><kbd>⌘K</kbd></label>
    <div class="search-filter-row"><button class="active" type="button">Tümü</button><button type="button" data-create-note>＋ Yeni not</button><button type="button" data-focus-task>＋ Yeni görev</button></div>
    <div id="searchResults">${searchResultsMarkup()}</div>
  </section>`;
}

function calendarCells() {
  const cursor = new Date(state.calendarCursor);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1, 12);
  const firstDay = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const lastDay = new Date(year, month + 1, 0, 12).getDate();
  const noteItems = notes();
  const taskItems = tasks();
  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(`<span class="calendar-blank"></span>`);
  for (let day = 1; day <= lastDay; day += 1) {
    const date = localDate(new Date(year, month, day, 12));
    const dayNotes = noteItems.filter((note) => note.noteDate === date).length;
    const dayTasks = taskItems.filter((task) => task.date === date).length;
    const selected = date === state.selectedDate;
    const current = date === localDate();
    cells.push(`<button type="button" data-set-date="${date}" class="${selected ? "selected " : ""}${current ? "today" : ""}">
      <strong>${day}</strong>
      <span>${dayTasks ? `<i>${dayTasks} görev</i>` : ""}${dayNotes ? `<i>${dayNotes} not</i>` : ""}</span>
    </button>`);
  }
  return cells.join("");
}

function calendarView() {
  const title = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(state.calendarCursor);
  const dayTasks = tasks().filter((task) => task.date === state.selectedDate);
  const dayNotes = notes().filter((note) => note.noteDate === state.selectedDate);
  return `<section class="view-shell calendar-view">
    <header class="editorial-heading calendar-heading">
      <div><span class="eyebrow">TAKVİM</span><h1>${esc(title)}</h1><p>Notların ve görevlerin zaman içinde.</p></div>
      <div class="calendar-controls"><button type="button" data-calendar-shift="-1">←</button><button type="button" data-calendar-today>Bugün</button><button type="button" data-calendar-shift="1">→</button></div>
    </header>
    <div class="calendar-layout">
      <section class="calendar-card">
        <div class="calendar-weekdays"><span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span></div>
        <div class="calendar-grid">${calendarCells()}</div>
      </section>
      <aside class="calendar-agenda">
        <header><span>SEÇİLİ GÜN</span><h2>${esc(shortDate(state.selectedDate))}</h2></header>
        <section><h3>Görevler</h3>${dayTasks.map((task) => taskRow(task)).join("") || `<div class="empty-state">Görev yok.</div>`}</section>
        <section><h3>Notlar</h3>${dayNotes.filter((note) => note.type !== "daily").map((note) => noteCard(note)).join("") || `<div class="empty-state">Not yok.</div>`}</section>
        <button class="primary-button" type="button" data-view="today">Bu güne git</button>
      </aside>
    </div>
  </section>`;
}

function autoGrowTitle() {
  const field = document.querySelector("#noteTitle");
  if (!field) return;
  field.style.height = "auto";
  field.style.height = `${Math.min(140, Math.max(66, field.scrollHeight))}px`;
}

function render() {
  if (!viewRoot) return;
  if (state.view !== "notes") state.mobileEditor = false;
  const html = state.view === "notes" ? notesView()
    : state.view === "tasks" ? tasksView()
      : state.view === "search" ? searchView()
        : state.view === "calendar" ? calendarView()
          : todayView();
  viewRoot.innerHTML = html;
  updateNav();
  refreshSidebar();
  requestAnimationFrame(() => {
    viewRoot.querySelector(".view-shell")?.classList.add("entered");
    autoGrowTitle();
  });
}

function applyFormat(action) {
  const field = document.querySelector("#noteText");
  if (!field) return;
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? start;
  const selected = field.value.slice(start, end);
  const lineStart = field.value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lineEndRaw = field.value.indexOf("\n", end);
  const lineEnd = lineEndRaw < 0 ? field.value.length : lineEndRaw;
  const wrap = (before, after = before, placeholder = "metin") => {
    const content = selected || placeholder;
    field.setRangeText(`${before}${content}${after}`, start, end, "end");
    field.focus();
  };
  if (action === "bold") wrap("**");
  else if (action === "italic") wrap("_");
  else if (action === "link") wrap("[", "](https://)", "bağlantı");
  else {
    const block = field.value.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const mapped = lines.map((line, index) => {
      const clean = line.replace(/^\s*(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/, "");
      if (action === "h2") return `## ${clean}`;
      if (action === "bullet") return `- ${clean}`;
      if (action === "number") return `${index + 1}. ${clean}`;
      if (action === "check") return `- [ ] ${clean}`;
      return line;
    }).join("\n");
    field.setRangeText(mapped, lineStart, lineEnd, "end");
    field.focus();
  }
  scheduleNoteSave();
  const count = document.querySelector("#noteWordCount");
  if (count) count.textContent = `${wordCount(field.value)} kelime`;
}

function scheduleNoteSave() {
  clearTimeout(noteSaveTimer);
  const status = document.querySelector("#noteSaveState");
  const mobileStatus = document.querySelector("#mobileSaveState");
  if (status) status.textContent = "Kaydediliyor…";
  if (mobileStatus) mobileStatus.textContent = "Kaydediliyor…";
  noteSaveTimer = setTimeout(flushNoteSave, 280);
}

function flushNoteSave() {
  clearTimeout(noteSaveTimer);
  noteSaveTimer = 0;
  const id = state.activeNoteId;
  const title = document.querySelector("#noteTitle");
  const text = document.querySelector("#noteText");
  const tags = document.querySelector("#noteTags");
  const date = document.querySelector("#noteDate");
  if (!id || !title || !text) return;
  const ok = saveNote(id, {
    title: title.value,
    text: text.value,
    tags: parseTags(tags?.value),
    noteDate: date?.value || localDate()
  });
  const label = ok ? `Kaydedildi · ${clock(Date.now())}` : "Kaydedilemedi";
  const status = document.querySelector("#noteSaveState");
  const mobileStatus = document.querySelector("#mobileSaveState");
  if (status) status.textContent = label;
  if (mobileStatus) mobileStatus.textContent = ok ? "Kaydedildi" : "Hata";
  const count = document.querySelector("#noteWordCount");
  if (count) count.textContent = `${wordCount(text.value)} kelime`;
  refreshSidebar();
}

function flushDailySave() {
  clearTimeout(dailySaveTimer);
  dailySaveTimer = 0;
  const field = document.querySelector("#dailyEditor");
  if (!field) return;
  const daily = ensureDaily(state.selectedDate);
  const ok = saveNote(daily.id, { text: field.value, title: prettyDate(state.selectedDate) });
  const status = document.querySelector("#dailySaveState");
  if (status) status.textContent = ok ? `Kaydedildi · ${clock(Date.now())}` : "Kaydedilemedi";
  const stats = document.querySelector("#dailyStats");
  if (stats) stats.textContent = `${wordCount(field.value)} kelime`;
}

function flushPendingSaves() {
  if (noteSaveTimer) flushNoteSave();
  if (dailySaveTimer) flushDailySave();
}

function scheduleDailySave() {
  clearTimeout(dailySaveTimer);
  const status = document.querySelector("#dailySaveState");
  if (status) status.textContent = "Kaydediliyor…";
  dailySaveTimer = setTimeout(flushDailySave, 280);
}

function refreshNoteList() {
  const list = document.querySelector("#noteList");
  if (!list) return;
  const values = filteredNotes();
  const note = activeNote(values);
  list.innerHTML = values.map((item) => noteCard(item, item.id === note?.id)).join("") || `<div class="empty-state">Aramana uygun not yok.</div>`;
}

function refreshSearchResults() {
  const target = document.querySelector("#searchResults");
  if (target) target.innerHTML = searchResultsMarkup();
}

function installEvents() {
  app.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      event.preventDefault();
      flushPendingSaves();
      state.view = viewButton.dataset.view;
      state.mobileEditor = false;
      render();
      if (state.view === "search") requestAnimationFrame(() => document.querySelector("#searchInput")?.focus());
      return;
    }

    if (event.target.closest("[data-create-note]")) {
      createNote();
      return;
    }

    const noteButton = event.target.closest("[data-open-note]");
    if (noteButton) {
      flushPendingSaves();
      state.activeNoteId = noteButton.dataset.openNote;
      state.view = "notes";
      state.mobileEditor = isMobile();
      render();
      return;
    }

    if (event.target.closest("[data-back-notes]")) {
      flushPendingSaves();
      state.mobileEditor = false;
      render();
      return;
    }

    const pin = event.target.closest("[data-pin-note]");
    if (pin) {
      flushPendingSaves();
      const note = notes().find((item) => item.id === pin.dataset.pinNote);
      if (note) {
        saveNote(note.id, { pinned: !note.pinned });
        render();
      }
      return;
    }

    const remove = event.target.closest("[data-delete-note]");
    if (remove) {
      if (globalThis.confirm?.("Bu not silinsin mi?") !== false) deleteNote(remove.dataset.deleteNote);
      return;
    }

    const toggle = event.target.closest("[data-toggle-task]");
    if (toggle) {
      flushPendingSaves();
      const task = tasks().find((item) => item.id === toggle.dataset.toggleTask);
      if (task) {
        updateTask(task.id, { done: !task.done });
        render();
      }
      return;
    }

    const setDate = event.target.closest("[data-set-date]");
    if (setDate) {
      flushPendingSaves();
      state.selectedDate = setDate.dataset.setDate;
      const chosen = dateFromKey(state.selectedDate);
      state.calendarCursor = monthStart(chosen);
      if (state.view === "calendar" && isMobile()) state.view = "today";
      render();
      return;
    }

    const calShift = event.target.closest("[data-calendar-shift]");
    if (calShift) {
      flushPendingSaves();
      const next = new Date(state.calendarCursor);
      next.setMonth(next.getMonth() + Number(calShift.dataset.calendarShift || 0));
      state.calendarCursor = monthStart(next);
      render();
      return;
    }

    if (event.target.closest("[data-calendar-today]")) {
      flushPendingSaves();
      state.selectedDate = localDate();
      state.calendarCursor = monthStart(new Date());
      render();
      return;
    }

    const format = event.target.closest("[data-format]");
    if (format) {
      applyFormat(format.dataset.format);
      return;
    }

    const toTask = event.target.closest("[data-note-to-task]");
    if (toTask) {
      flushNoteSave();
      const note = notes().find((item) => item.id === toTask.dataset.noteToTask);
      if (note) {
        createTask(note.title || compact(note.text, 60) || "Not görevi", localDate());
        render();
      }
      return;
    }

    const tag = event.target.closest("[data-tag]");
    if (tag) {
      flushPendingSaves();
      state.noteSearch = tag.dataset.tag;
      state.view = "notes";
      state.mobileEditor = false;
      render();
      return;
    }

    if (event.target.closest("[data-show-pinned]")) {
      const pinned = notes().find((item) => item.type !== "daily" && item.pinned);
      if (pinned) {
        state.activeNoteId = pinned.id;
        state.mobileEditor = isMobile();
        render();
      }
      return;
    }

    if (event.target.closest("[data-focus-task]")) {
      state.view = "tasks";
      render();
      requestAnimationFrame(() => document.querySelector("#taskTitleInput")?.focus());
    }
  });

  app.addEventListener("submit", (event) => {
    if (event.target.id === "todayTaskForm") {
      event.preventDefault();
      const input = document.querySelector("#todayTaskInput");
      if (createTask(input?.value, state.selectedDate)) render();
      return;
    }
    if (event.target.id === "taskComposer") {
      event.preventDefault();
      const title = document.querySelector("#taskTitleInput")?.value || "";
      const date = document.querySelector("#taskDateInput")?.value || "";
      const time = document.querySelector("#taskTimeInput")?.value || "";
      if (createTask(title, date, time)) render();
    }
  });

  app.addEventListener("input", (event) => {
    if (event.target.id === "dailyEditor") {
      scheduleDailySave();
      const stats = document.querySelector("#dailyStats");
      if (stats) stats.textContent = `${wordCount(event.target.value)} kelime`;
    }
    if (["noteTitle", "noteText", "noteTags"].includes(event.target.id)) {
      if (event.target.id === "noteTitle") autoGrowTitle();
      scheduleNoteSave();
      if (event.target.id === "noteText") {
        const count = document.querySelector("#noteWordCount");
        if (count) count.textContent = `${wordCount(event.target.value)} kelime`;
      }
    }
    if (event.target.id === "noteSearch") {
      state.noteSearch = event.target.value;
      refreshNoteList();
    }
    if (event.target.id === "searchInput") {
      state.searchQuery = event.target.value;
      refreshSearchResults();
    }
  });

  app.addEventListener("change", (event) => {
    if (event.target.id === "noteDate") scheduleNoteSave();
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
      event.preventDefault();
      createNote();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      state.view = "search";
      state.mobileEditor = false;
      render();
      requestAnimationFrame(() => document.querySelector("#searchInput")?.focus());
    }
    if (event.key === "Escape" && state.view === "notes" && state.mobileEditor) {
      flushNoteSave();
      state.mobileEditor = false;
      render();
    }
  });

  globalThis.addEventListener(REMOTE_EVENT, () => {
    if (document.activeElement?.matches("textarea,input")) return;
    render();
  });

  globalThis.addEventListener("pagehide", () => {
    flushPendingSaves();
  });

  let resizeTimer = 0;
  globalThis.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      flushPendingSaves();
      if (!isMobile()) state.mobileEditor = false;
      if (state.view === "notes") render();
    }, 120);
  });
}

mountShell();
await ensurePrivateSession();
render();
