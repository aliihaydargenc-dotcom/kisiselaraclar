import { P16_NOTES_KEY, P16_TASKS_KEY, monthMatrix, normalizeNotes, normalizeTasks, tasksToIcs, uid } from "./p16-office-tools.js";
import { downloadText, e, getJson, localDateValue, putJson, status, statusLine } from "./p16-office-ui-shared.js";

function tasksBody() {
  const today = localDateValue();
  return `
    <div class="p16-task-create">
      <input id="p16TaskTitle" class="text-control" placeholder="Ne yapılacak?" />
      <input id="p16TaskDate" class="text-control" type="date" value="${today}" />
      <input id="p16TaskTime" class="text-control" type="time" />
      <button class="primary-button" id="p16TaskAdd">Ekle</button>
    </div>
    <div class="p16-task-layout">
      <section>
        <div class="p16-tabs">
          <button class="active" data-task-filter="open">Açık</button>
          <button data-task-filter="today">Bugün</button>
          <button data-task-filter="done">Tamamlanan</button>
        </div>
        <div id="p16TaskList" class="p16-task-list"></div>
        <div class="action-row">
          <button class="secondary-button" id="p16TaskIcs">Açık tarihli görevleri .ics indir</button>
        </div>
      </section>
      <aside class="p16-calendar">
        <div class="p16-calendar-head">
          <button id="p16PrevMonth" aria-label="Önceki ay">←</button>
          <strong id="p16MonthTitle"></strong>
          <button id="p16NextMonth" aria-label="Sonraki ay">→</button>
        </div>
        <div class="p16-weekdays"><span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span></div>
        <div id="p16CalendarGrid" class="p16-calendar-grid"></div>
      </aside>
    </div>
    ${statusLine("Görevler ve takvim bu cihazda tutulur.")}`;
}

function wireTasks(root) {
  let tasks = normalizeTasks(getJson(P16_TASKS_KEY, []));
  let filter = "open";
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  const list = root.querySelector("#p16TaskList");
  const grid = root.querySelector("#p16CalendarGrid");

  const persist = () => putJson(P16_TASKS_KEY, tasks);
  const visible = () => {
    const today = localDateValue();
    if (filter === "today") return tasks.filter((task) => !task.done && task.date === today);
    if (filter === "done") return tasks.filter((task) => task.done);
    return tasks.filter((task) => !task.done);
  };
  const renderList = () => {
    const items = visible();
    list.innerHTML = items.map((task) => `
      <article class="p16-task ${task.done ? "done" : ""}">
        <label><input type="checkbox" data-task-done="${e(task.id)}" ${task.done ? "checked" : ""}><span>${e(task.title)}</span></label>
        <small>${task.date ? e(task.date.split("-").reverse().join(".")) : "Tarihsiz"}${task.time ? ` · ${e(task.time)}` : ""}</small>
        <button class="text-button p16-danger" data-task-delete="${e(task.id)}">Sil</button>
      </article>`).join("") || `<div class="p16-empty">Bu görünümde görev yok.</div>`;
  };
  const renderCalendar = () => {
    const matrix = monthMatrix(year, month, tasks);
    root.querySelector("#p16MonthTitle").textContent = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(new Date(year, month, 1));
    grid.innerHTML = matrix.cells.map((cell) => cell
      ? `<button data-calendar-date="${cell.date}" class="${cell.taskCount ? "has-task" : ""}"><span>${cell.day}</span>${cell.taskCount ? `<b>${cell.taskCount}</b>` : ""}</button>`
      : `<span></span>`).join("");
  };
  const render = () => {
    tasks = normalizeTasks(tasks);
    renderList();
    renderCalendar();
    return persist();
  };
  root.querySelector("#p16TaskAdd").onclick = () => {
    const title = root.querySelector("#p16TaskTitle");
    if (!title.value.trim()) { status(root, "Görev başlığı yaz."); return; }
    tasks.push({
      id: uid("task"),
      title: title.value.trim(),
      date: root.querySelector("#p16TaskDate").value,
      time: root.querySelector("#p16TaskTime").value,
      done: false,
      createdAt: Date.now()
    });
    title.value = "";
    const saved = render();
    status(root, saved ? "Görev eklendi." : "Görev eklendi ancak cihazda kaydedilemedi.");
  };
  root.querySelector(".p16-tabs").onclick = (event) => {
    const button = event.target.closest("[data-task-filter]");
    if (!button) return;
    filter = button.dataset.taskFilter;
    root.querySelectorAll("[data-task-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderList();
  };
  list.onclick = (event) => {
    const done = event.target.closest("[data-task-done]");
    if (done) {
      const task = tasks.find((item) => item.id === done.dataset.taskDone);
      if (task) task.done = done.checked;
      const saved = render();
      if (!saved) status(root, "Değişiklik cihazda kaydedilemedi.");
      return;
    }
    const del = event.target.closest("[data-task-delete]");
    if (del) {
      const task = tasks.find((item) => item.id === del.dataset.taskDelete);
      const accepted = globalThis.confirm?.(`"${task?.title || "Görev"}" silinsin mi?`) ?? true;
      if (!accepted) return;
      tasks = tasks.filter((item) => item.id !== del.dataset.taskDelete);
      const saved = render();
      status(root, saved ? "Görev silindi." : "Görev silindi ancak cihazda kaydedilemedi.");
    }
  };
  root.querySelector("#p16PrevMonth").onclick = () => { month -= 1; if (month < 0) { month = 11; year -= 1; } renderCalendar(); };
  root.querySelector("#p16NextMonth").onclick = () => { month += 1; if (month > 11) { month = 0; year += 1; } renderCalendar(); };
  grid.onclick = (event) => {
    const button = event.target.closest("[data-calendar-date]");
    if (!button) return;
    root.querySelector("#p16TaskDate").value = button.dataset.calendarDate;
    const title = root.querySelector("#p16TaskTitle");
    root.querySelector(".p16-task-create")?.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => title?.focus({ preventScroll: true }));
    status(root, `${button.dataset.calendarDate.split("-").reverse().join(".")} seçildi · görev başlığını yaz.`);
  };
  root.querySelector("#p16TaskIcs").onclick = () => {
    try {
      downloadText(tasksToIcs(tasks), "gorevler.ics", "text/calendar;charset=utf-8");
      status(root, "Takvim dosyası indirildi.");
    } catch (error) { status(root, error.message); }
  };
  render();
}

