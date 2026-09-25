const WORD_TOKEN = /(\s+|[.,;:!?()[\]{}"'“”‘’\-–—/\\]+|[^\s.,;:!?()[\]{}"'“”‘’\-–—/\\]+)/gu;

export const P16_NOTES_KEY = "kisiselaraclar:p16:notes";
export const P16_TASKS_KEY = "kisiselaraclar:p16:tasks";
export const P16_MEETING_KEY = "kisiselaraclar:p16:meeting-draft";

export function uid(prefix = "item", now = Date.now(), random = Math.random()) {
  return `${prefix}-${Number(now).toString(36)}-${Math.floor(Number(random) * 0xffffff).toString(36)}`;
}

export function safeJsonParse(value, fallback) {
  try {
    const parsed = JSON.parse(String(value ?? ""));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function normalizeNotes(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: String(item.id || uid("note")),
      title: String(item.title || ""),
      text: String(item.text || ""),
      pinned: Boolean(item.pinned),
      completed: Boolean(item.completed),
      updatedAt: Number(item.updatedAt) || Date.now()
    }))
    .sort((a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      Number(a.completed) - Number(b.completed) ||
      b.updatedAt - a.updatedAt
    );
}

function noteLineRange(value, start, end) {
  const source = String(value ?? "");
  const safeStart = Math.max(0, Math.min(source.length, Number(start) || 0));
  const safeEnd = Math.max(safeStart, Math.min(source.length, Number(end) || safeStart));
  const lineStart = source.lastIndexOf("\n", Math.max(0, safeStart - 1)) + 1;
  const nextBreak = source.indexOf("\n", safeEnd);
  const lineEnd = nextBreak === -1 ? source.length : nextBreak;
  return { source, start: safeStart, end: safeEnd, lineStart, lineEnd };
}

function stripNoteLinePrefix(line) {
  const match = String(line).match(/^(\s*)(.*)$/s);
  const indent = match?.[1] || "";
  const body = (match?.[2] || "").replace(/^(?:#{1,6}\s+|[-*+]\s+\[(?: |x|X)\]\s+|[-*+]\s+|\d+[.)]\s+)/, "");
  return { indent, body };
}

export function applyNoteMarkdownFormat(value, start, end, action) {
  const range = noteLineRange(value, start, end);
  const source = range.source;
  const selected = source.slice(range.start, range.end);
  const inline = {
    bold: ["**", "**", "metin"],
    italic: ["_", "_", "metin"],
    strike: ["~~", "~~", "metin"]
  };

  if (inline[action]) {
    const [before, after, placeholder] = inline[action];
    const content = selected || placeholder;
    const replacement = before + content + after;
    const next = source.slice(0, range.start) + replacement + source.slice(range.end);
    const selectionStart = range.start + before.length;
    return { value: next, selectionStart, selectionEnd: selectionStart + content.length };
  }

  if (action === "link") {
    const label = selected || "bağlantı";
    const replacement = `[${label}](https://)`;
    const next = source.slice(0, range.start) + replacement + source.slice(range.end);
    const urlStart = range.start + label.length + 3;
    return { value: next, selectionStart: urlStart, selectionEnd: urlStart + 8 };
  }

  const block = source.slice(range.lineStart, range.lineEnd);
  const lines = block.split("\n");
  const nonEmpty = lines.filter((line) => line.trim());
  const allChecked = nonEmpty.length > 0 && nonEmpty.every((line) => /^\s*[-*+]\s+\[[xX]\]\s+/.test(line));

  const mapped = lines.map((line, index) => {
    if (!line.trim()) return line;
    const { indent, body } = stripNoteLinePrefix(line);
    if (action === "bullet") return `${indent}- ${body}`;
    if (action === "number") return `${indent}${index + 1}. ${body}`;
    if (action === "check") return `${indent}- [ ] ${body}`;
    if (action === "check-done") return `${indent}- [${allChecked ? " " : "x"}] ${body}`;
    if (action === "h2") return `${indent}## ${body}`;
    return line;
  }).join("\n");

  const next = source.slice(0, range.lineStart) + mapped + source.slice(range.lineEnd);
  return {
    value: next,
    selectionStart: range.lineStart,
    selectionEnd: range.lineStart + mapped.length
  };
}

export function normalizeTasks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object" && String(item.title || "").trim())
    .map((item) => ({
      id: String(item.id || uid("task")),
      title: String(item.title || "").trim(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || "")) ? String(item.date) : "",
      time: /^\d{2}:\d{2}$/.test(String(item.time || "")) ? String(item.time) : "",
      done: Boolean(item.done),
      createdAt: Number(item.createdAt) || Date.now()
    }))
    .sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done);
      const ak = `${a.date || "9999-99-99"}T${a.time || "99:99"}`;
      const bk = `${b.date || "9999-99-99"}T${b.time || "99:99"}`;
      return ak.localeCompare(bk, "tr");
    });
}

