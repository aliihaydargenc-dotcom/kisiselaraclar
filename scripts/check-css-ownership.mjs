import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../src/notes-workspace.css", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "");
if ((stripComments(css).match(/!important/g) || []).length !== 0) {
  throw new Error("Notes workspace CSS !important kullanmamalı; yeni ürün tek sahiplik katmanıyla çalışmalı.");
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
  if (index.includes(entry)) throw new Error(`Notes-first production eski Kişisel Araçlar yüzeyini yüklememeli: ${entry}`);
}

for (const selector of [".app-sidebar", ".today-grid", ".notes-layout", ".editor-sheet", ".task-sections", ".board", ".mobile-nav"]) {
  if (!css.includes(selector)) throw new Error(`Notes workspace tasarım sahipliği eksik: ${selector}`);
}

if (!index.includes("./src/notes-workspace.css")) throw new Error("Notes workspace CSS production girişine bağlı değil.");
if (!index.includes("./src/notes-workspace.js")) throw new Error("Notes workspace JS production girişine bağlı değil.");

console.log("CSS ownership PASS: production artık yalnız notes-first workspace yüzeyini yüklüyor.");
