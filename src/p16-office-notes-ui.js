import { P16_MEETING_KEY, P16_NOTES_KEY, P16_TASKS_KEY, actionLinesToTasks, applyNoteMarkdownFormat, buildMeetingMarkdown, normalizeNotes, normalizeTasks, noteMonthMatrix, uid } from "./p16-office-tools.js";
import { downloadText, e, getJson, localDateValue, putJson, safeName, status, statusLine } from "./p16-office-ui-shared.js";

const NOTE_MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function noteBody() {
  return `
    <div class="p16-note-layout">
      <aside class="p16-note-sidebar">
        <div class="p16-side-head">
          <div><strong>Notlarım</strong><small id="p16NoteCount"></small></div>
          <button class="primary-button" id="p16NewNote">＋ Yeni</button>
        </div>
        <input id="p16NoteSearch" class="text-control p16-note-search" type="search" placeholder="Notlarda ara…" autocomplete="off" aria-label="Notlarda ara" />
        <div class="p16-note-kinds" role="group" aria-label="Not türü">
          <button type="button" class="active" data-note-kind="all">Tümü</button>
          <button type="button" data-note-kind="written">Yazılı</button>
          <button type="button" data-note-kind="voice">Sesli</button>
        </div>
        <div class="p16-note-filters" role="group" aria-label="Not filtresi">
          <button type="button" class="active" data-note-filter="all">Tümü</button>
          <button type="button" data-note-filter="active">Aktif</button>
          <button type="button" data-note-filter="completed">Tamamlandı</button>
        </div>
        <div class="p16-tabs p16-note-view-tabs" role="group" aria-label="Not görünümü">
          <button type="button" class="active" data-note-view="list">Liste</button>
          <button type="button" data-note-view="calendar">Takvim</button>
        </div>
        <div id="p16NoteList" class="p16-note-list"></div>
        <div id="p16NoteCalendar" class="p16-note-calendar hidden"></div>
      </aside>
      <section class="p16-note-editor">
        <div class="p16-note-editor-meta">
          <div class="p16-note-meta-left">
            <button type="button" class="p16-note-state" id="p16CompleteNote" aria-pressed="false">○ Aktif</button>
            <label class="p16-note-date-label">Not tarihi
              <input id="p16NoteDate" type="date" class="text-control p16-note-date" />
            </label>
          </div>
          <span id="p16NoteUpdated">Henüz düzenlenmedi</span>
        </div>
        <textarea id="p16NoteTitle" class="text-control p16-note-title" rows="1" placeholder="Başlık zorunlu değil" aria-label="Not başlığı"></textarea>
        <div class="p16-note-formatbar" role="toolbar" aria-label="Not biçimlendirme">
          <button type="button" data-note-format="bold" title="Kalın"><strong>B</strong></button>
          <button type="button" data-note-format="italic" title="İtalik"><em>I</em></button>
          <button type="button" data-note-format="strike" title="Üstünü çiz"><s>S</s></button>
          <span class="p16-note-toolbar-sep" aria-hidden="true"></span>
          <button type="button" data-note-format="bullet">• Madde</button>
          <button type="button" data-note-format="number">1. Liste</button>
          <button type="button" data-note-format="check">☐ Checklist</button>
          <button type="button" data-note-format="check-done">☑ Yapıldı</button>
          <span class="p16-note-toolbar-sep" aria-hidden="true"></span>
          <button type="button" data-note-format="h2">H2</button>
          <button type="button" data-note-format="link">↗ Link</button>
        </div>
        <textarea id="p16NoteText" class="text-control p16-note-text" spellcheck="true" placeholder="Yazmaya başla…"></textarea>
        <div class="p16-note-bottom">
          <div class="p16-note-hint">Değişiklikler otomatik kaydedilir.</div>
          <div class="action-row">
            <button class="secondary-button" id="p16PinNote">Sabitle</button>
            <button class="secondary-button" id="p16CopyNote">Kopyala</button>
            <button class="secondary-button" id="p16DownloadNote">.md indir</button>
            <button class="text-button p16-danger" id="p16DeleteNote">Sil</button>
          </div>
        </div>
      </section>
    </div>
    ${statusLine("Notlar bu tarayıcıda otomatik kaydedilir.")}`;
}

