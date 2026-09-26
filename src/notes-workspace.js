import { ensurePrivateSession } from "./appwrite-cloud.js";

const NOTES_KEY = "kisiselaraclar:p16:notes";
const TASKS_KEY = "kisiselaraclar:p16:tasks";
const CHANGE_EVENT = "kisiselaraclar:local-change";
const REMOTE_EVENT = "kisiselaraclar:remote-change";

const state = {
  view: "today",
  date: localDate(),
  activeNoteId: "",
  noteSearch: "",
  taskFilter: "open",
  dragTaskId: ""
};

const app = document.querySelector("#app");
let workspace = null;
let saveTimer = 0;

function localDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
  } catch { return []; }
}

function writeArray(key, value) {
  const target = storage();
  if (!target?.setItem) return false;
  try {
    target.setItem(key, JSON.stringify(value));
    globalThis.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
    return true;
  } catch { return false; }
}

function notes() {
  return readArray(NOTES_KEY)
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      ...item,
      id: String(item.id || uid("note")),
      title: String(item.title || ""),
      text: String(item.text || ""),
      type: item.type === "daily" ? "daily" : "note",
      tags: Array.isArray(item.tags) ? item.tags.map(String).filter(Boolean) : [],
      pinned: Boolean(item.pinned),
      completed: Boolean(item.completed),
      noteDate: /^\d{4}-\d{2}-\d{2}$/.test(String(item.noteDate || "")) ? String(item.noteDate) : localDate(new Date(Number(item.updatedAt) || Date.now())),
      createdAt: Number(item.createdAt) || Number(item.updatedAt) || Date.now(),
      updatedAt: Number(item.updatedAt) || Date.now()
    }))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

function tasks() {
  return readArray(TASKS_KEY)
    .filter((item) => item && String(item.title || "").trim())
    .map((item) => ({
      ...item,
      id: String(item.id || uid("task")),
      title: String(item.title || "").trim(),
      notes: String(item.notes || ""),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || "")) ? String(item.date) : "",
      time: /^\d{2}:\d{2}$/.test(String(item.time || "")) ? String(item.time) : "",
      lane: item.done ? "done" : ["inbox", "today", "doing"].includes(item.lane) ? item.lane : (item.date === localDate() ? "today" : "inbox"),
      done: Boolean(item.done),
      createdAt: Number(item.createdAt) || Date.now(),
      updatedAt: Number(item.updatedAt) || Number(item.createdAt) || Date.now()
    }));
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compact(value, max = 96) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function prettyDate(value = state.date) {
  try {
    return new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
  } catch { return value; }
}

function shortDate(value) {
  if (!value) return "Tarihsiz";
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
  } catch { return value; }
}

function relativeDate(value) {
  if (!value) return "Inbox";
  if (value === localDate()) return "Bugün";
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === localDate(tomorrow)) return "Yarın";
  return shortDate(value);
}

function ensureDaily(date) {
  const all = notes();
  let item = all.find((note) => note.type === "daily" && note.noteDate === date);
  if (item) return item;
  item = {
    id: uid("daily"), title: prettyDate(date), text: "", type: "daily", tags: ["günlük"],
    pinned: false, completed: false, noteDate: date, createdAt: Date.now(), updatedAt: Date.now()
  };
  all.unshift(item);
  writeArray(NOTES_KEY, all);
  return item;
}

function saveNote(id, patch, rerender = false) {
  const all = notes();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return false;
  all[index] = { ...all[index], ...patch, updatedAt: Date.now() };
  const ok = writeArray(NOTES_KEY, all);
  if (ok && rerender) render();
  return ok;
}

function createNote() {
  const all = notes();
  const item = {
    id: uid("note"), title: "", text: "", type: "note", tags: [], pinned: false, completed: false,
    noteDate: localDate(), createdAt: Date.now(), updatedAt: Date.now()
  };
  all.unshift(item);
  writeArray(NOTES_KEY, all);
  state.activeNoteId = item.id;
  state.view = "notes";
  render();
  requestAnimationFrame(() => document.querySelector("#noteTitle")?.focus());
}

function deleteNote(id) {
  const all = notes().filter((item) => item.id !== id);
  writeArray(NOTES_KEY, all);
  if (state.activeNoteId === id) state.activeNoteId = all.find((item) => item.type !== "daily")?.id || "";
  render();
}

function createTask(title, date = "", lane = "inbox") {
  const value = String(title || "").trim();
  if (!value) return false;
  const all = tasks();
  const now = Date.now();
  all.push({ id: uid("task"), title: value, notes: "", date, time: "", lane, done: false, createdAt: now, updatedAt: now });
  writeArray(TASKS_KEY, all);
  return true;
}

