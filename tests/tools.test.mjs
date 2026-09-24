import test from "node:test";
import assert from "node:assert/strict";
import { engines, parseCsv } from "../src/tool-engines.js";
import { normalizeSearch, searchTools, tools } from "../src/catalog.js";
import { getIntegration } from "../src/integrations.js";

test("Türkçe arama diakritik ve ı karakterini normalize eder", () => {
  assert.equal(normalizeSearch("  SIKIŞTIR  "), "sikistir");
});

test("katalog yirmi altı local-first araç içerir", () => {
  assert.equal(tools.length, 26);
  assert.ok(tools.every((tool) => tool.privacy === "browser"));
});

test("Türkçe alias ile araç bulunabilir", () => {
  assert.equal(searchTools("tekrarlanan satır")[0]?.id, "duplicates");
  assert.equal(searchTools("tarih", "zaman")[0]?.id, "unix-time");
  assert.equal(searchTools("csv json", "veri")[0]?.id, "csv-json");
  assert.equal(searchTools("fotoğraf sıkıştır", "gorsel")[0]?.id, "image-compress");
  assert.equal(searchTools("exif konum", "gorsel")[0]?.id, "image-metadata");
  assert.equal(searchTools("qr oluştur", "kod")[0]?.id, "qr-generate");
  assert.equal(searchTools("barkod tara", "kod")[0]?.id, "barcode-scan");
  assert.equal(searchTools("zip aç", "arsiv")[0]?.id, "zip-extract");
  assert.equal(searchTools("görsel metin", "ocr")[0]?.id, "ocr-image");
  assert.equal(searchTools("pdf ocr", "ocr")[0]?.id, "ocr-pdf-page");
  assert.equal(searchTools("pdf jpg", "pdf")[0]?.id, "pdf-to-images");
  assert.equal(searchTools("görseller pdf", "pdf")[0]?.id, "images-to-pdf");
});

test("base64 unicode roundtrip çalışır", () => {
  const value = "Merhaba Türkiye";
  assert.equal(engines.decodeBase64(engines.encodeBase64(value)), value);
});

test("JSON düzenleme ve sıkıştırma çalışır", () => {
  const raw = '{"a":1,"b":[2,3]}';
  assert.equal(engines.minifyJson(raw), raw);
  assert.match(engines.formatJson(raw), /\n  "a": 1/);
});

test("PapaParse CSV ayırıcısını algılar ve kolonları çıkarır", () => {
  const parsed = parseCsv("ad;şehir\nAli;Antalya\nZehra;Tokat");
  assert.equal(parsed.delimiter, ";");
  assert.deepEqual(parsed.columns, ["ad", "şehir"]);
  assert.equal(parsed.rows[1].şehir, "Tokat");
});

test("CSV JSON dönüşümü başlıkları anahtar olarak kullanır", () => {
  const json = JSON.parse(engines.csvToJson("ad,puan\nAli,10\nZehra,20"));
  assert.deepEqual(json, [
    { ad: "Ali", puan: "10" },
    { ad: "Zehra", puan: "20" }
  ]);
});

test("Tesseract OCR entegrasyonu aynı-origin local-first olarak kayıtlıdır", () => {
  const integration = getIntegration("tesseractjs");
  assert.equal(integration.version, "7.0.0");
  assert.equal(integration.networkRequired, false);
  assert.equal(integration.dataLeavesDevice, false);
});

test("P4 entegrasyonları local-first olarak kayıtlıdır", () => {
  for (const id of ["qrcode-generator", "zxing-browser", "fflate"]) {
    assert.equal(getIntegration(id).dataLeavesDevice, false);
  }
  assert.equal(getIntegration("fflate").version, "0.8.3");
});

test("ExifReader entegrasyonu local-first olarak kayıtlıdır", () => {
  const integration = getIntegration("exifreader");
  assert.equal(integration.version, "4.45.2");
  assert.equal(integration.license, "MPL-2.0");
  assert.equal(integration.dataLeavesDevice, false);
});

test("PapaParse entegrasyon manifesti veri dışarı çıkmaz olarak işaretlidir", () => {
  const integration = getIntegration("papaparse");
  assert.equal(integration.version, "5.7.0");
  assert.equal(integration.license, "MIT");
  assert.equal(integration.dataLeavesDevice, false);
});

test("tekrarlanan satırlar ilk sıra korunarak kaldırılır", () => {
  assert.equal(engines.removeDuplicateLines("a\nb\na\nc\nb"), "a\nb\nc");
});

test("metin istatistikleri Türkçe sonuç üretir", () => {
  const result = engines.textStats("bir iki\nüç");
  assert.match(result, /Kelime: 3/);
  assert.match(result, /Satır: 2/);
});

test("unix zaman dönüştürme saniye girdisini kabul eder", () => {
  const result = engines.unixToDate("0");
  assert.match(result, /1970/);
});
