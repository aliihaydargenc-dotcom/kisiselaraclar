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
  const todayTasks = open
    .filter((task) => task.date === today)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  const overdueTasks = open
    .filter((task) => task.date && task.date < today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99:99").localeCompare(b.time || "99:99"));
  const upcomingTasks = open
    .filter((task) => task.date && task.date > today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99:99").localeCompare(b.time || "99:99"));
  const latestNote = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
  const pinnedCount = notes.filter((note) => note.pinned).length;

  return {
    today,
    notes,
    tasks,
    meeting,
    hasMeeting: hasMeetingContent(meeting),
    openCount: open.length,
    todayTasks,
    overdueTasks,
    upcomingTasks,
    latestNote,
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

export function buildP17HomeMarkup(storage, now = new Date()) {
  const summary = buildWorkspaceSummary(storage, now);
  const latestNoteTitle = summary.latestNote
    ? summary.latestNote.title || compactText(summary.latestNote.text, 42) || "Adsız not"
    : "";
  const meetingTitle = String(summary.meeting?.title || "").trim() || "Toplantı taslağı";
  const storedCount = Object.keys(collectStorageEntries(storage)).length;

  return `
    <section class="p17-workspace" id="p17Workspace" aria-labelledby="p17Title">
      <div class="p17-workspace-head">
        <div>
          <span class="eyebrow">KİŞİSEL ALAN</span>
          <h2 id="p17Title">Bugün</h2>
        </div>
        <span class="p17-date">${escapeHtml(dateLabel(now))}</span>
      </div>

      <div class="p22-summary-strip" aria-label="Gün özeti">
        <button type="button" data-tool="tasks-calendar">
          <span>Bugün</span>
          <strong>${summary.todayTasks.length}</strong>
        </button>
        <button type="button" data-tool="tasks-calendar">
          <span>Açık görev</span>
          <strong>${summary.openCount}</strong>
        </button>
        <button type="button" data-tool="quick-note">
          <span>Notlar</span>
          <strong>${summary.notes.length}</strong>
        </button>
      </div>

      <div class="p17-main-grid">
        <article class="p17-focus-card">
          <div class="p17-card-head">
            <div>
              <span>Plan</span>
              <h3>Günün planı</h3>
            </div>
            <div class="p17-metrics" aria-label="Görev özeti">
              <span><b>${summary.todayTasks.length}</b> bugün</span>
              <span class="${summary.overdueTasks.length ? "is-alert" : ""}"><b>${summary.overdueTasks.length}</b> geciken</span>
            </div>
          </div>
          ${taskRows(summary)}
          <button type="button" class="p17-link-button" data-tool="tasks-calendar">Görev & Takvim'i aç <span aria-hidden="true">→</span></button>
        </article>

        <article class="p17-actions-card">
          <div class="p17-card-head">
            <div>
              <span>Kısayollar</span>
              <h3>Hızlı işlemler</h3>
            </div>
          </div>
          <div class="p17-action-grid">
            <button type="button" class="p17-action p17-action-file" data-p17-file>
              <i aria-hidden="true">＋</i><span><strong>Dosyayla başla</strong><small>Türünü algıla</small></span>
            </button>
            <button type="button" class="p17-action" data-tool="quick-note" data-tool-action="new-note">
              <i aria-hidden="true">N</i><span><strong>Yeni not</strong><small>Hızlıca yaz</small></span>
            </button>
            <button type="button" class="p17-action" data-tool="tasks-calendar" data-tool-action="new-task">
              <i aria-hidden="true">✓</i><span><strong>Görev ekle</strong><small>Tarih ver</small></span>
            </button>
            <button type="button" class="p17-action" data-tool="meeting-notes" data-tool-action="meeting-focus">
              <i aria-hidden="true">M</i><span><strong>Toplantı</strong><small>Kararları ayır</small></span>
            </button>
            <button type="button" class="p17-action" data-tool="document-scan">
              <i aria-hidden="true">▱</i><span><strong>Belge tara</strong><small>Temizle, PDF yap</small></span>
            </button>
            <button type="button" class="p17-action" data-tool="pdf-fill-sign">
              <i aria-hidden="true">✎</i><span><strong>PDF imzala</strong><small>Doldur ve indir</small></span>
            </button>
          </div>
        </article>
      </div>

      <div class="p17-continuity">
        <div class="p17-continue-copy">
          <span class="eyebrow">DEVAM ET</span>
          <div class="p17-continue-items">
            ${summary.latestNote ? `
              <button type="button" data-tool="quick-note">
                <span>Son not</span>
                <strong>${escapeHtml(latestNoteTitle)}</strong>
              </button>` : `
              <button type="button" data-tool="quick-note">
                <span>Notlar</span>
                <strong>İlk notunu oluştur</strong>
              </button>`}
            ${summary.hasMeeting ? `
              <button type="button" data-tool="meeting-notes">
                <span>Toplantı taslağı</span>
                <strong>${escapeHtml(meetingTitle)}</strong>
              </button>` : `
              <button type="button" data-tool="voice-note">
                <span>Sesli not</span>
                <strong>Konuş, metne dönüşsün</strong>
              </button>`}
          </div>
        </div>

        <div class="p17-backup">
          <div>
            <span>Yerel veri</span>
            <strong>${storedCount ? `${storedCount} kayıt grubu cihazında` : "Henüz kayıtlı veri yok"}</strong>
          </div>
          <div class="p17-backup-actions">
            <button type="button" id="p17BackupExport">Yedekle</button>
            <button type="button" id="p17BackupImport">Geri yükle</button>
            <input id="p17BackupFile" type="file" accept="application/json,.json" hidden />
          </div>
          <small id="p17BackupStatus" aria-live="polite"></small>
        </div>
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

export function wireP17Workspace(root, storage, onOpenTool) {
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
  const status = root.querySelector("#p17BackupStatus");
  const setStatus = (value) => {
    if (status) status.textContent = value;
  };

  root.querySelector("[data-p17-file]")?.addEventListener("click", () => {
    const zone = document.querySelector("#smartDropZone");
    const input = document.querySelector("#smartFileInput");
    zone?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.click();
  });

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
