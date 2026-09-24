import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanOcrText,
  formatOcrProgress,
  normalizeOcrLanguages,
  summarizeOcrText,
  validateOcrImage,
  validateOcrPdf
} from "../src/ocr-tools.js";

test("OCR dil seçimi Türkçe, İngilizce ve birleşik modu çözer", () => {
  assert.deepEqual(normalizeOcrLanguages("tur"), ["tur"]);
  assert.deepEqual(normalizeOcrLanguages("eng"), ["eng"]);
  assert.deepEqual(normalizeOcrLanguages("tur+eng"), ["tur", "eng"]);
  assert.deepEqual(normalizeOcrLanguages("bilinmiyor"), ["tur", "eng"]);
});

test("OCR görsel doğrulaması desteklenen tipleri kabul eder", () => {
  assert.equal(validateOcrImage({ name: "ekran.png", type: "image/png", size: 1024 }).type, "image/png");
  assert.throws(
    () => validateOcrImage({ name: "animasyon.gif", type: "image/gif", size: 1024 }),
    /JPEG, PNG veya WebP/
  );
});

test("OCR PDF doğrulaması yanlış dosyayı reddeder", () => {
  assert.equal(validateOcrPdf({ name: "belge.pdf", type: "application/pdf", size: 2048 }).type, "application/pdf");
  assert.throws(
    () => validateOcrPdf({ name: "belge.txt", type: "text/plain", size: 2048 }),
    /PDF/
  );
});

test("OCR metin temizliği satır sonlarını normalize eder", () => {
  assert.equal(cleanOcrText(" Merhaba  \r\nDünya   \n\n\nTest  "), "Merhaba\nDünya\n\nTest");
});

test("OCR özetinde kelime karakter ve satır sayısı hesaplanır", () => {
  assert.deepEqual(summarizeOcrText("bir iki\nüç"), {
    text: "bir iki\nüç",
    characters: 10,
    words: 3,
    lines: 2
  });
});

test("OCR progress kullanıcıya yüzde ve Türkçe etiket döndürür", () => {
  assert.deepEqual(formatOcrProgress({ status: "recognizing text", progress: 0.42 }), {
    progress: 0.42,
    percent: 42,
    label: "Metin okunuyor"
  });
});
