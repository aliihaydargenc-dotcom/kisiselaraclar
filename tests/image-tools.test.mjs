import test from "node:test";
import assert from "node:assert/strict";
import {
  IMAGE_FILE_LIMIT,
  calculateResizeDimensions,
  formatBytes,
  inferImageMime,
  normalizeCropRect,
  normalizeMetadataTags,
  normalizeQuality,
  resolveOutputType,
  validateImageDescriptor
} from "../src/image-tools.js";

test("görsel MIME türü uzantıdan da algılanır", () => {
  assert.equal(inferImageMime({ name: "foto.JPG", type: "" }), "image/jpeg");
  assert.equal(inferImageMime({ name: "grafik.webp", type: "" }), "image/webp");
});

test("görsel dosya doğrulaması 30 MB sınırını uygular", () => {
  assert.equal(validateImageDescriptor({ name: "a.png", type: "image/png", size: 1024 }).mime, "image/png");
  assert.throws(
    () => validateImageDescriptor({ name: "a.jpg", type: "image/jpeg", size: IMAGE_FILE_LIMIT + 1 }),
    /30 MB/
  );
});

test("oran korunan resize hedef kutuya sığar", () => {
  assert.deepEqual(calculateResizeDimensions(4000, 3000, 1200, null), { width: 1200, height: 900 });
  assert.deepEqual(calculateResizeDimensions(4000, 3000, 1000, 1000), { width: 1000, height: 750 });
});

test("varsayılan resize görseli gereksiz büyütmez", () => {
  assert.deepEqual(calculateResizeDimensions(800, 600, 1600, null), { width: 800, height: 600 });
  assert.deepEqual(
    calculateResizeDimensions(800, 600, 1600, null, { allowUpscale: true }),
    { width: 1600, height: 1200 }
  );
});

test("serbest resize büyütme kapalıysa kaynak sınırını aşmayı reddeder", () => {
  assert.throws(
    () => calculateResizeDimensions(800, 600, 900, 500, { keepAspect: false }),
    /Büyütme kapalı/
  );
});

test("crop dikdörtgeni kaynak sınırlarında tutulur", () => {
  assert.deepEqual(
    normalizeCropRect({ x: 90, y: 50, width: 50, height: 80 }, 100, 100),
    { x: 90, y: 50, width: 10, height: 50 }
  );
});

test("kalite yüzde veya 0-1 biçiminde normalize edilir", () => {
  assert.equal(normalizeQuality(80), 0.8);
  assert.equal(normalizeQuality(0.65), 0.65);
  assert.equal(normalizeQuality(999), 1);
});

test("çıktı formatı preserve ve dönüşüm senaryolarını çözer", () => {
  assert.deepEqual(resolveOutputType("preserve", "image/png"), {
    mime: "image/png",
    extension: "png",
    qualitySupported: false
  });
  assert.equal(resolveOutputType("image/webp", "image/jpeg").extension, "webp");
});

test("metadata listesi büyük alanları atlar ve GPS hassasiyetini işaretler", () => {
  const normalized = normalizeMetadataTags({
    Make: { description: "Samsung" },
    GPSLatitude: { description: "36.8" },
    Thumbnail: { description: "binary" }
  });
  assert.equal(normalized.rows.length, 2);
  assert.equal(normalized.sensitive, true);
});

test("boyut biçimleme kısa değer üretir", () => {
  assert.equal(formatBytes(1024), "1.0 KB");
});
