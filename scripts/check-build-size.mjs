import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "dist");
const limits = {
  coreJs: 100 * 1024,
  totalJs: 3500 * 1024,
  css: 120 * 1024
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

const entryPath = join(root, entryMatch[1].replace(/^\//, ""));
const coreJs = (await stat(entryPath)).size;
const files = await walk(root);
let totalJs = 0;
let css = 0;

for (const file of files) {
  const info = await stat(file);
  if (/\.(?:js|mjs)$/.test(file)) totalJs += info.size;
  if (file.endsWith(".css")) css += info.size;
}

const values = { coreJs, totalJs, css };
for (const [kind, bytes] of Object.entries(values)) {
  const limit = limits[kind];
  console.log(`${kind}: ${(bytes / 1024).toFixed(1)} KB / ${(limit / 1024).toFixed(0)} KB bütçe`);
  if (bytes > limit) throw new Error(`${kind} bundle bütçeyi aştı.`);
}