function updateTask(id, patch, rerender = true) {
  const all = tasks();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return false;
  const next = { ...all[index], ...patch, updatedAt: Date.now() };
  if (next.lane === "done") next.done = true;
  if (next.done && next.lane !== "done") next.lane = "done";
  if (!next.done && next.lane === "done") next.lane = "today";
  if (next.lane === "today" && !next.date) next.date = localDate();
  all[index] = next;
  const ok = writeArray(TASKS_KEY, all);
  if (ok && rerender) render();
  return ok;
}

function deleteTask(id) {
  writeArray(TASKS_KEY, tasks().filter((item) => item.id !== id));
  render();
}

function countOpenToday() {
  return tasks().filter((item) => !item.done && item.date === localDate()).length;
}

function mountShell() {
  app.innerHTML = `
    <div class="notes-app-shell">
      <aside class="app-sidebar">
        <div class="brand"><span>N</span><div><strong>Notlar</strong><small>private workspace</small></div></div>
        <button class="capture-button" type="button" data-create-note><span>＋</span> Yeni not</button>
        <nav class="main-nav" aria-label="Ana bölümler">
          <button data-view="today"><span>⌂</span><b>Bugün</b><i data-today-count>${countOpenToday()}</i></button>
          <button data-view="notes"><span>▤</span><b>Notlar</b></button>
          <button data-view="tasks"><span>✓</span><b>Görevler</b></button>
          <button data-view="board"><span>▦</span><b>Pano</b></button>
        </nav>
        <div class="sidebar-search"><span>⌕</span><input id="globalSearch" type="search" placeholder="Ara…" autocomplete="off"></div>
        <div class="sidebar-spacer"></div>
        <nav class="site-nav" aria-label="Senkron ve oturum"></nav>
      </aside>
      <header class="mobile-header"><div class="brand compact"><span>N</span><strong>Notlar</strong></div><button type="button" data-create-note aria-label="Yeni not">＋</button></header>
      <main class="app-main"><div id="workspaceView"></div></main>
      <nav class="mobile-nav" aria-label="Mobil navigasyon">
        <button data-view="today"><span>⌂</span><b>Bugün</b></button>
        <button data-view="notes"><span>▤</span><b>Notlar</b></button>
        <button class="mobile-add" data-create-note aria-label="Yeni not"><span>＋</span></button>
        <button data-view="tasks"><span>✓</span><b>Görevler</b></button>
        <button data-view="board"><span>▦</span><b>Pano</b></button>
      </nav>
    </div>`;
  workspace = document.querySelector("#workspaceView");

  app.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      state.view = viewButton.dataset.view;
      render();
      return;
    }
    if (event.target.closest("[data-create-note]")) createNote();
  });

  document.querySelector("#globalSearch")?.addEventListener("input", (event) => {
    state.noteSearch = event.target.value;
    state.view = "notes";
    render();
    requestAnimationFrame(() => {
      const search = document.querySelector("#noteSearch");
      if (search) { search.value = state.noteSearch; search.focus(); }
    });
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
      event.preventDefault(); createNote();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault(); document.querySelector("#globalSearch")?.focus();
    }
  });
}

function updateNav() {
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === state.view));
  document.querySelectorAll("[data-today-count]").forEach((node) => { node.textContent = countOpenToday() || ""; });
}

function taskRow(task, options = {}) {
  return `<article class="task-row ${task.done ? "done" : ""}" data-task-row="${esc(task.id)}">
    <button class="task-check" type="button" data-toggle-task="${esc(task.id)}" aria-label="${task.done ? "Görevi yeniden aç" : "Görevi tamamla"}">${task.done ? "✓" : ""}</button>
    <div class="task-copy"><strong>${esc(task.title)}</strong><small>${esc(relativeDate(task.date))}${task.time ? ` · ${esc(task.time)}` : ""}</small></div>
    ${options.compact ? "" : `<button class="task-more" type="button" data-delete-task="${esc(task.id)}" aria-label="Görevi sil">×</button>`}
  </article>`;
}

