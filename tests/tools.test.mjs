import test from "node:test";
import assert from "node:assert/strict";
import { engines } from "../src/tool-engines.js";
import { normalizeSearch, searchTools, tools } from "../src/catalog.js";

test("Türkçe arama diakritik ve ı karakterini normalize eder", () => {
  assert.equal(normalizeSearch("  SIKIŞTIR  "), "sikistir");
});

test("katalog yedi local-first araçla başlar", () => {
  assert.equal(tools.length, 7);
  assert.ok(tools.every((tool) => tool.privacy === "browser"));
});

test("Türkçe alias ile araç bulunabilir", () => {
  assert.equal(searchTools("tekrarlanan satır")[0]?.id, "duplicates");
  assert.equal(searchTools("tarih", "zaman")[0]?.id, "unix-time");
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
