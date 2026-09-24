import test from "node:test";
import assert from "node:assert/strict";
import {
  contrastAudit,
  gradientCss,
  radiusScale,
  shadowCss,
  spacingScale,
  typographyScale
} from "../src/design-tools.js";
import {
  columnReport,
  compareCsv,
  duplicateGroups,
  missingValueReport,
  profileCsv,
  qualityReport
} from "../src/data-lab.js";

test("gradient üretici CSS çıktısı verir", () => {
  const result = gradientCss({ start: "#4967ff", end: "#ff6b6b", angle: 120 });
  assert.match(result.css, /linear-gradient\(120deg/);
  assert.match(result.css, /#4967FF/);
});

test("shadow üretici rgba ve ölçüleri üretir", () => {
  const result = shadowCss({ color: "#000000", y: 12, blur: 30, opacity: 25 });
  assert.match(result.css, /rgba\(0, 0, 0, 0\.25\)/);
  assert.equal(result.metrics.y, 12);
});

test("kontrast denetimi siyah beyaz için AAA geçer", () => {
  const result = contrastAudit("#000000", "#ffffff");
  assert.equal(Number(result.ratio.toFixed(0)), 21);
  assert.equal(result.aaaNormal, true);
});

test("tipografi, spacing ve radius ölçekleri tutarlı token üretir", () => {
  assert.equal(typographyScale({ base: 16, ratio: 1.25, steps: 4 }).length, 4);
  assert.deepEqual(spacingScale(4).slice(0, 3).map((item) => item.px), [4, 8, 12]);
  assert.equal(radiusScale(8).at(-1).px, 999);
});

const csv = "ad,şehir,puan\nAli,Antalya,10\nZehra,,20\nAli,Antalya,10";

test("CSV profil eksik ve duplicate hücreleri hesaplar", () => {
  const profile = profileCsv(csv);
  assert.equal(profile.summary.rows, 3);
  assert.equal(profile.summary.columns, 3);
  assert.equal(profile.summary.missingCells, 1);
  assert.equal(profile.summary.duplicateRows, 1);
});

test("veri kalite raporu eksik ve duplicate sorunlarını bulur", () => {
  const report = qualityReport(csv);
  assert.ok(report.issues.some((item) => /eksik/.test(item.message)));
  assert.ok(report.issues.some((item) => /tekrar/.test(item.message)));
});

test("eksik değer raporu en sorunlu kolonları döndürür", () => {
  const report = missingValueReport(csv);
  assert.equal(report[0].column, "şehir");
  assert.equal(report[0].missing, 1);
});

test("duplicate satır grupları CSV satır numaralarını korur", () => {
  const groups = duplicateGroups(csv);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].rows, [2, 4]);
});

test("kolon analizi en sık değerleri sıralar", () => {
  const report = columnReport(csv, "ad");
  assert.equal(report.topValues[0].value, "Ali");
  assert.equal(report.topValues[0].count, 2);
});

test("iki CSV kolon ve ortak satır farkını karşılaştırır", () => {
  const second = "ad,şehir,aktif\nAli,Antalya,true\nDeniz,İzmir,false";
  const result = compareCsv(csv, second);
  assert.deepEqual(result.addedColumns, ["aktif"]);
  assert.deepEqual(result.removedColumns, ["puan"]);
  assert.deepEqual(result.commonColumns, ["ad", "şehir"]);
  assert.ok(result.commonRows >= 1);
});
