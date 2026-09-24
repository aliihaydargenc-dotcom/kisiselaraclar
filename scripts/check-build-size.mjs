import { readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "dist");
const limits = {
  js: 250 * 1024,
  css: 100 * 1024
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

const files = await walk(root);
const totals = { js: 0, css: 0 };

for (const file of files) {
  const info = await stat(file);
  if (file.endsWith(".js")) totals.js += info.size;
  if (file.endsWith(".css")) totals.css += info.size;
}

for (const [kind, bytes] of Object.entries(totals)) {
  const limit = limits[kind];
  const kb = (bytes / 1024).toFixed(1);
  const maxKb = (limit / 1024).toFixed(0);
  console.log(`${kind.toUpperCase()}: ${kb} KB / ${maxKb} KB bütçe`);
  if (bytes > limit) {
    throw new Error(`${kind.toUpperCase()} bundle bütçeyi aştı.`);
  }
}
