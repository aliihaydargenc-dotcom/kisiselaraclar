import test from "node:test";
import assert from "node:assert/strict";
import {
  CLOUD_SYNC_LIMIT,
  collectSyncEntries,
  createSyncPayload,
  fitSyncPayload,
  normalizeUsername,
  syncEntriesHash,
  usernameToEmail
} from "../src/appwrite-cloud.js";

function storageOf(values) {
  const keys = Object.keys(values);
  return {
    length: keys.length,
    key(index) { return keys[index] ?? null; },
    getItem(key) { return key in values ? values[key] : null; }
  };
}

test("Appwrite private kullanıcı adı eşlenir", () => {
  assert.equal(normalizeUsername("  ALİHAYDAR  "), "alihaydar");
  assert.equal(usernameToEmail("alihaydar"), "alihaydar@kisiselaraclar.local");
  assert.equal(usernameToEmail("baskasi"), "");
});

test("bulut senkronu yalnız ürün kayıtlarını toplar", () => {
  const entries = collectSyncEntries(storageOf({
    "kisiselaraclar:p16:notes": "[]",
    "kisiselaraclar:p16:tasks": "[]",
    "browser-session": "x",
    "other": "x"
  }));
  assert.deepEqual(entries, {
    "kisiselaraclar:p16:notes": "[]",
    "kisiselaraclar:p16:tasks": "[]"
  });
});

test("sync payload longtext güvenli bütçesinde kalır", () => {
  const source = {
    "kisiselaraclar:p16:notes": "x".repeat(50000),
    "kisiselaraclar:extra": "y".repeat(50000)
  };
  const result = fitSyncPayload(source, 123);
  assert.ok(Buffer.byteLength(JSON.stringify(result.payload), "utf8") <= CLOUD_SYNC_LIMIT);
  assert.ok(result.dropped.length >= 1);
  assert.equal(syncEntriesHash(result.payload.entries), syncEntriesHash(result.payload.entries));
  assert.throws(() => createSyncPayload(source, 123), (error) => {
    assert.equal(error?.code, "SYNC_PAYLOAD_LIMIT");
    assert.ok(error?.dropped?.length >= 1);
    return true;
  });
});
