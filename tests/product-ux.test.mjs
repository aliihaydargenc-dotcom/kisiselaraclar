import test from "node:test";
import assert from "node:assert/strict";
import {
  FEATURED_TOOL_IDS,
  classifyFile,
  classifyFileSelection,
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


test("akıllı yönlendirici PDF için belge araçlarını önerir", () => {
  const valid = ["pdf-preview", "pdf-to-images", "pdf-merge", "pdf-extract", "pdf-rotate", "ocr-pdf-page", "zip-create"];
  const result = classifyFileSelection([{ name: "rapor.pdf", type: "application/pdf", size: 1200 }], valid);
  assert.equal(result.family, "pdf");
  assert.deepEqual(result.toolIds, ["pdf-preview", "pdf-to-images", "pdf-merge", "pdf-extract", "pdf-rotate", "ocr-pdf-page"]);
});

test("akıllı yönlendirici desteklenen görselleri tanır", () => {
  assert.equal(classifyFile({ name: "foto.JPG", type: "" }), "image");
  const result = classifyFileSelection([{ name: "foto.webp", type: "image/webp", size: 50 }], [
    "image-compress", "image-resize", "images-to-pdf", "ocr-image", "barcode-scan"
  ]);
  assert.deepEqual(result.toolIds, ["image-compress", "image-resize", "images-to-pdf", "ocr-image", "barcode-scan"]);
});

test("birden fazla PDF birleştirme akışına öncelik verir", () => {
  const files = [
    { name: "a.pdf", type: "application/pdf" },
    { name: "b.pdf", type: "application/pdf" }
  ];
  const result = classifyFileSelection(files, ["pdf-merge", "zip-create"]);
  assert.equal(result.family, "pdf-multi");
  assert.deepEqual(result.toolIds, ["pdf-merge", "zip-create"]);
});

test("karışık çoklu dosya güvenli paketleme akışına gider", () => {
  const files = [
    { name: "a.pdf", type: "application/pdf" },
    { name: "b.csv", type: "text/csv" }
  ];
  const result = classifyFileSelection(files, ["zip-create", "pdf-merge", "csv-json"]);
  assert.equal(result.family, "multi");
  assert.deepEqual(result.toolIds, ["zip-create"]);
});

test("CSV, ZIP ve GZIP dosya aileleri doğru tanınır", () => {
  assert.equal(classifyFile({ name: "data.csv" }), "csv");
  assert.equal(classifyFile({ name: "arsiv.zip" }), "zip");
  assert.equal(classifyFile({ name: "yedek.gz" }), "gzip");
});


test("çoklu görsel seçimi görsellerden PDF akışını önerir", () => {
  const files = [
    { name: "a.jpg", type: "image/jpeg" },
    { name: "b.png", type: "image/png" }
  ];
  const result = classifyFileSelection(files, ["images-to-pdf", "zip-create"]);
  assert.equal(result.family, "image-multi");
  assert.deepEqual(result.toolIds, ["images-to-pdf", "zip-create"]);
});