export function tokenizeText(value) {
  return String(value ?? "").match(WORD_TOKEN) || [];
}

function compactOps(ops) {
  const result = [];
  for (const op of ops) {
    const prev = result[result.length - 1];
    if (prev && prev.type === op.type) prev.value += op.value;
    else result.push({ ...op });
  }
  return result;
}

export function diffText(before, after, options = {}) {
  const a = tokenizeText(before);
  const b = tokenizeText(after);
  const maxTokens = Math.max(200, Number(options.maxTokens) || 3500);
  if (a.length + b.length > maxTokens) {
    return diffLines(before, after, { maxLines: Math.floor(maxTokens / 2) });
  }

  const cols = b.length + 1;
  const table = new Uint32Array((a.length + 1) * cols);
  const at = (i, j) => i * cols + j;

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[at(i, j)] = a[i] === b[j]
        ? table[at(i + 1, j + 1)] + 1
        : Math.max(table[at(i + 1, j)], table[at(i, j + 1)]);
    }
  }

  const ops = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ type: "same", value: a[i] });
      i += 1;
      j += 1;
    } else if (table[at(i + 1, j)] >= table[at(i, j + 1)]) {
      ops.push({ type: "removed", value: a[i] });
      i += 1;
    } else {
      ops.push({ type: "added", value: b[j] });
      j += 1;
    }
  }
  while (i < a.length) ops.push({ type: "removed", value: a[i++] });
  while (j < b.length) ops.push({ type: "added", value: b[j++] });

  const compact = compactOps(ops);
  const summary = compact.reduce(
    (acc, op) => {
      if (op.type === "added") acc.added += tokenizeText(op.value).filter((x) => !/^\s+$/.test(x)).length;
      if (op.type === "removed") acc.removed += tokenizeText(op.value).filter((x) => !/^\s+$/.test(x)).length;
      return acc;
    },
    { added: 0, removed: 0, mode: "word" }
  );
  return { ops: compact, summary, equal: before === after };
}

export function diffLines(before, after, options = {}) {
  const maxLines = Math.max(100, Number(options.maxLines) || 1800);
  const a = String(before ?? "").split(/\r?\n/).slice(0, maxLines);
  const b = String(after ?? "").split(/\r?\n/).slice(0, maxLines);
  const aset = new Map();
  a.forEach((line, index) => {
    if (!aset.has(line)) aset.set(line, []);
    aset.get(line).push(index);
  });
  const used = new Set();
  const ops = [];
  for (const line of b) {
    const indexes = aset.get(line) || [];
    const idx = indexes.find((n) => !used.has(n));
    if (idx !== undefined) {
      used.add(idx);
      ops.push({ type: "same", value: `${line}\n` });
    } else {
      ops.push({ type: "added", value: `${line}\n` });
    }
  }
  a.forEach((line, index) => {
    if (!used.has(index)) ops.push({ type: "removed", value: `${line}\n` });
  });
  const compact = compactOps(ops);
  const summary = compact.reduce((acc, op) => {
    const count = op.value.split("\n").filter(Boolean).length;
    if (op.type === "added") acc.added += count;
    if (op.type === "removed") acc.removed += count;
    return acc;
  }, { added: 0, removed: 0, mode: "line" });
  return { ops: compact, summary, equal: before === after };
}

export function buildMeetingMarkdown(data = {}) {
  const title = String(data.title || "Toplantı Notu").trim() || "Toplantı Notu";
  const date = String(data.date || "").trim();
  const participants = String(data.participants || "").trim();
  const notes = String(data.notes || "").trim();
  const decisions = String(data.decisions || "").trim();
  const actions = String(data.actions || "").trim();
  const section = (name, value) => `## ${name}\n\n${value || "—"}`;
  return [
    `# ${title}`,
    date ? `**Tarih:** ${date}` : "",
    participants ? `**Katılanlar:** ${participants}` : "",
    section("Notlar", notes),
    section("Kararlar", decisions),
    section("Aksiyonlar", actions)
  ].filter(Boolean).join("\n\n") + "\n";
}