function voiceBody() {
  return `
    <div class="p16-voice">
      <div class="p16-voice-saved-head">
        <div><strong>Sesli notlarım</strong><small>Kaydedilmiş konuşmalarını aç ve düzenle.</small></div>
        <button class="secondary-button" id="p16VoiceNew">＋ Yeni</button>
      </div>
      <div class="p16-voice-saved" id="p16VoiceSaved"></div>
      <div class="p16-mic" id="p16Mic" aria-hidden="true"><span></span></div>
      <select id="p16VoiceLang" class="text-control"><option value="tr-TR">Türkçe</option><option value="en-US">English</option></select>
      <div class="action-row">
        <button class="primary-button" id="p16VoiceStart">Dinlemeyi başlat</button>
        <button class="secondary-button" id="p16VoiceStop" disabled>Durdur</button>
      </div>
      <textarea id="p16VoiceText" class="text-control p16-voice-text" placeholder="Konuşma burada yazıya dönüşür. Kaydetmeden önce metni istediğin gibi düzeltebilirsin."></textarea>
      <div class="action-row">
        <button class="secondary-button" id="p16VoiceSave">Sesli notu kaydet</button>
        <button class="secondary-button" id="p16VoiceCopy">Kopyala</button>
      </div>
    </div>
    ${statusLine("Sesli notların bu cihazda ve bulut senkronunda Notlar ile birlikte tutulur.")}`;
}

