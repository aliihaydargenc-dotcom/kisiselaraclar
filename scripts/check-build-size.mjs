import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "dist");
const limits = {
  coreJs: 100 * 1024,
  // P8 adds Mediabunny as a lazy-only media runtime. Core entry stays capped separately.
  totalJs: 4250 * 1024,
  ocrRuntime: 40 * 1024 * 1024,
  css: 140 * 1024
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
const entryMatch = html.match(/<script[^>]+src="([^"]+\.(?:js|mjs))"/);
if (!entryMatch) throw new Error("Ana JS bundle bulunamadı.");

const entryUrl = entryMatch[1].split("?")[0];
const assetIndex = entryUrl.indexOf("assets/");
const entryRelative = assetIndex >= 0
  ? entryUrl.slice(assetIndex)
  : entryUrl.replace(/^(?:\.\/|\/)+/, "");
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
  const limit = limits[kind];
  console.log(`${kind}: ${(bytes / 1024).toFixed(1)} KB / ${(limit / 1024).toFixed(0)} KB bütçe`);
  if (bytes > limit) throw new Error(`${kind} bundle bütçeyi aştı.`);
}
