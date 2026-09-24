import { readFile } from "node:fs/promises";

const p17 = await readFile(new URL("../src/p17-workspace.css", import.meta.url), "utf8");
const shell = await readFile(new URL("../src/mobile-shell.css", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");

if (/\.mobile-dock/.test(p17)) {
  throw new Error("P17 workspace CSS mobil dock stilini sahiplenmemeli; src/mobile-shell.css kullan.");
}
if (!/\.mobile-dock\s*\{/.test(shell)) {
  throw new Error("Mobil shell ana dock kuralı eksik.");
}
const p17Pos = index.indexOf("./src/p17-workspace.css");
const shellPos = index.indexOf("./src/mobile-shell.css");
if (p17Pos < 0 || shellPos < 0 || shellPos < p17Pos) {
  throw new Error("mobile-shell.css p17-workspace.css sonrasında yüklenmeli.");
}
console.log("CSS ownership PASS: mobile shell tek final P17 dock katmanı.");
