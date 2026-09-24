import test from "node:test";
import assert from "node:assert/strict";
import {
  createZipArchive,
  extractZipArchive,
  gzipBuffer,
  gunzipBuffer,
  inspectGzipExpectedSize,
  inspectZipSafety,
  sanitizeArchivePath,
  validateArchiveEntries
} from "../src/archive-tools.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

test("arşiv yolları traversal parçalarını temizler", () => {
  assert.equal(sanitizeArchivePath("../../rapor/../sonuc.txt"), "rapor/sonuc.txt");
  assert.equal(sanitizeArchivePath("\\klasor\\dosya.txt"), "klasor/dosya.txt");
});

test("ZIP giriş doğrulaması aynı isimleri çakıştırmaz", () => {
  const checked = validateArchiveEntries([
    { name: "a.txt", bytes: encoder.encode("1") },
    { name: "a.txt", bytes: encoder.encode("2") }
  ]);
  assert.deepEqual(checked.entries.map((entry) => entry.name), ["a.txt", "a-2.txt"]);
});

test("ZIP oluşturma ve çıkarma roundtrip çalışır", async () => {
  const zipped = await createZipArchive([
    { name: "merhaba.txt", bytes: encoder.encode("Merhaba") },
    { name: "veri/data.txt", bytes: encoder.encode("123") }
  ]);

  const inspection = inspectZipSafety(zipped.bytes);
  assert.equal(inspection.entryCount, 2);
  assert.equal(inspection.uncompressedBytes, 10);

  const extracted = await extractZipArchive(zipped.bytes);
  assert.equal(extracted.entries.length, 2);
  const text = extracted.entries.find((entry) => entry.name === "merhaba.txt");
  assert.equal(decoder.decode(text.bytes), "Merhaba");
});

test("GZIP roundtrip ve beklenen çıktı boyutu çalışır", async () => {
  const source = encoder.encode("Antalya ".repeat(40));
  const compressed = await gzipBuffer(source);
  assert.equal(inspectGzipExpectedSize(compressed), source.byteLength);
  const output = await gunzipBuffer(compressed);
  assert.equal(decoder.decode(output), decoder.decode(source));
});
