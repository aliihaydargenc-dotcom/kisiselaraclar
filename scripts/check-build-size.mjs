import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "dist");

// Size checks are regression guards, not platform limits. Targets produce warnings;
// only a large accidental regression fails CI.
const targets = {
  coreJs: 110 * 1024,
  totalJs: 4250 * 1024,
  ocrRuntime: 40 * 1024 * 1024,
  css: 160 * 1024
};
const hardLimits = {
  coreJs: 180 * 1024,
  totalJs: 6 * 1024 * 1024,
  ocrRuntime: 55 * 1024 * 1024,
  css: 240 * 1024
};

async function walk(pathname) {
  const entries = await readdir(pathname, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(pathname, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const html = await readFile(join(root, "index.html"), "utf8");
const entryMatches = [...html.matchAll(/<script[^>]+src="([^"]+\.(?:js|mjs))"/g)];
const bundledEntry = entryMatches
  .map((match) => match[1].split("?")[0])
  .find((url) => url.includes("assets/"));
if (!bundledEntry) throw new Error("Ana JS bundle bulunamadı.");

const assetIndex = bundledEntry.indexOf("assets/");
const entryRelative = assetIndex >= 0
  ? bundledEntry.slice(assetIndex)
  : bundledEntry.replace(/^(?:\.\/|\/)+/, "");
const entryPath = join(root, entryRelative);
const coreJs = (await stat(entryPath)).size;
const files = await walk(root);
let totalJs = 0;
let ocrRuntime = 0;
let css = 0;

for (const file of files) {
  const info = await stat(file);
  const rel = relative(root, file).replaceAll("\\", "/");
  if (rel.startsWith("ocr/")) {
    ocrRuntime += info.size;
    continue;
  }
  if (/\.(?:js|mjs)$/.test(file)) totalJs += info.size;
  if (file.endsWith(".css")) css += info.size;
}

const values = { coreJs, totalJs, ocrRuntime, css };
for (const [kind, bytes] of Object.entries(values)) {
  const target = targets[kind];
  const hardLimit = hardLimits[kind];
  const sizeKb = (bytes / 1024).toFixed(1);
  console.log(`${kind}: ${sizeKb} KB · hedef ${(target / 1024).toFixed(0)} KB · üst tavan ${(hardLimit / 1024).toFixed(0)} KB`);
  if (bytes > hardLimit) throw new Error(`${kind} beklenmeyen ölçüde büyüdü: ${sizeKb} KB.`);
  if (bytes > target) console.warn(`UYARI: ${kind} hedef bütçenin üzerinde; optimizasyon adayı.`);
}
