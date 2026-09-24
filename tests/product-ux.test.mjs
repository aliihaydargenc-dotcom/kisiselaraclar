import test from "node:test";
import assert from "node:assert/strict";
import {
  FEATURED_TOOL_IDS,
  loadRecentToolIds,
  normalizeRecentToolIds,
  parseToolHash,
  quickToolIds,
  rememberRecentTool,
  toolHash
} from "../src/product-ux.js";

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.get(key) ?? null; }
  setItem(key, value) { this.map.set(key, value); }
}

test("tool hash roundtrip çalışır", () => {
  const hash = toolHash("image-compress");
  assert.equal(hash, "#tool=image-compress");
  assert.equal(parseToolHash(hash), "image-compress");
});

test("son kullanılan araçlar geçersiz ve tekrar eden idleri temizler", () => {
  const result = normalizeRecentToolIds(
    ["pdf-merge", "x", "pdf-merge", "ocr-image"],
    ["pdf-merge", "ocr-image", "zip-create"],
    "zip-create",
    6
  );
  assert.deepEqual(result, ["zip-create", "pdf-merge", "ocr-image"]);
});

test("recent tools storage güvenli roundtrip yapar", () => {
  const storage = new MemoryStorage();
  const valid = ["pdf-merge", "ocr-image", "zip-create"];
  rememberRecentTool(storage, "pdf-merge", valid);
  rememberRecentTool(storage, "ocr-image", valid);
  assert.deepEqual(loadRecentToolIds(storage, valid), ["ocr-image", "pdf-merge"]);
});

test("hızlı erişim son kullanılanları öne alıp featured ile tamamlar", () => {
  const valid = [...FEATURED_TOOL_IDS, "unix-time"];
  const result = quickToolIds(["unix-time", "pdf-merge"], valid, 4);
  assert.deepEqual(result.slice(0, 2), ["unix-time", "pdf-merge"]);
  assert.equal(result.length, 4);
});