function wireNote(root) {
  const title = root.querySelector("#p16NoteTitle");
  const text = root.querySelector("#p16NoteText");
  const list = root.querySelector("#p16NoteList");
  const calendar = root.querySelector("#p16NoteCalendar");
  const search = root.querySelector("#p16NoteSearch");
  const count = root.querySelector("#p16NoteCount");
  const complete = root.querySelector("#p16CompleteNote");
  const noteDate = root.querySelector("#p16NoteDate");
  const updated = root.querySelector("#p16NoteUpdated");
  const toolbar = root.querySelector(".p16-note-formatbar");
  let notes = normalizeNotes(getJson(P16_NOTES_KEY, []));
  let active = notes[0]?.id || "";
  let filter = "all";
  let kind = "all";
  let view = "list";
  let selectedDate = notes[0]?.noteDate || localDateValue();
  let calendarCursor = new Date(`${selectedDate}T12:00:00`);

  const persist = () => {
    const saved = putJson(P16_NOTES_KEY, notes);
    status(root, saved ? "Kaydedildi · yalnız bu cihazda." : "Kaydedilemedi · tarayıcı depolamasını kontrol et.");
    return saved;
  };
  const current = () => notes.find((item) => item.id === active);
  const normalizeQuery = (value) => String(value || "").toLocaleLowerCase("tr-TR").trim();
  const previewText = (value) => String(value || "")
    .replace(/\*\*|~~|__|[_#>`]/g, "")
    .replace(/^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  const visibleNotes = () => {
    const query = normalizeQuery(search.value);
    return notes.filter((item) => {
      const isVoice = item.kind === "voice";
      if (kind === "voice" && !isVoice) return false;
      if (kind === "written" && isVoice) return false;
      if (filter === "active" && item.completed) return false;
      if (filter === "completed" && !item.completed) return false;
      return !query || normalizeQuery(`${item.title} ${item.text}`).includes(query);
    });
  };
  const formatDate = (value) => new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });

  const noteButton = (item) => {
    const label = item.title || previewText(item.text).slice(0, 54) || "Adsız not";
    const preview = previewText(item.text);
    return `
      <button class="p16-note-item ${item.id === active ? "active" : ""} ${item.completed ? "completed" : ""}" data-note="${e(item.id)}">
        <span class="p16-note-item-top">
          <strong title="${e(label)}">${item.pinned ? "● " : ""}${e(label)}</strong>
          <i>${item.completed ? "Tamamlandı" : "Aktif"}</i>
        </span>
        ${preview ? `<em>${e(preview.slice(0, 82))}${preview.length > 82 ? "…" : ""}</em>` : ""}
        <small>${e(item.noteDate)} · ${formatDate(item.updatedAt)}</small>
      </button>`;
  };

  const renderList = () => {
    const visible = visibleNotes();
    count.textContent = `${visible.length}/${notes.length}`;
    list.innerHTML = visible.map(noteButton).join("") || `<div class="p16-empty">${search.value ? "Aramana uygun not yok." : "Bu görünümde not yok."}</div>`;
  };

  const renderCalendar = () => {
    const visible = visibleNotes();
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const matrix = noteMonthMatrix(year, month, visible);
    const dayNotes = visible.filter((item) => item.noteDate === selectedDate);
    calendar.innerHTML = `
      <div class="p16-calendar-head">
        <button type="button" data-note-month="-1" aria-label="Önceki ay">‹</button>
        <strong>${NOTE_MONTHS[month]} ${year}</strong>
        <button type="button" data-note-month="1" aria-label="Sonraki ay">›</button>
      </div>
      <div class="p16-weekdays"><span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span></div>
      <div class="p16-calendar-grid">
        ${matrix.cells.map((cell) => cell
          ? `<button type="button" class="${cell.noteCount ? "has-task" : ""} ${cell.date === selectedDate ? "selected" : ""}" data-note-date="${cell.date}">
               ${cell.day}${cell.noteCount ? `<b>${cell.noteCount}</b>` : ""}
             </button>`
          : "<span></span>").join("")}
      </div>
      <div class="p16-note-calendar-day">
        <div class="p16-note-calendar-dayhead">
          <strong>${selectedDate}</strong>
          <button type="button" class="text-button" data-note-create-date="${selectedDate}">＋ Bu güne not</button>
        </div>
        <div class="p16-note-calendar-daylist">
          ${dayNotes.map(noteButton).join("") || '<div class="p16-empty">Bu tarihte not yok.</div>'}
        </div>
      </div>`;
  };

  const renderNavigation = () => {
    const visible = visibleNotes();
    count.textContent = `${visible.length}/${notes.length}`;
    list.classList.toggle("hidden", view !== "list");
    calendar.classList.toggle("hidden", view !== "calendar");
    root.querySelectorAll("[data-note-view]").forEach((button) => button.classList.toggle("active", button.dataset.noteView === view));
    if (view === "list") renderList();
    else renderCalendar();
  };

  const autoGrowTitle = () => {
    title.style.height = "auto";
    const next = Math.min(Math.max(title.scrollHeight, 54), 108);
    title.style.height = `${next}px`;
    title.style.overflowY = title.scrollHeight > 108 ? "auto" : "hidden";
  };

  const loadActive = () => {
    const item = current();
    title.value = item?.title || "";
    text.value = item?.text || "";
    noteDate.value = item?.noteDate || localDateValue();
    root.querySelector("#p16PinNote").textContent = item?.pinned ? "Sabitlemeyi kaldır" : "Sabitle";
    complete.textContent = item?.completed ? "✓ Tamamlandı" : "○ Aktif";
    complete.classList.toggle("completed", Boolean(item?.completed));
    complete.setAttribute("aria-pressed", item?.completed ? "true" : "false");
    updated.textContent = item?.updatedAt ? `Son düzenleme · ${formatDate(item.updatedAt)}` : "Henüz düzenlenmedi";
    autoGrowTitle();
    renderNavigation();
  };

  const create = (date = localDateValue()) => {
    const item = { id: uid("note"), title: "", text: "", pinned: false, completed: false, noteDate: date, updatedAt: Date.now() };
    notes.unshift(item);
    active = item.id;
    selectedDate = date;
    calendarCursor = new Date(`${date}T12:00:00`);
    filter = "all";
    kind = "all";
    search.value = "";
    root.querySelectorAll("[data-note-kind]").forEach((button) => button.classList.toggle("active", button.dataset.noteKind === "all"));
    root.querySelectorAll("[data-note-filter]").forEach((button) => button.classList.toggle("active", button.dataset.noteFilter === "all"));
    persist();
    loadActive();
    text.focus();
  };

  const update = () => {
    let item = current();
    if (!item) {
      create();
      item = current();
    }
    item.title = title.value;
    item.text = text.value;
    item.noteDate = noteDate.value || localDateValue();
    item.updatedAt = Date.now();
    notes = normalizeNotes(notes);
    active = item.id;
    selectedDate = item.noteDate;
    persist();
    updated.textContent = `Son düzenleme · ${formatDate(item.updatedAt)}`;
    renderNavigation();
  };

  let timer;
  const scheduleUpdate = () => {
    clearTimeout(timer);
    status(root, "Kaydediliyor…");
    timer = setTimeout(update, 250);
  };

  title.addEventListener("input", () => { autoGrowTitle(); scheduleUpdate(); });
  text.addEventListener("input", scheduleUpdate);
  noteDate.addEventListener("change", () => {
    if (!noteDate.value) return;
    selectedDate = noteDate.value;
    calendarCursor = new Date(`${selectedDate}T12:00:00`);
    update();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-note]");
    if (!button) return;
    active = button.dataset.note;
    loadActive();
  });
  calendar.addEventListener("click", (event) => {
    const monthButton = event.target.closest("[data-note-month]");
    if (monthButton) {
      calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + Number(monthButton.dataset.noteMonth), 1);
      selectedDate = `${calendarCursor.getFullYear()}-${String(calendarCursor.getMonth() + 1).padStart(2, "0")}-01`;
      renderCalendar();
      return;
    }
    const dayButton = event.target.closest("[data-note-date]");
    if (dayButton) {
      selectedDate = dayButton.dataset.noteDate;
      renderCalendar();
      return;
    }
    const createButton = event.target.closest("[data-note-create-date]");
    if (createButton) {
      create(createButton.dataset.noteCreateDate);
      return;
    }
    const noteButtonNode = event.target.closest("[data-note]");
    if (noteButtonNode) {
      active = noteButtonNode.dataset.note;
      loadActive();
    }
  });

  search.addEventListener("input", renderNavigation);
  root.querySelector(".p16-note-kinds").addEventListener("click", (event) => {
    const button = event.target.closest("[data-note-kind]");
    if (!button) return;
    kind = button.dataset.noteKind;
    root.querySelectorAll("[data-note-kind]").forEach((item) => item.classList.toggle("active", item === button));
    renderNavigation();
  });
  root.querySelector(".p16-note-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-note-filter]");
    if (!button) return;
    filter = button.dataset.noteFilter;
    root.querySelectorAll("[data-note-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderNavigation();
  });
  root.querySelector(".p16-note-view-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-note-view]");
    if (!button) return;
    view = button.dataset.noteView;
    const item = current();
    if (view === "calendar" && item?.noteDate) {
      selectedDate = item.noteDate;
      calendarCursor = new Date(`${selectedDate}T12:00:00`);
    }
    renderNavigation();
  });

  const applyFormat = (action) => {
    const result = applyNoteMarkdownFormat(text.value, text.selectionStart, text.selectionEnd, action);
    text.value = result.value;
    text.focus();
    text.setSelectionRange(result.selectionStart, result.selectionEnd);
    update();
  };
  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-note-format]");
    if (button) applyFormat(button.dataset.noteFormat);
  });
  text.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLocaleLowerCase("tr-TR");
    const action = key === "b" ? "bold" : key === "i" ? "italic" : "";
    if (!action) return;
    event.preventDefault();
    applyFormat(action);
  });

  root.querySelector("#p16NewNote").onclick = () => create(view === "calendar" ? selectedDate : localDateValue());
  root.querySelector("#p16PinNote").onclick = () => {
    const item = current();
    if (!item) return;
    item.pinned = !item.pinned;
    item.updatedAt = Date.now();
    notes = normalizeNotes(notes);
    active = item.id;
    persist();
    loadActive();
  };
  complete.onclick = () => {
    const item = current();
    if (!item) return;
    item.completed = !item.completed;
    item.updatedAt = Date.now();
    notes = normalizeNotes(notes);
    active = item.id;
    persist();
    loadActive();
    status(root, item.completed ? "Not tamamlandı olarak işaretlendi." : "Not yeniden aktif.");
  };
  root.querySelector("#p16DeleteNote").onclick = () => {
    if (!active) return;
    const item = current();
    const label = item?.title || item?.text.slice(0, 28) || "Adsız not";
    const accepted = globalThis.confirm?.(`"${label}" notu silinsin mi?`) ?? true;
    if (!accepted) return;
    clearTimeout(timer);
    notes = notes.filter((entry) => entry.id !== active);
    active = notes[0]?.id || "";
    persist();
    if (active) loadActive();
    else create(selectedDate);
  };
  root.querySelector("#p16CopyNote").onclick = async () => {
    const value = [title.value && `# ${title.value}`, text.value].filter(Boolean).join("\n\n");
    if (!value) return;
    try { await navigator.clipboard.writeText(value); status(root, "Not kopyalandı."); }
    catch { status(root, "Kopyalama izni verilemedi."); }
  };
  root.querySelector("#p16DownloadNote").onclick = () => {
    downloadText([title.value && `# ${title.value}`, text.value].filter(Boolean).join("\n\n"), `${safeName(title.value, "not")}.md`, "text/markdown;charset=utf-8");
  };

  if (!notes.length) create();
  else loadActive();
}