function wireVoice(root) {
  const SpeechRecognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  const text = root.querySelector("#p16VoiceText");
  const start = root.querySelector("#p16VoiceStart");
  const stop = root.querySelector("#p16VoiceStop");
  const mic = root.querySelector("#p16Mic");
  const savedRoot = root.querySelector("#p16VoiceSaved");
  let notes = normalizeNotes(getJson(P16_NOTES_KEY, []));
  let activeId = notes.find((note) => note.kind === "voice")?.id || "";
  let finalText = "";

  const polish = (value) => String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|[.!?]\s+)([a-zçğıöşü])/g, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("tr-TR")}`);

  const voiceNotes = () => notes.filter((note) => note.kind === "voice");

  const renderSaved = () => {
    const list = voiceNotes();
    savedRoot.innerHTML = list.length
      ? list.map((note) => `
          <button type="button" class="secondary-button p16-voice-saved-item ${note.id === activeId ? "active" : ""}" data-voice-note-id="${e(note.id)}">
            <strong>${e((note.text || "Sesli not").slice(0, 72))}${(note.text || "").length > 72 ? "…" : ""}</strong>
            <small>${new Date(note.updatedAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</small>
          </button>`).join("")
      : '<div class="p16-empty">Henüz kayıtlı sesli not yok.</div>';
  };

  const loadActive = () => {
    const note = notes.find((item) => item.id === activeId);
    text.value = note?.text || "";
    finalText = text.value ? `${text.value.trim()} ` : "";
    renderSaved();
  };

  const persist = () => putJson(P16_NOTES_KEY, notes);

  savedRoot.addEventListener("click", (event) => {
    const button = event.target.closest("[data-voice-note-id]");
    if (!button) return;
    activeId = button.dataset.voiceNoteId;
    loadActive();
    text.focus();
    status(root, "Sesli not düzenlemeye açıldı.");
  });

  root.querySelector("#p16VoiceNew").onclick = () => {
    activeId = "";
    text.value = "";
    finalText = "";
    renderSaved();
    text.focus();
    status(root, "Yeni sesli not hazır.");
  };

  if (!SpeechRecognition) {
    start.disabled = true;
    status(root, "Bu tarayıcı konuşma tanıma API'sini desteklemiyor. Kayıtlı sesli notlarını yine düzenleyebilirsin.");
  } else {
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => {
      start.disabled = true;
      stop.disabled = false;
      mic.classList.add("active");
      status(root, "Dinleniyor… Metni bitince düzenleyebilirsin.");
    };
    rec.onend = () => {
      start.disabled = false;
      stop.disabled = true;
      mic.classList.remove("active");
      text.value = polish(text.value);
      status(root, "Dinleme durdu. Metni kontrol edip kaydedebilirsin.");
    };
    rec.onerror = (event) => status(root, `Ses tanıma hatası: ${event.error || "bilinmeyen hata"}.`);
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const part = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += `${part.trim()} `;
        else interim += part;
      }
      text.value = polish(`${finalText}${interim}`);
    };
    start.onclick = () => {
      finalText = text.value ? `${text.value.trim()} ` : "";
      rec.lang = root.querySelector("#p16VoiceLang").value;
      try { rec.start(); }
      catch { status(root, "Dinleme başlatılamadı. Mikrofon iznini ve tarayıcı desteğini kontrol et."); }
    };
    stop.onclick = () => rec.stop();
  }

  root.querySelector("#p16VoiceCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(text.value); status(root, "Metin kopyalandı."); }
    catch { status(root, "Kopyalama izni verilemedi."); }
  };

  root.querySelector("#p16VoiceSave").onclick = () => {
    const value = polish(text.value);
    if (!value) { status(root, "Kaydedilecek metin yok."); return; }
    const now = Date.now();
    if (activeId) {
      const index = notes.findIndex((note) => note.id === activeId);
      if (index >= 0) notes[index] = { ...notes[index], kind: "voice", text: value, updatedAt: now };
    } else {
      const item = { id: uid("note"), title: `Sesli Not · ${new Date(now).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`, text: value, kind: "voice", pinned: false, completed: false, noteDate: localDateValue(), updatedAt: now };
      notes.unshift(item);
      activeId = item.id;
    }
    notes = normalizeNotes(notes);
    const saved = persist();
    text.value = value;
    renderSaved();
    status(root, saved ? "Sesli not kaydedildi." : "Sesli not cihazda kaydedilemedi.");
  };

  loadActive();
}


const VIEWS = {
  "tasks-calendar": { body: tasksBody, wire: wireTasks },
  "voice-note": { body: voiceBody, wire: wireVoice }
};
export const getTasksOfficeView = (mode) => VIEWS[mode];
