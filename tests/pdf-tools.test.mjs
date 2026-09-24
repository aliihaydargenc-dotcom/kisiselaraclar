import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {
  extractPdfPages,
  getPdfInfo,
  mergePdfBuffers,
  parsePageSelection,
  rotatePdf
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