function meetingBody() {
  const today = localDateValue();
  return `
    <div class="p16-meeting-head">
      <input id="p16MeetingTitle" class="text-control" placeholder="Toplantı konusu" />
      <input id="p16MeetingDate" class="text-control" type="date" value="${today}" />
      <input id="p16MeetingPeople" class="text-control" placeholder="Katılanlar" />
    </div>
    <div class="p16-meeting-grid">
      <label>Notlar<textarea id="p16MeetingNotes" class="text-control" placeholder="Konuşulanlar…"></textarea></label>
      <label>Kararlar<textarea id="p16MeetingDecisions" class="text-control" placeholder="Alınan kararlar…"></textarea></label>
      <label class="p16-span-2">Aksiyonlar <small>Her işi ayrı satıra yaz.</small><textarea id="p16MeetingActions" class="text-control" placeholder="Raporu gönder&#10;Sunumu güncelle"></textarea></label>
    </div>
    <div class="action-row">
      <button class="primary-button" id="p16MeetingTasks">Aksiyonları göreve dönüştür</button>
      <button class="secondary-button" id="p16MeetingCopy">Özeti kopyala</button>
      <button class="secondary-button" id="p16MeetingDownload">Markdown indir</button>
      <button class="text-button" id="p16MeetingClear">Temizle</button>
    </div>
    ${statusLine("Toplantı taslağı otomatik kaydedilir.")}`;
}