function todayView() {
  const daily = ensureDaily(state.date);
  const allTasks = tasks();
  const dayTasks = allTasks.filter((item) => item.date === state.date && !item.done);
  const done = allTasks.filter((item) => item.date === state.date && item.done);
  const overdue = allTasks.filter((item) => !item.done && item.date && item.date < state.date);
  return `<div class="view today-view">
    <header class="view-header today-head">
      <div><span class="kicker">GÜNLÜK</span><h1>${state.date === localDate() ? "Bugün" : esc(shortDate(state.date))}</h1><p>${esc(prettyDate(state.date))}</p></div>
      <div class="date-nav"><button type="button" data-date-shift="-1">←</button><button type="button" data-date-today>Bugün</button><button type="button" data-date-shift="1">→</button></div>
    </header>
    <div class="today-grid">
      <section class="daily-paper">
        <div class="paper-top"><span>Günün notu</span><div><span id="dailySaveState">Otomatik kayıt</span><span data-daily-stats></span></div></div>
        <textarea id="dailyEditor" aria-label="Günlük not" placeholder="Bugün ne var? Düşünceler, kararlar, notlar…">${esc(daily.text)}</textarea>
      </section>
      <aside class="today-tasks">
        <div class="section-title"><div><span>PLAN</span><h2>Bugünün işleri</h2></div><strong>${dayTasks.length}</strong></div>
        <form class="quick-task" id="todayTaskForm"><input id="todayTaskInput" autocomplete="off" placeholder="Görev ekle…"><button>Ekle</button></form>
        ${overdue.length ? `<div class="task-group"><h3>Geciken <span>${overdue.length}</span></h3>${overdue.slice(0,3).map((item) => taskRow(item,{compact:true})).join("")}</div>` : ""}
        <div class="task-group">${dayTasks.map((item) => taskRow(item)).join("") || '<div class="empty-state small">Bugün için açık görev yok.</div>'}</div>
        ${done.length ? `<details class="done-group"><summary>Tamamlananlar · ${done.length}</summary>${done.map((item) => taskRow(item,{compact:true})).join("")}</details>` : ""}
      </aside>
    </div>
  </div>`;
}

function filteredNotes() {
  const query = state.noteSearch.trim().toLocaleLowerCase("tr-TR");
  return notes().filter((item) => item.type !== "daily" && (!query || `${item.title} ${item.text} ${item.tags.join(" ")}`.toLocaleLowerCase("tr-TR").includes(query)));
}

