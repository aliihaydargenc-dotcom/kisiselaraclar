import test from "node:test";
import assert from "node:assert/strict";
import {
  MEDIA_OUTPUTS,
  formatMediaDuration,
  normalizeTrimRange,
  validateMediaDescriptor
} from "../src/media-tools.js";

test("medya doğrulaması yaygın video ve ses uzantılarını kabul eder", () => {
  assert.equal(validateMediaDescriptor({ name: "video.mp4", size: 1024, type: "video/mp4" }).extension, "mp4");
  assert.equal(validateMediaDescriptor({ name: "ses.flac", size: 1024, type: "" }).extension, "flac");
});

test("medya conversion sınırı 100 MB üstünü reddeder", () => {
  assert.throws(
    () => validateMediaDescriptor({ name: "buyuk.mp4", size: 101 * 1024 * 1024, type: "video/mp4" }, { conversion: true }),
    /100 MB/
  );
});

test("trim aralığı başlangıç bitiş ve süreyi doğrular", () => {
  assert.deepEqual(normalizeTrimRange(1.5, 4.2, 10), { start: 1.5, end: 4.2 });
  assert.throws(() => normalizeTrimRange(5, 4, 10), /başlangıçtan büyük/);
  assert.throws(() => normalizeTrimRange(0, 11, 10), /toplam süresini/);
});

test("medya süre biçimi okunabilir değer üretir", () => {
  assert.equal(formatMediaDuration(65), "1:05");
  assert.equal(formatMediaDuration(3661), "1:01:01");
});

test("ses hedefleri audio-only olarak tanımlıdır", () => {
  assert.equal(MEDIA_OUTPUTS.mp3.audioOnly, true);
  assert.equal(MEDIA_OUTPUTS.wav.audioOnly, true);
  assert.equal(MEDIA_OUTPUTS.mp4.audioOnly, false);
});
