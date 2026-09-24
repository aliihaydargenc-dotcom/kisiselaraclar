import test from "node:test";
import assert from "node:assert/strict";
import {
  generateQrSvg,
  normalizeCorrectionLevel,
  validateCodeImage,
  validateQrText
} from "../src/code-tools.js";

test("QR metni boş ve aşırı uzun içeriği reddeder", () => {
  assert.throws(() => validateQrText("   "), /metin veya bağlantı/);
  assert.throws(() => validateQrText("a".repeat(4001)), /4000/);
});

test("QR hata düzeltme seviyesi normalize edilir", () => {
  assert.equal(normalizeCorrectionLevel("h"), "H");
  assert.equal(normalizeCorrectionLevel("x"), "M");
});

test("QR SVG çıktısı gerçek SVG üretir", () => {
  const svg = generateQrSvg("https://example.com", { correction: "M", cellSize: 6 });
  assert.match(svg, /<svg/);
  assert.match(svg, /path|rect/);
});

test("barkod görsel doğrulaması JPEG PNG WebP kabul eder", () => {
  assert.equal(validateCodeImage({ name: "kod.png", type: "image/png", size: 1024 }).type, "image/png");
  assert.throws(
    () => validateCodeImage({ name: "kod.gif", type: "image/gif", size: 1024 }),
    /JPEG, PNG veya WebP/
  );
});