export function actionLinesToTasks(value, date = "") {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•☐✅✓]\s*/, "").trim())
    .filter(Boolean)
    .map((title, index) => ({
      id: uid("task", Date.now() + index, (index + 1) / 1000),
      title,
      date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
      time: "",
      done: false,
      createdAt: Date.now() + index
    }));
}

function icsEscape(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}
function nextDateValue(date) {
  const [year, month, day] = String(date).split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + 1));
  return value.toISOString().slice(0, 10);
}
function timedIcsEnd(date, time, minutes = 30) {
  const [year, month, day] = String(date).split("-").map(Number);
  const [hour, minute] = String(time).split(":").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, hour, minute + minutes));
  const endDate = value.toISOString().slice(0, 10).replaceAll("-", "");
  const endTime = `${String(value.getUTCHours()).padStart(2, "0")}${String(value.getUTCMinutes()).padStart(2, "0")}00`;
  return `${endDate}T${endTime}`;
}

export function taskToIcs(task, options = {}) {
  const title = String(task?.title || "").trim();
  if (!title) throw new Error("Görev başlığı boş olamaz.");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(task.date || "")) ? String(task.date) : "";
  if (!date) throw new Error("Takvime aktarmak için görev tarihi gerekli.");

  const compactDate = date.replaceAll("-", "");
  const uidValue = `${String(task.id || uid("task"))}@kisiselaraclar.local`;
  const dtstamp = String(options.dtstamp || new Date().toISOString())
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

  let dtstart;
  let dtend;
  if (/^\d{2}:\d{2}$/.test(String(task.time || ""))) {
    const hhmm = String(task.time).replace(":", "");
    dtstart = `DTSTART:${compactDate}T${hhmm}00`;
    dtend = `DTEND:${timedIcsEnd(date, task.time)}`;
  } else {
    dtstart = `DTSTART;VALUE=DATE:${compactDate}`;
    dtend = `DTEND;VALUE=DATE:${nextDateValue(date).replaceAll("-", "")}`;
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kisisel Araclar//P16 Office//TR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${icsEscape(uidValue)}`,
    `DTSTAMP:${dtstamp}`,
    dtstart,
    dtend,
    `SUMMARY:${icsEscape(title)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    ""
  ].join("\r\n");
}

export function tasksToIcs(tasks, options = {}) {
  const valid = normalizeTasks(tasks).filter((task) => task.date && !task.done);
  if (!valid.length) throw new Error("Takvime aktarılacak tarihli açık görev yok.");
  const dtstamp = String(options.dtstamp || new Date().toISOString())
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const events = valid.map((task) => {
    const compactDate = task.date.replaceAll("-", "");
    const uidValue = `${task.id}@kisiselaraclar.local`;
    const start = task.time
      ? `DTSTART:${compactDate}T${task.time.replace(":", "")}00`
      : `DTSTART;VALUE=DATE:${compactDate}`;
    const end = task.time
      ? `DTEND:${timedIcsEnd(task.date, task.time)}`
      : `DTEND;VALUE=DATE:${nextDateValue(task.date).replaceAll("-", "")}`;
    return [
      "BEGIN:VEVENT",
      `UID:${icsEscape(uidValue)}`,
      `DTSTAMP:${dtstamp}`,
      start,
      end,
      `SUMMARY:${icsEscape(task.title)}`,
      "END:VEVENT"
    ].join("\r\n");
  });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kisisel Araclar//P16 Office//TR",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
    ""
  ].join("\r\n");
}

export function monthMatrix(year, monthIndex, tasks = []) {
  const yearNumber = Number(year);
  const month = Number(monthIndex);
  const first = new Date(yearNumber, month, 1);
  const days = new Date(yearNumber, month + 1, 0).getDate();
  const mondayOffset = (first.getDay() + 6) % 7;
  const taskCounts = new Map();
  normalizeTasks(tasks).forEach((task) => {
    if (!task.date) return;
    taskCounts.set(task.date, (taskCounts.get(task.date) || 0) + 1);
  });

  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - mondayOffset + 1;
    if (day < 1 || day > days) return null;
    const date = `${yearNumber}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { day, date, taskCount: taskCounts.get(date) || 0 };
  });
  return { year: yearNumber, month, cells };
}
