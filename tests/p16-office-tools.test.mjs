import test from "node:test";
import assert from "node:assert/strict";
import {
  actionLinesToTasks,
  applyNoteMarkdownFormat,
  buildMeetingMarkdown,
  diffText,
  monthMatrix,
  normalizeNotes,
  noteMonthMatrix,
  normalizeTasks,
  taskToIcs,
  tasksToIcs
} from "../src/p16-office-tools.js";

test("metin farkı ekleme ve silmeyi bulur", () => {
  const result = diffText("Merhaba dünya", "Merhaba güzel dünya");
  assert.equal(result.equal, false);
  assert.ok(result.summary.added >= 1);
  assert.equal(result.summary.removed, 0);
  assert.ok(result.ops.some((item) => item.type === "added" && item.value.includes("güzel")));
});

test("toplantı markdown çıktısı temel alanları taşır", () => {
  const md = buildMeetingMarkdown({
    title: "P16",
    date: "2026-09-24",
    participants: "Ali, Ayşe",
    decisions: "Yayınla",
    actions: "Kontrol et"
  });
  assert.match(md, /# P16/);
  assert.match(md, /\*\*Tarih:\*\* 2026-09-24/);
  assert.match(md, /## Kararlar/);
  assert.match(md, /Kontrol et/);
});

test("aksiyon satırları görevlere dönüşür", () => {
  const tasks = actionLinesToTasks("- Raporu gönder\n• Sunumu güncelle", "2026-09-25");
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].title, "Raporu gönder");
  assert.equal(tasks[1].date, "2026-09-25");
});

test("görev normalizasyonu tarihe göre açıkları öne alır", () => {
  const tasks = normalizeTasks([
    { id: "b", title: "B", date: "2026-10-02", done: false },
    { id: "a", title: "A", date: "2026-09-25", done: false },
    { id: "c", title: "C", date: "2026-09-20", done: true }
  ]);
  assert.deepEqual(tasks.map((item) => item.id), ["a", "b", "c"]);
});

test("tek görev ICS üretir", () => {
  const ics = taskToIcs(
    { id: "x", title: "Sunumu gönder", date: "2026-09-25", time: "15:30" },
    { dtstamp: "2026-09-24T20:00:00.000Z" }
  );
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART:20260925T153000/);
  assert.match(ics, /DTEND:20260925T160000/);
  assert.match(ics, /SUMMARY:Sunumu gönder/);
});

test("tüm gün ICS bitiş tarihini ertesi gün yapar", () => {
  const ics = taskToIcs(
    { id: "all", title: "Kontrol", date: "2026-09-25", time: "" },
    { dtstamp: "2026-09-24T20:00:00.000Z" }
  );
  assert.match(ics, /DTSTART;VALUE=DATE:20260925/);
  assert.match(ics, /DTEND;VALUE=DATE:20260926/);
});

test("gece görevi ICS bitişini ertesi güne taşır", () => {
  const ics = taskToIcs(
    { id: "late", title: "Gece kontrolü", date: "2026-09-25", time: "23:50" },
    { dtstamp: "2026-09-24T20:00:00.000Z" }
  );
  assert.match(ics, /DTEND:20260926T002000/);
});

test("çoklu ICS yalnız açık ve tarihli görevleri alır", () => {
  const ics = tasksToIcs([
    { id: "1", title: "A", date: "2026-09-25", done: false },
    { id: "2", title: "B", date: "", done: false },
    { id: "3", title: "C", date: "2026-09-26", done: true }
  ], { dtstamp: "2026-09-24T20:00:00.000Z" });
  assert.match(ics, /SUMMARY:A/);
  assert.doesNotMatch(ics, /SUMMARY:B/);
  assert.doesNotMatch(ics, /SUMMARY:C/);
});

test("ay matrisi görev sayısını doğru güne işler", () => {
  const matrix = monthMatrix(2026, 8, [
    { id: "1", title: "A", date: "2026-09-24", done: false },
    { id: "2", title: "B", date: "2026-09-24", done: false }
  ]);
  const cell = matrix.cells.find((item) => item?.date === "2026-09-24");
  assert.equal(cell.taskCount, 2);
});


test("not biçimlendirici seçili metni kalın ve üstü çizili yapar", () => {
  const bold = applyNoteMarkdownFormat("Merhaba dünya", 8, 13, "bold");
  assert.equal(bold.value, "Merhaba **dünya**");
  const strike = applyNoteMarkdownFormat("Bitti", 0, 5, "strike");
  assert.equal(strike.value, "~~Bitti~~");
});

test("not biçimlendirici checklist ve tamamlanan madde üretir", () => {
  const check = applyNoteMarkdownFormat("Raporu gönder\nSunumu güncelle", 0, 28, "check");
  assert.equal(check.value, "- [ ] Raporu gönder\n- [ ] Sunumu güncelle");
  const done = applyNoteMarkdownFormat(check.value, 0, check.value.length, "check-done");
  assert.equal(done.value, "- [x] Raporu gönder\n- [x] Sunumu güncelle");
  const reopen = applyNoteMarkdownFormat(done.value, 0, done.value.length, "check-done");
  assert.equal(reopen.value, "- [ ] Raporu gönder\n- [ ] Sunumu güncelle");
});

test("not biçimlendirici madde ve numaralı liste uygular", () => {
  const bullet = applyNoteMarkdownFormat("Bir\nİki", 0, 7, "bullet");
  assert.equal(bullet.value, "- Bir\n- İki");
  const numbered = applyNoteMarkdownFormat("Bir\nİki", 0, 7, "number");
  assert.equal(numbered.value, "1. Bir\n2. İki");
});


test("eski notlar takvim tarihi olmadan da gün anahtarı kazanır", () => {
  const updatedAt = new Date(2026, 8, 25, 9, 30).getTime();
  const notes = normalizeNotes([{ id: "n1", title: "Test", updatedAt }]);
  assert.equal(notes[0].noteDate, "2026-09-25");
});

test("not takvimi gün başına not sayısını üretir", () => {
  const matrix = noteMonthMatrix(2026, 8, [
    { id: "1", title: "A", noteDate: "2026-09-25", updatedAt: 1 },
    { id: "2", title: "B", noteDate: "2026-09-25", updatedAt: 2 },
    { id: "3", title: "C", noteDate: "2026-09-26", updatedAt: 3 }
  ]);
  assert.equal(matrix.cells.find((item) => item?.date === "2026-09-25")?.noteCount, 2);
  assert.equal(matrix.cells.find((item) => item?.date === "2026-09-26")?.noteCount, 1);
});