function wireMeeting(root) {
  const ids = ["Title", "Date", "People", "Notes", "Decisions", "Actions"];
  const nodes = Object.fromEntries(ids.map((id) => [id, root.querySelector(`#p16Meeting${id}`)]));
  const saved = getJson(P16_MEETING_KEY, {});
  nodes.Title.value = saved.title || "";
  nodes.Date.value = saved.date || nodes.Date.value;
  nodes.People.value = saved.participants || "";
  nodes.Notes.value = saved.notes || "";
  nodes.Decisions.value = saved.decisions || "";
  nodes.Actions.value = saved.actions || "";

  const data = () => ({
    title: nodes.Title.value,
    date: nodes.Date.value,
    participants: nodes.People.value,
    notes: nodes.Notes.value,
    decisions: nodes.Decisions.value,
    actions: nodes.Actions.value
  });
  const saveDraft = () => {
    const saved = putJson(P16_MEETING_KEY, data());
    status(root, saved ? "Taslak kaydedildi." : "Taslak kaydedilemedi · tarayıcı depolamasını kontrol et.");
    return saved;
  };
  let timer;
  Object.values(nodes).forEach((node) => node.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(saveDraft, 250);
  }));
  root.querySelector("#p16MeetingTasks").onclick = () => {
    const existing = normalizeTasks(getJson(P16_TASKS_KEY, []));
    const additions = actionLinesToTasks(nodes.Actions.value, nodes.Date.value);
    const keys = new Set(existing.map((task) => `${task.title.toLocaleLowerCase("tr-TR")}\u0000${task.date}`));
    const unique = [];
    for (const task of additions) {
      const key = `${task.title.toLocaleLowerCase("tr-TR")}\u0000${task.date}`;
      if (keys.has(key)) continue;
      keys.add(key);
      unique.push(task);
    }
    if (!additions.length) {
      status(root, "Aksiyon satırı bulunamadı.");
      return;
    }
    if (!unique.length) {
      status(root, "Bu aksiyonlar zaten Görev & Takvim'de.");
      return;
    }
    const saved = putJson(P16_TASKS_KEY, normalizeTasks([...existing, ...unique]));
    if (!saved) {
      status(root, "Görevler kaydedilemedi · tarayıcı depolamasını kontrol et.");
      return;
    }
    const skipped = additions.length - unique.length;
    status(root, `${unique.length} aksiyon Görev & Takvim'e eklendi.${skipped ? ` · ${skipped} tekrar atlandı.` : ""}`);
  };
  root.querySelector("#p16MeetingCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(buildMeetingMarkdown(data())); status(root, "Toplantı özeti kopyalandı."); }
    catch { status(root, "Kopyalama izni verilemedi."); }
  };
  root.querySelector("#p16MeetingDownload").onclick = () => {
    downloadText(buildMeetingMarkdown(data()), `${safeName(nodes.Title.value, "toplanti-notu")}.md`, "text/markdown;charset=utf-8");
  };
  root.querySelector("#p16MeetingClear").onclick = () => {
    const accepted = globalThis.confirm?.("Toplantı taslağındaki metinler temizlensin mi?") ?? true;
    if (!accepted) return;
    Object.values(nodes).forEach((node) => { if (node.type !== "date") node.value = ""; });
    const saved = putJson(P16_MEETING_KEY, data());
    status(root, saved ? "Toplantı taslağı temizlendi." : "Taslak temizlendi ancak cihazda kaydedilemedi.");
  };
}


const VIEWS = {
  "quick-note": { body: noteBody, wire: wireNote },
  "meeting-notes": { body: meetingBody, wire: wireMeeting }
};
export const getNotesOfficeView = (mode) => VIEWS[mode];
