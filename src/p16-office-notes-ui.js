import { P16_MEETING_KEY, P16_NOTES_KEY, P16_TASKS_KEY, actionLinesToTasks, buildMeetingMarkdown, normalizeNotes, normalizeTasks, uid } from "./p16-office-tools.js";
import { downloadText, e, getJson, localDateValue, putJson, safeName, status, statusLine } from "./p16-office-ui-shared.js";

function noteBody() {
  return `
    <div class="p16-note-layout">
      <aside class="p16-note-sidebar">
        <div class="p16-side-head"><strong>Notlarım</strong><button class="primary-button" id="p16NewNote">＋ Yeni</button></div>
        <div id="p16NoteList" class="p16-note-list"></div>
      </aside>
      <section class="p16-note-editor">
        <input id="p16NoteTitle" class="text-control p16-note-title" placeholder="Başlık zorunlu değil" />
        <textarea id="p16NoteText" class="text-control p16-note-text" placeholder="Yazmaya başla…"></textarea>
        <div class="action-row">
          <button class="secondary-button" id="p16PinNote">Sabitle</button>
          <button class="secondary-button" id="p16CopyNote">Kopyala</button>
          <button class="secondary-button" id="p16DownloadNote">.md indir</button>
          <button class="text-button p16-danger" id="p16DeleteNote">Sil</button>
        </div>
      </section>
    </div>
    ${statusLine("Notlar bu tarayıcıda otomatik kaydedilir.")}`;
}

function wireNote(root) {
  const title = root.querySelector("#p16NoteTitle");
  const text = root.querySelector("#p16NoteText");
  const list = root.querySelector("#p16NoteList");
  let notes = normalizeNotes(getJson(P16_NOTES_KEY, []));
  let active = notes[0]?.id || "";

  const persist = () => {
    putJson(P16_NOTES_KEY, notes);
    status(root, "Kaydedildi · yalnız bu cihazda.");
  };
  const current = () => notes.find((item) => item.id === active);
  const renderList = () => {
    list.innerHTML = notes.map((item) => `
      <button class="p16-note-item ${item.id === active ? "active" : ""}" data-note="${e(item.id)}">
        <span>${item.pinned ? "● " : ""}${e(item.title || item.text.slice(0, 34) || "Adsız not")}</span>
        <small>${new Date(item.updatedAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</small>
      </button>`).join("") || `<div class="p16-empty">Henüz not yok.</div>`;
  };
  const loadActive = () => {
    const item = current();
    title.value = item?.title || "";
    text.value = item?.text || "";
    root.querySelector("#p16PinNote").textContent = item?.pinned ? "Sabitlemeyi kaldır" : "Sabitle";
    renderList();
  };
  const create = () => {
    const item = { id: uid("note"), title: "", text: "", pinned: false, updatedAt: Date.now() };
    notes.unshift(item);
    active = item.id;
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
    item.updatedAt = Date.now();
    notes = normalizeNotes(notes);
    active = item.id;
    persist();
    renderList();
  };
  let timer;
  [title, text].forEach((node) => node.addEventListener("input", () => {
    clearTimeout(timer);
    status(root, "Kaydediliyor…");
    timer = setTimeout(update, 250);
  }));
  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-note]");
    if (!button) return;
    active = button.dataset.note;
    loadActive();
  });
  root.querySelector("#p16NewNote").onclick = create;
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
  root.querySelector("#p16DeleteNote").onclick = () => {
    if (!active) return;
    notes = notes.filter((item) => item.id !== active);
    active = notes[0]?.id || "";
    persist();
    loadActive();
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
  if (!notes.length) create(); else loadActive();
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
  let timer;
  Object.values(nodes).forEach((node) => node.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => { putJson(P16_MEETING_KEY, data()); status(root, "Taslak kaydedildi."); }, 250);
  }));
  root.querySelector("#p16MeetingTasks").onclick = () => {
    const additions = actionLinesToTasks(nodes.Actions.value, nodes.Date.value);
    const tasks = normalizeTasks([...getJson(P16_TASKS_KEY, []), ...additions]);
    putJson(P16_TASKS_KEY, tasks);
    status(root, additions.length ? `${additions.length} aksiyon Görev & Takvim'e eklendi.` : "Aksiyon satırı bulunamadı.");
  };
  root.querySelector("#p16MeetingCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(buildMeetingMarkdown(data())); status(root, "Toplantı özeti kopyalandı."); }
    catch { status(root, "Kopyalama izni verilemedi."); }
  };
  root.querySelector("#p16MeetingDownload").onclick = () => {
    downloadText(buildMeetingMarkdown(data()), `${safeName(nodes.Title.value, "toplanti-notu")}.md`, "text/markdown;charset=utf-8");
  };
  root.querySelector("#p16MeetingClear").onclick = () => {
    Object.values(nodes).forEach((node) => { if (node.type !== "date") node.value = ""; });
    putJson(P16_MEETING_KEY, data());
    status(root, "Toplantı taslağı temizlendi.");
  };
}


const VIEWS = {
  "quick-note": { body: noteBody, wire: wireNote },
  "meeting-notes": { body: meetingBody, wire: wireMeeting }
};
export const getNotesOfficeView = (mode) => VIEWS[mode];
