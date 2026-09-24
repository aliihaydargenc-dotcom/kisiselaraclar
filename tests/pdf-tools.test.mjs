import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {
  extractPdfPages,
  fitImageToA4,
  getPdfInfo,
  mergePdfBuffers,
  parsePageSelection,
  resolvePdfRasterPages,
  resolvePdfRasterScale,
  rotatePdf,
  validateImagePdfEntries
} from "../src/pdf-tools.js";

async function samplePdf(pageCount) {
  const doc = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) {
    doc.addPage([300 + index, 400 + index]);
  }
  return doc.save();
}

test("sayfa seçimi aralık ve tek sayfaları sıralı döndürür", () => {
  assert.deepEqual(parsePageSelection("3,1-2,5", 5), [1, 2, 3, 5]);
});

test("sayfa seçimi sınır dışı sayfayı reddeder", () => {
  assert.throws(() => parsePageSelection("1-7", 4), /Geçersiz sayfa aralığı/);
});

test("PDF birleştirme sayfa sayılarını toplar", async () => {
  const output = await mergePdfBuffers([await samplePdf(2), await samplePdf(3)]);
  assert.equal((await getPdfInfo(output)).pageCount, 5);
});

test("PDF sayfa çıkarma yalnız seçili sayfaları üretir", async () => {
  const output = await extractPdfPages(await samplePdf(5), "2-3,5");
  assert.equal((await getPdfInfo(output)).pageCount, 3);
});

test("PDF döndürme tüm sayfalara açıyı uygular", async () => {
  const output = await rotatePdf(await samplePdf(2), 90);
  assert.deepEqual((await getPdfInfo(output)).rotations, [90, 90]);
});


test("PDF raster sayfa seçimi boşken tüm sayfaları döndürür", () => {
  assert.deepEqual(resolvePdfRasterPages("", 4), [1, 2, 3, 4]);
});

test("PDF raster dönüşümü 40 sayfa güvenlik sınırını uygular", () => {
  assert.throws(() => resolvePdfRasterPages("", 41), /en fazla 40 sayfa/);
});

test("PDF raster ölçeği hedef genişliğe göre hesaplanır", () => {
  assert.equal(resolvePdfRasterScale(800, 1600), 2);
});

test("görsel PDF girdileri yalnız JPEG ve PNG çekirdeğini kabul eder", () => {
  const valid = validateImagePdfEntries([
    { name: "a.jpg", mime: "image/jpeg", bytes: new Uint8Array([1, 2]) },
    { name: "b.png", mime: "image/png", bytes: new Uint8Array([3, 4]) }
  ]);
  assert.equal(valid.entries.length, 2);
  assert.throws(
    () => validateImagePdfEntries([{ name: "x.webp", mime: "image/webp", bytes: new Uint8Array([1]) }]),
    /JPEG veya PNG/
  );
});

test("A4 yerleşimi görsel yönüne göre sayfa yönünü seçer", () => {
  const portrait = fitImageToA4(1000, 1600);
  const landscape = fitImageToA4(1600, 1000);
  assert.ok(portrait.pageHeight > portrait.pageWidth);
  assert.ok(landscape.pageWidth > landscape.pageHeight);
});
