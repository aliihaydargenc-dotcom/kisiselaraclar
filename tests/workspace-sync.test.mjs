import test from "node:test";
import assert from "node:assert/strict";
import {
  entityRowId,
  mergeEntityCollection
} from "../src/workspace-sync.js";

test("P34.2 uzun yerel kimlik Appwrite row id sınırına güvenli eşlenir", () => {
  const id = "note-mugv6ns7-6337e875-4986-4f44-9c86-803d99953119";
  const rowId = entityRowId(id);
  assert.ok(rowId.length <= 36);
  assert.match(rowId, /^[A-Za-z0-9][A-Za-z0-9._-]*$/);
  assert.equal(entityRowId(id), rowId);
});

test("P34.2 ilk entity migration yerel notları cloud write listesine taşır", () => {
  const result = mergeEntityCollection({
    type: "notes",
    localItems: [{ id: "note-1", text: "yerel", updatedAt: 100 }],
    cloudRows: [],
    baseline: {},
    now: 200
  });
  assert.equal(result.items[0].text, "yerel");
  assert.equal(result.writes.length, 1);
  assert.equal(result.writes[0].deletedAt, 0);
});

test("P34.2 daha yeni cloud kaydı yerel kaydı ezer", () => {
  const result = mergeEntityCollection({
    type: "notes",
    localItems: [{ id: "note-1", text: "eski", updatedAt: 100 }],
    cloudRows: [{
      local_id: "note-1",
      updated_at: 200,
      deleted_at: 0,
      payload: JSON.stringify({ id: "note-1", text: "yeni", updatedAt: 200 })
    }],
    baseline: { "note-1": 100 },
    now: 300
  });
  assert.equal(result.items[0].text, "yeni");
  assert.equal(result.writes.length, 0);
});

test("P34.2 yerel silme tombstone üretir ve kayıt yeniden dirilmez", () => {
  const result = mergeEntityCollection({
    type: "notes",
    localItems: [],
    cloudRows: [{
      local_id: "note-1",
      updated_at: 100,
      deleted_at: 0,
      payload: JSON.stringify({ id: "note-1", text: "sil", updatedAt: 100 })
    }],
    baseline: { "note-1": 100 },
    now: 300
  });
  assert.equal(result.items.length, 0);
  assert.equal(result.writes.length, 1);
  assert.equal(result.writes[0].deletedAt, 300);
});

test("P34.2 başka cihaz tombstone'u eski yerel görevi geri getirmez", () => {
  const result = mergeEntityCollection({
    type: "tasks",
    localItems: [{ id: "task-1", title: "eski", createdAt: 100, updatedAt: 100 }],
    cloudRows: [{
      local_id: "task-1",
      updated_at: 220,
      deleted_at: 220,
      payload: "{}"
    }],
    baseline: { "task-1": 100 },
    now: 300
  });
  assert.equal(result.items.length, 0);
  assert.equal(result.writes.length, 0);
});

test("P34.2 tombstone sonrası daha yeni yerel düzenleme kaydı canlandırabilir", () => {
  const result = mergeEntityCollection({
    type: "tasks",
    localItems: [{ id: "task-1", title: "yeniden", createdAt: 100, updatedAt: 400 }],
    cloudRows: [{
      local_id: "task-1",
      updated_at: 220,
      deleted_at: 220,
      payload: "{}"
    }],
    baseline: {},
    now: 500
  });
  assert.equal(result.items[0].title, "yeniden");
  assert.equal(result.writes.length, 1);
  assert.equal(result.writes[0].deletedAt, 0);
});