function notesView() {
  const list = filteredNotes();
  if (!state.activeNoteId || !list.some((item) => item.id === state.activeNoteId)) state.activeNoteId = list[0]?.id || "";
  const active = notes().find((item) => item.id === state.activeNoteId) || null;
  return `<div class="view notes-view">
    <header class="view-header"><div><span class="kicker">KÜTÜPHANE</span><h1>Notlar</h1><p>${list.length} not · fikirler, toplantılar, kayıtlar</p></div><button class="primary" type="button" data-create-note>＋ Yeni not</button></header>
    <div class="notes-layout ${active ? "has-editor" : ""}">
      <aside class="note-list-panel">
        <div class="note-search"><span>⌕</span><input id="noteSearch" type="search" value="${esc(state.noteSearch)}" placeholder="Notlarda ara…" autocomplete="off"></div>
        <div class="note-list">
          ${list.map((item) => `<button type="button" class="note-card ${item.id === state.activeNoteId ? "active" : ""}" data-open-note="${esc(item.id)}">
            <div><strong>${item.pinned ? "● " : ""}${esc(item.title || "Başlıksız not")}</strong><time>${esc(shortDate(item.noteDate))}</time></div>
            <p>${esc(compact(item.text,110) || "Boş not")}</p>
            ${item.tags.length ? `<footer>${item.tags.slice(0,3).map((tag) => `<span>#${esc(tag)}</span>`).join("")}</footer>` : ""}
          </button>`).join("") || '<div class="empty-state">Aramana uygun not yok.</div>'}
        </div>
      </aside>
      <section class="note-editor-panel">
        ${active ? `<div class="editor-toolbar"><button type="button" data-format="bold"><b>B</b></button><button type="button" data-format="italic"><i>I</i></button><button type="button" data-format="h2">H2</button><button type="button" data-format="check">☐</button><span></span><button type="button" data-pin-note="${esc(active.id)}">${active.pinned ? "★ Sabit" : "☆ Sabitle"}</button><button class="danger" type="button" data-delete-note="${esc(active.id)}">Sil</button></div>
        <div class="editor-sheet">
          <input id="noteTitle" class="note-title" value="${esc(active.title)}" placeholder="Başlıksız not" aria-label="Not başlığı">
          <textarea id="noteText" class="note-text" placeholder="Yazmaya başla…" aria-label="Not içeriği">${esc(active.text)}</textarea>
          <div class="editor-meta"><input id="noteTags" value="${esc(active.tags.join(", "))}" placeholder="etiket, toplantı, fikir" aria-label="Etiketler"><span data-note-stats></span><span id="noteSaveState">Otomatik kayıt</span></div>
        </div>` : '<div class="empty-editor"><strong>Yeni bir not oluştur.</strong><button class="primary" type="button" data-create-note>＋ Yeni not</button></div>'}
      </section>
    </div>
  </div>`;
}

function taskGroups() {
  const all = tasks();
  const today = localDate();
  return {
    overdue: all.filter((item) => !item.done && item.date && item.date < today),
    today: all.filter((item) => !item.done && item.date === today),
    inbox: all.filter((item) => !item.done && !item.date),
    upcoming: all.filter((item) => !item.done && item.date > today).sort((a,b)=>a.date.localeCompare(b.date)),
    done: all.filter((item) => item.done).sort((a,b)=>b.updatedAt-a.updatedAt)
  };
}

function taskSection(title, list) {
  return `<section class="task-section"><header><h2>${title}</h2><span>${list.length}</span></header>${list.map((item)=>taskRow(item)).join("") || '<div class="empty-state small">Boş.</div>'}</section>`;
}

function tasksView() {
  const groups = taskGroups();
  return `<div class="view tasks-view">
    <header class="view-header"><div><span class="kicker">PLAN</span><h1>Görevler</h1><p>Inbox'tan güne, günden tamamlanana.</p></div></header>
    <form class="task-composer" id="taskComposer"><input id="taskComposerTitle" placeholder="Yeni görev…" autocomplete="off"><input id="taskComposerDate" type="date"><button class="primary">Ekle</button></form>
    <div class="task-sections">${taskSection("Geciken",groups.overdue)}${taskSection("Bugün",groups.today)}${taskSection("Inbox",groups.inbox)}${taskSection("Yaklaşan",groups.upcoming)}<details class="done-section"><summary>Tamamlananlar · ${groups.done.length}</summary>${groups.done.map((item)=>taskRow(item)).join("")}</details></div>
  </div>`;
}

function boardView() {
  const all = tasks();
  const lanes = [
    ["inbox","Inbox"], ["today","Bugün"], ["doing","Devam"], ["done","Tamam"]
  ];
  return `<div class="view board-view">
    <header class="view-header"><div><span class="kicker">PANO</span><h1>Akış</h1><p>Görevleri sürükleyerek durumlarını değiştir.</p></div></header>
    <div class="board">${lanes.map(([lane,label])=>{
      const items=all.filter((item)=>(item.done?"done":item.lane)===lane);
      return `<section class="board-lane" data-drop-lane="${lane}"><header><h2>${label}</h2><span>${items.length}</span></header><div class="board-stack">${items.map((item)=>`<article class="board-card" draggable="true" data-drag-task="${esc(item.id)}"><strong>${esc(item.title)}</strong><small>${esc(relativeDate(item.date))}</small></article>`).join("") || '<div class="lane-empty">Buraya bırak</div>'}</div></section>`;
    }).join("")}</div>
  </div>`;
}

function render() {
  if (!workspace) return;
  updateNav();
  if (state.view === "today") workspace.innerHTML = todayView();
  else if (state.view === "notes") workspace.innerHTML = notesView();
  else if (state.view === "tasks") workspace.innerHTML = tasksView();
  else workspace.innerHTML = boardView();
  wireView();
}

function scheduleSave(callback, stateNode) {
  clearTimeout(saveTimer);
  if (stateNode) stateNode.textContent = "Kaydediliyor…";
  saveTimer = setTimeout(() => {
    const ok = callback();
    if (stateNode) stateNode.textContent = ok ? "Kaydedildi" : "Kaydedilemedi";
  }, 280);
}

function editorStats(text, node) {
  if (!node) return;
  const value = String(text || "");
  const wordCount = (value.trim().match(/\S+/gu) || []).length;
  node.textContent = `${wordCount} kelime · ${value.length} karakter`;
}

function applyFormat(textarea, format) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || "metin";
  let before = "", after = "";
  if (format === "bold") { before = "**"; after = "**"; }
  if (format === "italic") { before = "_"; after = "_"; }
  if (format === "h2") { before = "## "; }
  if (format === "check") { before = "- [ ] "; }
  textarea.setRangeText(`${before}${selected}${after}`, start, end, "select");
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
}

function shiftDate(delta) {
  const date = new Date(`${state.date}T12:00:00`);
  date.setDate(date.getDate() + delta);
  state.date = localDate(date);
  render();
}

