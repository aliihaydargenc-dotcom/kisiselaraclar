import { readFile } from "node:fs/promises";

const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const office = await readFile(new URL("../src/p16-office.css", import.meta.url), "utf8");
const p17 = await readFile(new URL("../src/p17-workspace.css", import.meta.url), "utf8");
const p39 = await readFile(new URL("../src/p39-reset.css", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");

const stripCssComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "");
const importantCount = (source) => (stripCssComments(source).match(/!important/g) || []).length;

const legacyBudget = [
  ["styles.css", styles, 79],
  ["p16-office.css", office, 37]
];
for (const [name, source, max] of legacyBudget) {
  const count = importantCount(source);
  if (count > max) throw new Error(`${name} !important borcu büyüdü: ${count} > ${max}.`);
}
if (importantCount(p17) !== 0) throw new Error("p17-workspace.css !important kullanmamalı.");
if (importantCount(p39) !== 0) throw new Error("P39 reset katmanı !important kullanmamalı; yeni tasarım seçici sahipliğiyle çalışmalı.");

for (const legacy of ["./src/desktop-shell.css","./src/mobile-shell.css","./src/p36-design-system.css","./src/p37-daily.css","./src/p37-actions.css"]) {
  if (index.includes(legacy)) throw new Error(`P39 production shell eski görsel katmanı yüklememeli: ${legacy}`);
}

const p17Pos = index.indexOf("./src/p17-workspace.css");
const p39Pos = index.indexOf("./src/p39-reset.css");
if (p17Pos < 0 || p39Pos < p17Pos) throw new Error("P39 reset CSS, gerekli işlevsel stillerden sonra son görsel sahip olmalı.");

const requiredSelectors = [
  ".p39-workspace",
  ".p39-command-launch",
  ".desktop-tool-nav",
  ".mobile-dock",
  ".p38-command",
  ".tool-panel"
];
for (const selector of requiredSelectors) {
  if (!p39.includes(selector)) throw new Error(`P39 tasarım sahipliği eksik: ${selector}`);
}

if (!index.includes("./src/p39-shell.js")) throw new Error("P39 shell production girişine bağlı değil.");
if (index.includes("./src/p37-daily.js")) throw new Error("P39 production shell eski P37 günlük rendererını yüklememeli.");

console.log("CSS ownership PASS: P39 production yüzeyinin tek görsel sahiplik katmanı.");
