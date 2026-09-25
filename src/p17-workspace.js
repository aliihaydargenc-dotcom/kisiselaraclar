const STORAGE_PREFIX = "kisiselaraclar:";
const NOTES_KEY = "kisiselaraclar:p16:notes";
const TASKS_KEY = "kisiselaraclar:p16:tasks";
const MEETING_KEY = "kisiselaraclar:p16:meeting-draft";
export const P17_BACKUP_SCHEMA = "kisiselaraclar-local-backup";
export const P17_BACKUP_FILE_LIMIT = 8 * 1024 * 1024;
export const P17_BACKUP_ENTRY_LIMIT = 100;
export const P17_BACKUP_VALUE_LIMIT = 2 * 1024 * 1024;

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(String(value ?? ""));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function storageJson(storage, key, fallback) {
  try {
    return safeParse(storage?.getItem?.(key), fallback);
  } catch {
    return fallback;
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

function compactText(value, max = 92) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function makeId(prefix = "item") {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function writeJson(storage, key, value) {
  if (!storage?.setItem) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    try { globalThis.dispatchEvent?.(new CustomEvent("kisiselaraclar:local-change", { detail: { key } })); } catch {}
    return true;
  } catch {
    return false;
  }
}

function displayTime(timestamp) {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

function displayShortDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return "";
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizedNotes(storage) {
  const notes = storageJson(storage, NOTES_KEY, []);
  return Array.isArray(notes)
    ? notes.filter((item) => item && typeof item === "object").map((item) => ({
        id: String(item.id || ""),
        title: String(item.title || ""),
        text: String(item.text || ""),
        pinned: Boolean(item.pinned),
        completed: Boolean(item.completed),
        noteDate: String(item.noteDate || ""),
        updatedAt: Number(item.updatedAt) || 0
      }))
    : [];
}

function normalizedTasks(storage) {
  const tasks = storageJson(storage, TASKS_KEY, []);
  return Array.isArray(tasks)
    ? tasks.filter((item) => item && typeof item === "object" && String(item.title || "").trim()).map((item) => ({
        id: String(item.id || ""),
        title: String(item.title || "").trim(),
        date: /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || "")) ? String(item.date) : "",
        time: /^\d{2}:\d{2}$/.test(String(item.time || "")) ? String(item.time) : "",
        done: Boolean(item.done)
      }))
    : [];
}

function meetingDraft(storage) {
  const draft = storageJson(storage, MEETING_KEY, {});
  return draft && typeof draft === "object" ? draft : {};
}

function hasMeetingContent(draft) {
  return ["title", "participants", "notes", "decisions", "actions"]
    .some((key) => String(draft?.[key] || "").trim());
}

export function buildWorkspaceSummary(storage, now = new Date()) {
  const today = localDateKey(now);
  const notes = normalizedNotes(storage);
  const tasks = normalizedTasks(storage);
  const meeting = meetingDraft(storage);
  const open = tasks.filter((task) => !task.done);
  const todayAllTasks = tasks
    .filter((task) => task.date === today)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  const todayTasks = todayAllTasks.filter((task) => !task.done);
  const todayDoneCount = todayAllTasks.filter((task) => task.done).length;
  const overdueTasks = open
    .filter((task) => task.date && task.date < today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99:99").localeCompare(b.time || "99:99"));
  const upcomingTasks = open
    .filter((task) => task.date && task.date > today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99:99").localeCompare(b.time || "99:99"));
  const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const voiceNotes = sortedNotes.filter((note) => /sesli\s*not/i.test(note.title || ""));
  const regularNotes = sortedNotes.filter((note) => !/sesli\s*not/i.test(note.title || ""));
  const latestNote = sortedNotes[0] || null;
  const pinnedCount = notes.filter((note) => note.pinned).length;

  return {
    today,
    notes,
    tasks,
    meeting,
    hasMeeting: hasMeetingContent(meeting),
    openCount: open.length,
    todayAllTasks,
    todayTasks,
    todayDoneCount,
    overdueTasks,
    upcomingTasks,
    latestNote,
    regularNotes,
    voiceNotes,
    pinnedCount
  };
}

export function collectStorageEntries(storage) {
  const entries = {};
  if (!storage) return entries;
  try {
    for (let index = 0; index < Number(storage.length || 0); index += 1) {
      const key = storage.key(index);
      if (!key || !String(key).startsWith(STORAGE_PREFIX)) continue;
      const value = storage.getItem(key);
      if (typeof value === "string") entries[key] = value;
    }
  } catch {
    return entries;
  }
  return entries;
}

export function createWorkspaceBackup(storage, now = new Date()) {
  return {
    schema: P17_BACKUP_SCHEMA,
    version: 1,
    exportedAt: now.toISOString(),
    entries: collectStorageEntries(storage)
  };
}

function utf8Bytes(value) {
  return new TextEncoder().encode(String(value ?? "")).byteLength;
}

export function validateWorkspaceBackup(payload) {
  if (!payload || typeof payload !== "object" || payload.schema !== P17_BACKUP_SCHEMA || payload.version !== 1) {
    throw new Error("Bu dosya Kişisel Araçlar yedeği değil.");
  }
  if (!payload.entries || typeof payload.entries !== "object" || Array.isArray(payload.entries)) {
    throw new Error("Yedek içeriği okunamadı.");
  }
  const rawEntries = Object.entries(payload.entries);
  if (rawEntries.length > P17_BACKUP_ENTRY_LIMIT) {
    throw new Error(`Yedek en fazla ${P17_BACKUP_ENTRY_LIMIT} kayıt grubu içerebilir.`);
  }
  const entries = [];
  let totalBytes = 0;
  for (const [key, value] of rawEntries) {
    if (!String(key).startsWith(STORAGE_PREFIX)) continue;
    if (typeof value !== "string") throw new Error(`${key}: yedek değeri metin olmalı.`);
    const valueBytes = utf8Bytes(value);
    if (valueBytes > P17_BACKUP_VALUE_LIMIT) throw new Error(`${key}: kayıt grubu 2 MB sınırını aşıyor.`);
    totalBytes += utf8Bytes(key) + valueBytes;
    if (totalBytes > P17_BACKUP_FILE_LIMIT) throw new Error("Yedek içeriği 8 MB güvenlik sınırını aşıyor.");
    entries.push([key, value]);
  }
  return { entries, count: entries.length, totalBytes };
}

export function restoreWorkspaceBackup(storage, payload) {
  if (!storage?.setItem) throw new Error("Tarayıcı depolaması kullanılamıyor.");
  const validated = validateWorkspaceBackup(payload);
  const previous = new Map();
  try {
    for (const [key, value] of validated.entries) {
      previous.set(key, storage.getItem?.(key) ?? null);
      storage.setItem(key, value);
    }
  } catch {
    for (const [key, value] of previous) {
      try {
        if (value === null) storage.removeItem?.(key);
        else storage.setItem(key, value);
      } catch {}
    }
    throw new Error("Yedek geri yüklenemedi; tarayıcı depolaması yazmaya izin vermedi.");
  }
  return validated.count;
}

function normalizeSearch(value) {
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

function matchQuery(value, query) {
  const haystack = normalizeSearch(value);
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
}

export function searchWorkspaceContent(storage, query, limit = 8) {
  if (!normalizeSearch(query)) return [];
  const results = [];
  for (const note of normalizedNotes(storage)) {
    if (!matchQuery(`${note.title} ${note.text}`, query)) continue;
    results.push({
      kind: "Not",
      toolId: "quick-note",
      title: note.title || compactText(note.text, 54) || "Adsız not",
      snippet: compactText(note.text || note.title)
    });
  }
  for (const task of normalizedTasks(storage)) {
    if (!matchQuery(task.title, query)) continue;
    results.push({
      kind: task.done ? "Tamamlanan görev" : "Görev",
      toolId: "tasks-calendar",
      title: task.title,
      snippet: [task.date, task.time].filter(Boolean).join(" · ") || "Tarihsiz"
    });
  }
  const meeting = meetingDraft(storage);
  const meetingText = [meeting.title, meeting.participants, meeting.notes, meeting.decisions, meeting.actions].join(" ");
  if (hasMeetingContent(meeting) && matchQuery(meetingText, query)) {
    results.push({
      kind: "Toplantı",
      toolId: "meeting-notes",
      title: String(meeting.title || "Toplantı taslağı"),
      snippet: compactText(meeting.notes || meeting.decisions || meeting.actions || meeting.participants)
    });
  }
  return results.slice(0, Math.max(1, Number(limit) || 8));
}

function dateLabel(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(date);
  } catch {
    return localDateKey(date);
  }
}

function taskRows(summary) {
  const focus = [
    ...summary.todayTasks.map((task) => ({ ...task, state: "Bugün" })),
    ...summary.overdueTasks.map((task) => ({ ...task, state: "Gecikti" }))
  ].slice(0, 4);

  if (!focus.length) {
    return `
      <button type="button" class="p17-empty-focus" data-tool="tasks-calendar" data-tool-action="new-task">
        <span class="p17-empty-icon" aria-hidden="true">＋</span>
        <span class="p17-empty-copy">
          <strong>Bugün için açık iş yok</strong>
          <small>Görev eklemek için dokun</small>
        </span>
        <span class="p17-empty-arrow" aria-hidden="true">→</span>
      </button>`;
  }

  return `
    <div class="p17-task-focus">
      ${focus.map((task) => `
        <button type="button" class="p17-task-row" data-tool="tasks-calendar">
          <span class="p17-task-dot" aria-hidden="true"></span>
          <span class="p17-task-copy">
            <strong>${escapeHtml(task.title)}</strong>
            <small>${escapeHtml(task.state)}${task.time ? ` · ${escapeHtml(task.time)}` : ""}</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>`).join("")}
    </div>`;
}


function noteRows(summary) {
  const list = summary.regularNotes.slice(0, 4);
  if (!list.length) return '<div class="p25-empty">Henüz not yok. Yukarıdaki alandan ilk notunu ekle.</div>';
  return list.map((note) => {
    const title = note.title || compactText(note.text, 42) || "Adsız not";
    const detail = compactText(note.text, 66) || (note.pinned ? "Sabitlenmiş not" : "Not");
    return `
      <button type="button" class="p25-note-row" data-tool="quick-note">
        <span class="p25-row-icon" aria-hidden="true">${note.pinned ? "★" : "✎"}</span>
        <span class="p25-row-copy">
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(detail)}</small>
        </span>
        <time>${escapeHtml(displayTime(note.updatedAt))}</time>
        <span class="p25-row-more" aria-hidden="true">›</span>
      </button>`;
  }).join("");
}

function voiceRows(summary) {
  const list = summary.voiceNotes.slice(0, 3);
  if (!list.length) return '<div class="p25-empty compact">Henüz sesli not yok. Mikrofonu açıp ilk kaydını oluştur.</div>';
  return list.map((note) => `
    <button type="button" class="p25-voice-row" data-tool="voice-note">
      <span class="p25-play" aria-hidden="true">▶</span>
      <span class="p25-row-copy">
        <strong>${escapeHtml(compactText(note.text, 48) || "Sesli not")}</strong>
        <small>${escapeHtml(displayTime(note.updatedAt) || "Metne dönüştürüldü")}</small>
      </span>
      <span class="p25-row-more" aria-hidden="true">›</span>
    </button>`).join("");
}

function planRows(summary) {
  const list = summary.todayAllTasks.length ? summary.todayAllTasks.slice(0, 5) : summary.upcomingTasks.slice(0, 5);
  if (!list.length) return '<div class="p25-empty">Bugün için plan yok. Yeni görev ekleyebilirsin.</div>';
  return list.map((task) => {
    const meta = task.date === summary.today
      ? (task.time || "Bugün")
      : [displayShortDate(task.date), task.time].filter(Boolean).join(" · ");
    return `
      <label class="p25-plan-row ${task.done ? "is-done" : ""}">
        <input type="checkbox" data-p25-task-toggle="${escapeHtml(task.id)}" ${task.done ? "checked" : ""} />
        <span class="p25-check" aria-hidden="true"></span>
        <span class="p25-row-copy"><strong>${escapeHtml(task.title)}</strong></span>
        <time>${escapeHtml(meta)}</time>
      </label>`;
  }).join("");
}

export function buildP17HomeMarkup(storage, now = new Date()) {
  const summary = buildWorkspaceSummary(storage, now);
  const storedCount = Object.keys(collectStorageEntries(storage)).length;
  const totalToday = summary.todayAllTasks.length;
  const progress = totalToday ? Math.round((summary.todayDoneCount / totalToday) * 100) : 0;

  return `
    <section class="p17-workspace p25-workspace" id="p17Workspace" aria-labelledby="p17Title">
      <div class="p25-head">
        <div>
          <span class="eyebrow">KİŞİSEL ALAN</span>
          <h2 id="p17Title">Bugün</h2>
          <p>Notlarını, sesli notlarını ve günün planını tek yerden yönet.</p>
        </div>
        <span class="p17-date">${escapeHtml(dateLabel(now))}</span>
      </div>

      <div class="p25-core-grid">
        <article class="p25-card p25-notes">
          <div class="p25-card-head">
            <div class="p25-card-title">
              <span class="p25-icon p25-icon-note" aria-hidden="true">✎</span>
              <div><h3>Not Defteri</h3><p>Hızlıca yaz, son notlarına dön.</p></div>
            </div>
            <button type="button" class="p25-link" data-tool="quick-note">Tüm notlar <span>→</span></button>
          </div>

          <form class="p25-quick-note" id="p25QuickNoteForm">
            <input id="p25QuickNoteInput" type="text" maxlength="280" placeholder="Hızlı not ekle..." autocomplete="off" />
            <button type="submit" aria-label="Notu kaydet">↑</button>
          </form>

          <div class="p25-section-label"><span>Son notlar</span><strong>${summary.notes.length}</strong></div>
          <div class="p25-note-list">${noteRows(summary)}</div>
        </article>

        <article class="p25-card p25-voice">
          <div class="p25-card-head">
            <div class="p25-card-title">
              <span class="p25-icon p25-icon-voice" aria-hidden="true">●</span>
              <div><h3>Sesli Notlar</h3><p>Konuş, metne dönüştür ve kaydet.</p></div>
            </div>
            <button type="button" class="p25-link" data-tool="voice-note">Tümü <span>→</span></button>
          </div>

          <button type="button" class="p25-voice-recorder" data-tool="voice-note">
            <span class="p25-mic-ring"><span aria-hidden="true">🎙</span></span>
            <strong>Kayda başla</strong>
            <small>Konuşmanı metne dönüştür</small>
          </button>

          <div class="p25-section-label"><span>Son sesli notlar</span><strong>${summary.voiceNotes.length}</strong></div>
          <div class="p25-voice-list">${voiceRows(summary)}</div>
        </article>

        <article class="p25-card p25-plan">
          <div class="p25-card-head">
            <div class="p25-card-title">
              <span class="p25-icon p25-icon-plan" aria-hidden="true">✓</span>
              <div><h3>Günlük Plan</h3><p>Bugünün işlerini tamamla.</p></div>
            </div>
            <button type="button" class="p25-link" data-tool="tasks-calendar">Planlayıcı <span>→</span></button>
          </div>

          <div class="p25-progress">
            <div><span>Bugünün ilerlemesi</span><strong>${summary.todayDoneCount} / ${totalToday || 0}</strong></div>
            <div class="p25-progress-track"><i style="width:${progress}%"></i></div>
          </div>

          <button type="button" class="p25-add-task" data-tool="tasks-calendar" data-tool-action="new-task">
            <span>＋</span> Yeni görev ekle
          </button>

          <div class="p25-plan-list">${planRows(summary)}</div>
        </article>
      </div>

      <div class="p25-footer-grid">
        <section class="p25-quick-actions">
          <div class="p25-footer-head"><div><span class="eyebrow">HIZLI ERİŞİM</span><h3>Sık kullandıkların</h3></div></div>
          <div class="p25-action-row">
            <button type="button" class="p17-action" data-tool="quick-note" data-tool-action="new-note"><i>✎</i><span><strong>Yeni not</strong><small>Hızlıca yaz</small></span></button>
            <button type="button" class="p17-action" data-tool="voice-note"><i>●</i><span><strong>Sesli not</strong><small>Kayda başla</small></span></button>
            <button type="button" class="p17-action" data-tool="tasks-calendar" data-tool-action="new-task"><i>✓</i><span><strong>Görev ekle</strong><small>Gününe ekle</small></span></button>
            <button type="button" class="p17-action" data-tool="meeting-notes"><i>M</i><span><strong>Toplantı</strong><small>Not oluştur</small></span></button>
          </div>
        </section>

        <aside class="p17-backup p25-backup">
          <div>
            <span>Yedekleme ve veri</span>
            <strong>${storedCount ? `${storedCount} kayıt grubu cihazında` : "Henüz kayıtlı veri yok"}</strong>
          </div>
          <div class="p17-backup-actions">
            <button type="button" id="p17BackupExport">Yedekle</button>
            <button type="button" id="p17BackupImport">Geri yükle</button>
            <input id="p17BackupFile" type="file" accept="application/json,.json" hidden />
          </div>
          <small id="p17BackupStatus" aria-live="polite"></small>
        </aside>
      </div>
    </section>`;
}

export function buildP17SearchMarkup(storage, query) {
  const results = searchWorkspaceContent(storage, query);
  if (!results.length) return "";
  return `
    <section class="p17-search" aria-labelledby="p17SearchTitle">
      <div class="p17-search-head">
        <span class="eyebrow">KENDİ İÇERİĞİN</span>
        <h3 id="p17SearchTitle">Not ve görevlerde de bulundu</h3>
      </div>
      <div class="p17-search-list">
        ${results.map((item) => `
          <button type="button" data-tool="${escapeHtml(item.toolId)}">
            <span>${escapeHtml(item.kind)}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.snippet)}</small>
            <i aria-hidden="true">→</i>
          </button>`).join("")}
      </div>
    </section>`;
}

function downloadBackup(storage) {
  const payload = createWorkspaceBackup(storage);
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `kisisel-araclar-yedek-${localDateKey()}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return Object.keys(payload.entries).length;
}

export function wireP17Workspace(root, storage, onOpenTool, onRefresh) {
  if (!root) return;

  root._p17OpenTool = onOpenTool;
  if (root.dataset.p17Delegated !== "true") {
    root.dataset.p17Delegated = "true";
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tool]");
      if (!button || !root.contains(button)) return;
      const id = String(button.dataset.tool || "");
      const action = String(button.dataset.toolAction || "");
      if (!id || typeof root._p17OpenTool !== "function") return;
      event.preventDefault();
      root._p17OpenTool(id, action);
    });
  }

  const quickNoteForm = root.querySelector("#p25QuickNoteForm");
  quickNoteForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = root.querySelector("#p25QuickNoteInput");
    const text = String(input?.value || "").trim();
    if (!text) {
      input?.focus();
      return;
    }
    const notes = storageJson(storage, NOTES_KEY, []);
    const next = Array.isArray(notes) ? [...notes] : [];
    next.unshift({
      id: makeId("note"),
      title: compactText(text, 48),
      text,
      pinned: false,
      completed: false,
      noteDate: localDateKey(),
      updatedAt: Date.now()
    });
    if (writeJson(storage, NOTES_KEY, next)) {
      input.value = "";
      if (typeof onRefresh === "function") onRefresh();
    }
  });

  root.querySelectorAll("[data-p25-task-toggle]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const id = String(checkbox.dataset.p25TaskToggle || "");
      const tasks = storageJson(storage, TASKS_KEY, []);
      if (!Array.isArray(tasks)) return;
      const next = tasks.map((task) => String(task?.id || "") === id ? { ...task, done: checkbox.checked } : task);
      if (writeJson(storage, TASKS_KEY, next) && typeof onRefresh === "function") onRefresh();
    });
  });

  const status = root.querySelector("#p17BackupStatus");
  const setStatus = (value) => {
    if (status) status.textContent = value;
  };

  root.querySelector("#p17BackupExport")?.addEventListener("click", () => {
    try {
      const count = downloadBackup(storage);
      setStatus(count ? `${count} kayıt grubu yedeklendi.` : "Boş yedek indirildi.");
    } catch {
      setStatus("Yedek oluşturulamadı.");
    }
  });

  const input = root.querySelector("#p17BackupFile");
  root.querySelector("#p17BackupImport")?.addEventListener("click", () => input?.click());
  input?.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > P17_BACKUP_FILE_LIMIT) throw new Error("Yedek dosyası 8 MB sınırını aşıyor.");
      const payload = JSON.parse(await file.text());
      validateWorkspaceBackup(payload);
      const entries = payload?.entries && typeof payload.entries === "object" ? Object.keys(payload.entries).length : 0;
      const accepted = globalThis.confirm?.(`${entries} kayıt grubu bu tarayıcıya geri yüklenecek. Devam edilsin mi?`);
      if (accepted === false) {
        input.value = "";
        return;
      }
      const count = restoreWorkspaceBackup(storage, payload);
      setStatus(`${count} kayıt grubu geri yüklendi. Sayfa yenileniyor…`);
      setTimeout(() => globalThis.location?.reload?.(), 300);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Yedek okunamadı.");
    } finally {
      input.value = "";
    }
  });
}
