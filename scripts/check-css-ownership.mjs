import { readFile } from "node:fs/promises";

const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const office = await readFile(new URL("../src/p16-office.css", import.meta.url), "utf8");
const p17 = await readFile(new URL("../src/p17-workspace.css", import.meta.url), "utf8");
const desktop = await readFile(new URL("../src/desktop-shell.css", import.meta.url), "utf8");
const mobile = await readFile(new URL("../src/mobile-shell.css", import.meta.url), "utf8");
const p36 = await readFile(new URL("../src/p36-design-system.css", import.meta.url), "utf8");
const p37 = await readFile(new URL("../src/p37-daily.css", import.meta.url), "utf8");
const p37Actions = await readFile(new URL("../src/p37-actions.css", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");

const stripCssComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "");
const importantCount = (source) => (stripCssComments(source).match(/!important/g) || []).length;
const importantBudget = [
  ["styles.css", styles, 79],
  ["p16-office.css", office, 37],
  ["desktop-shell.css", desktop, 13],
  ["mobile-shell.css", mobile, 149]
];
for (const [name, source, max] of importantBudget) {
  const count = importantCount(source);
  if (count > max) throw new Error(`${name} !important borcu büyüdü: ${count} > ${max}. Yeni override eklemek yerine sahipliği düzelt.`);
}
if (importantCount(p17) !== 0) throw new Error("p17-workspace.css !important kullanmamalı.");
if (importantCount(p36) !== 0) throw new Error("p36-design-system.css !important kullanmamalı; tasarım sistemi seçici sahipliğiyle çalışmalı.");
if (importantCount(p37) !== 0 || importantCount(p37Actions) !== 0) {
  throw new Error("P37 günlük kullanım katmanı !important kullanmamalı; eski ekranları yeni borçla yamalama.");
}

if (/\.mobile-dock/.test(p17)) throw new Error("P17 workspace CSS mobil dock stilini sahiplenmemeli; src/mobile-shell.css kullan.");
if (!/\.mobile-dock\s*\{/.test(mobile)) throw new Error("Mobil shell ana dock kuralı eksik.");
if (!/\.desktop-home-view/.test(desktop)) throw new Error("Desktop shell masaüstü çalışma alanını sahiplenmeli.");
if (!/--app-accent:/.test(p36) || !/--ka-duration-base:/.test(p36)) throw new Error("P36 tasarım sistemi ortak renk/motion tokenlarını tanımlamalı.");
if (!/\.p37-capture/.test(p37) || !/\.p37-note-panel/.test(p37)) throw new Error("P37 günlük merkez ve içerik-odaklı not sahipliği eksik.");

const p17Pos = index.indexOf("./src/p17-workspace.css");
const desktopPos = index.indexOf("./src/desktop-shell.css");
const mobilePos = index.indexOf("./src/mobile-shell.css");
const p36Pos = index.indexOf("./src/p36-design-system.css");
const p37Pos = index.indexOf("./src/p37-daily.css");
const p37ActionsPos = index.indexOf("./src/p37-actions.css");
if (p17Pos < 0 || desktopPos < p17Pos || mobilePos < desktopPos || p36Pos < mobilePos || p37Pos < p36Pos || p37ActionsPos < p37Pos) {
  throw new Error("CSS katman sırası p17 -> desktop -> mobile -> p36 -> p37 olmalı.");
}
console.log("CSS ownership PASS: shell ve P36 temelinden sonra P37 günlük kullanım katmanı kontrollü son sahip.");
