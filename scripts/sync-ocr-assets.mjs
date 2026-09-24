import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(root, "public", "ocr");
const coreOut = join(out, "core");
const langOut = join(out, "lang");

await rm(out, { recursive: true, force: true });
await mkdir(coreOut, { recursive: true });
await mkdir(langOut, { recursive: true });

const workerSource = join(root, "node_modules", "tesseract.js", "dist", "worker.min.js");
await copyFile(workerSource, join(out, "worker.min.js"));

const coreSource = join(root, "node_modules", "tesseract.js-core");
const coreFiles = (await readdir(coreSource)).filter((name) => name.endsWith(".wasm.js"));
if (!coreFiles.length) throw new Error("Tesseract WASM core dosyaları bulunamadı.");
await Promise.all(coreFiles.map((name) => copyFile(join(coreSource, name), join(coreOut, name))));

for (const lang of ["tur", "eng"]) {
  const source = join(
    root,
    "node_modules",
    `@tesseract.js-data/${lang}`,
    "4.0.0_best_int",
    `${lang}.traineddata.gz`
  );
  await copyFile(source, join(langOut, `${lang}.traineddata.gz`));
}

console.log(`OCR assets synced: ${coreFiles.length} core builds + tur/eng traineddata`);