function wireView() {
  if (!workspace) return;

  const dailyEditor = workspace.querySelector("#dailyEditor");
  if (dailyEditor) {
    const daily = ensureDaily(state.date);
    const status = workspace.querySelector("#dailySaveState");
    const stats = workspace.querySelector("[data-daily-stats]");
    editorStats(dailyEditor.value, stats);
    dailyEditor.addEventListener("input", () => {
      editorStats(dailyEditor.value, stats);
      scheduleSave(() => saveNote(daily.id, { text: dailyEditor.value }, false), status);
    });
  }

  const noteText = workspace.querySelector("#noteText");
  const noteTitle = workspace.querySelector("#noteTitle");
  const noteTags = workspace.querySelector("#noteTags");
  if (noteText && state.activeNoteId) {
    const status = workspace.querySelector("#noteSaveState");
    const stats = workspace.querySelector("[data-note-stats]");
    editorStats(noteText.value, stats);
    const saveCurrent = () => saveNote(state.activeNoteId, {
      title: noteTitle?.value || "",
      text: noteText.value,
      tags: String(noteTags?.value || "").split(",").map((tag)=>tag.trim().replace(/^#/,"")).filter(Boolean)
    }, false);
    [noteText,noteTitle,noteTags].forEach((node)=>node?.addEventListener("input",()=>{
      editorStats(noteText.value, stats);
      scheduleSave(saveCurrent,status);
    }));
  }

  workspace.addEventListener("click", (event) => {
    const openNote = event.target.closest("[data-open-note]");
    if (openNote) { state.activeNoteId = openNote.dataset.openNote; render(); return; }
    const toggleTask = event.target.closest("[data-toggle-task]");
    if (toggleTask) {
      const task = tasks().find((item)=>item.id===toggleTask.dataset.toggleTask);
      if (task) updateTask(task.id,{done:!task.done,lane:task.done?"today":"done"});
      return;
    }
    const removeTask = event.target.closest("[data-delete-task]");
    if (removeTask) { deleteTask(removeTask.dataset.deleteTask); return; }
    const removeNote = event.target.closest("[data-delete-note]");
    if (removeNote) { deleteNote(removeNote.dataset.deleteNote); return; }
    const pinNote = event.target.closest("[data-pin-note]");
    if (pinNote) {
      const item=notes().find((note)=>note.id===pinNote.dataset.pinNote);
      if(item) saveNote(item.id,{pinned:!item.pinned},true);
      return;
    }
    const format = event.target.closest("[data-format]");
    if (format) { applyFormat(workspace.querySelector("#noteText"),format.dataset.format); return; }
    if (event.target.closest("[data-date-today]")) { state.date=localDate(); render(); return; }
    const shift = event.target.closest("[data-date-shift]");
    if (shift) { shiftDate(Number(shift.dataset.dateShift||0)); return; }
  });

  workspace.querySelector("#noteSearch")?.addEventListener("input", (event) => {
    state.noteSearch = event.target.value;
    const pos = event.target.selectionStart;
    render();
    requestAnimationFrame(()=>{const input=workspace.querySelector("#noteSearch");if(input){input.focus();input.setSelectionRange(pos,pos);}});
  });

  workspace.querySelector("#todayTaskForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input=workspace.querySelector("#todayTaskInput");
    if(createTask(input?.value,state.date,"today")) render();
  });

  workspace.querySelector("#taskComposer")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const title=workspace.querySelector("#taskComposerTitle")?.value;
    const date=workspace.querySelector("#taskComposerDate")?.value||"";
    if(createTask(title,date,date===localDate()?"today":"inbox")) render();
  });

  workspace.querySelectorAll("[data-drag-task]").forEach((card)=>card.addEventListener("dragstart",()=>{state.dragTaskId=card.dataset.dragTask;}));
  workspace.querySelectorAll("[data-drop-lane]").forEach((lane)=>{
    lane.addEventListener("dragover",(event)=>{event.preventDefault();lane.classList.add("drag-over");});
    lane.addEventListener("dragleave",()=>lane.classList.remove("drag-over"));
    lane.addEventListener("drop",(event)=>{
      event.preventDefault();lane.classList.remove("drag-over");
      const id=state.dragTaskId;state.dragTaskId="";
      if(!id)return;
      const nextLane=lane.dataset.dropLane;
      updateTask(id,{lane:nextLane,done:nextLane==="done",date:nextLane==="today"?localDate():tasks().find((item)=>item.id===id)?.date||""});
    });
  });
}

mountShell();
await ensurePrivateSession();
ensureDaily(localDate());
render();

globalThis.addEventListener(REMOTE_EVENT, () => render());
globalThis.addEventListener("storage", (event) => {
  if (event.key === NOTES_KEY || event.key === TASKS_KEY) render();
});
