import test from "node:test";
import assert from "node:assert/strict";
import {
  P17_BACKUP_ENTRY_LIMIT,
  P17_BACKUP_SCHEMA,
  P17_BACKUP_VALUE_LIMIT,
  buildWorkspaceSummary,
  createWorkspaceBackup,
  restoreWorkspaceBackup,
  searchWorkspaceContent,
  validateWorkspaceBackup
} from "../src/p17-workspace.js";

function storageOf(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key(index) { return [...map.keys()][index] ?? null; },
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(String(key), String(value)); },
    dump() { return Object.fromEntries(map); }
  };
}

test("P17 bugün ve geciken görevleri ayırır", () => {
  const storage = storageOf({
    "kisiselaraclar:p16:tasks": JSON.stringify([
      { id: "1", title: "Bugün", date: "2026-09-24", time: "10:00", done: false },
      { id: "2", title: "Eski", date: "2026-09-23", done: false },
      { id: "3", title: "Bitti", date: "2026-09-24", done: true }
    ])
  });
  const summary = buildWorkspaceSummary(storage, new Date(2026, 8, 24, 12, 0, 0));
  assert.equal(summary.todayTasks.length, 1);
  assert.equal(summary.overdueTasks.length, 1);
  assert.equal(summary.openCount, 2);
});

test("P17 yedeği yalnız Kişisel Araçlar anahtarlarını taşır", () => {
  const storage = storageOf({
    "kisiselaraclar:p16:notes": "[]",
    "other-app:key": "secret"
  });
  const backup = createWorkspaceBackup(storage, new Date("2026-09-24T12:00:00Z"));
  assert.equal(backup.schema, P17_BACKUP_SCHEMA);
  assert.deepEqual(Object.keys(backup.entries), ["kisiselaraclar:p16:notes"]);
});

test("P17 yedeği güvenli biçimde geri yükler", () => {
  const storage = storageOf();
  const count = restoreWorkspaceBackup(storage, {
    schema: P17_BACKUP_SCHEMA,
    version: 1,
    entries: {
      "kisiselaraclar:p16:notes": "[1]",
      "not-allowed": "x"
    }
  });
  assert.equal(count, 1);
  assert.equal(storage.getItem("kisiselaraclar:p16:notes"), "[1]");
  assert.equal(storage.getItem("not-allowed"), null);
});

test("P17 araması not, görev ve toplantı içeriğini bulur", () => {
  const storage = storageOf({
    "kisiselaraclar:p16:notes": JSON.stringify([{ id: "n", title: "Rapor", text: "Haftalık gelir özeti", updatedAt: 1 }]),
    "kisiselaraclar:p16:tasks": JSON.stringify([{ id: "t", title: "Gelir raporunu gönder", done: false }]),
    "kisiselaraclar:p16:meeting-draft": JSON.stringify({ title: "Haftalık toplantı", notes: "Gelir raporu konuşuldu" })
  });
  const results = searchWorkspaceContent(storage, "gelir");
  assert.equal(results.length, 3);
  assert.deepEqual(new Set(results.map((item) => item.toolId)), new Set(["quick-note", "tasks-calendar", "meeting-notes"]));
});


test("P17 yedek doğrulaması aşırı kayıt ve büyük değerleri reddeder", () => {
  const tooMany = Object.fromEntries(Array.from({ length: P17_BACKUP_ENTRY_LIMIT + 1 }, (_, index) => [
    `kisiselaraclar:test:${index}`,
    "x"
  ]));
  assert.throws(() => validateWorkspaceBackup({
    schema: P17_BACKUP_SCHEMA,
    version: 1,
    entries: tooMany
  }), /en fazla/);

  assert.throws(() => validateWorkspaceBackup({
    schema: P17_BACKUP_SCHEMA,
    version: 1,
    entries: { "kisiselaraclar:test": "x".repeat(P17_BACKUP_VALUE_LIMIT + 1) }
  }), /2 MB/);
});

test("P17 hızlı işler gerçek eylem niyeti taşır", async () => {
  const storage = storageOf();
  const { buildP17HomeMarkup } = await import("../src/p17-workspace.js");
  const html = buildP17HomeMarkup(storage, new Date(2026, 8, 24, 12, 0, 0));
  assert.match(html, /data-tool="quick-note" data-tool-action="new-note"/);
  assert.match(html, /data-tool="tasks-calendar" data-tool-action="new-task"/);
});
