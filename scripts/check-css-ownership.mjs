import { readFile } from "node:fs/promises";

const p17 = await readFile(new URL("../src/p17-workspace.css", import.meta.url), "utf8");
const desktop = await readFile(new URL("../src/desktop-shell.css", import.meta.url), "utf8");
const mobile = await readFile(new URL("../src/mobile-shell.css", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");

if (/\.mobile-dock/.test(p17)) {
  throw new Error("P17 workspace CSS mobil dock stilini sahiplenmemeli; src/mobile-shell.css kullan.");
}
if (!/\.mobile-dock\s*\{/.test(mobile)) {
  throw new Error("Mobil shell ana dock kuralı eksik.");
}
if (!/\.desktop-home-view/.test(desktop)) {
  throw new Error("Desktop shell masaüstü çalışma alanını sahiplenmeli.");
}
const p17Pos = index.indexOf("./src/p17-workspace.css");
const desktopPos = index.indexOf("./src/desktop-shell.css");
const mobilePos = index.indexOf("./src/mobile-shell.css");
if (p17Pos < 0 || desktopPos < p17Pos || mobilePos < desktopPos) {
  throw new Error("CSS katman sırası p17-workspace -> desktop-shell -> mobile-shell olmalı.");
}
console.log("CSS ownership PASS: desktop ve mobile shell katmanları ayrık.");
