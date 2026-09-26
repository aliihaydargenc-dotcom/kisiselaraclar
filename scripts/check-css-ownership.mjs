import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../src/notes-workspace.css", import.meta.url), "utf8");
const themeCss = await readFile(new URL("../src/theme.css", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const bootstrap = await readFile(new URL("../src/app-bootstrap.js", import.meta.url), "utf8");

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "");
for (const [name, source] of [["Calm Editorial", css], ["Theme", themeCss]]) {
  if ((stripComments(source).match(/!important/g) || []).length !== 0) {
    throw new Error(`${name} CSS !important kullanmamalı; production yüzeyi seçici sahipliğiyle çalışmalı.`);
  }
}

const retired = [
  "./src/styles.css",
  "./src/design-tools.css",
  "./src/p14-tools.css",
  "./src/p15-tools.css",
  "./src/p16-office.css",
  "./src/p17-workspace.css",
  "./src/p39-reset.css",
  "./src/main.js",
  "./src/p39-shell.js"
];
for (const entry of retired) {
  if (index.includes(entry)) throw new Error(`Calm Editorial production eski Kişisel Araçlar yüzeyini yüklememeli: ${entry}`);
}

for (const selector of [
  ".app-sidebar",
  ".today-grid",
  ".notes-layout",
  ".editor-sheet",
  ".note-context",
  ".task-sections",
  ".search-results",
  ".calendar-grid",
  ".mobile-nav",
  ".mobile-detail"
]) {
  if (!css.includes(selector)) throw new Error(`Calm Editorial tasarım sahipliği eksik: ${selector}`);
}

for (const selector of [
  '[data-theme="dark"]',
  ".theme-toggle",
  ".mobile-header",
  ".editor-sheet"
]) {
  if (!themeCss.includes(selector)) throw new Error(`Gece/gündüz tema sahipliği eksik: ${selector}`);
}

if (!index.includes("./src/notes-workspace.css")) throw new Error("Calm Editorial CSS production girişine bağlı değil.");
if (!index.includes("./src/theme.css")) throw new Error("Tema CSS production girişine bağlı değil.");
if (!index.includes("./src/app-bootstrap.js")) throw new Error("P45 bootstrap production girişine bağlı değil.");
if (!bootstrap.includes("./theme-controller.js")) throw new Error("Tema kontrolcüsü bootstrap zincirine bağlı değil.");
if (!bootstrap.includes("./notes-workspace.js")) throw new Error("Calm Editorial JS bootstrap zincirine bağlı değil.");

console.log("CSS ownership PASS: Calm Editorial + gece/gündüz tema katmanı P45 bootstrap üzerinden production sahibi.");
