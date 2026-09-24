import { PDFDocument, degrees } from "pdf-lib";

export const PDF_FILE_LIMIT = 25 * 1024 * 1024;

export function parsePageSelection(value, totalPages) {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    throw new Error("PDF sayfa sayısı geçersiz.");
  }

  const input = String(value || "").trim();
  if (!input) throw new Error("Sayfa seçimi gir. Örnek: 1-3,5");

  const pages = new Set();

  for (const part of input.split(",")) {
    const token = part.trim();
    if (!token) continue;

    if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page < 1 || page > totalPages) {
        throw new Error(`Sayfa ${page}, 1-${totalPages} aralığında değil.`);
      }
      pages.add(page);
      continue;
    }

    const match = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match) throw new Error(`Geçersiz sayfa seçimi: ${token}`);

    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start < 1 || end > totalPages || start > end) {
      throw new Error(`Geçersiz sayfa aralığı: ${token}`);
    }
    for (let page = start; page <= end; page += 1) pages.add(page);
  }

  if (!pages.size) throw new Error("En az bir sayfa seç.");
  return [...pages].sort((a, b) => a - b);
}

export async function getPdfInfo(bytes) {
  const doc = await PDFDocument.load(bytes);
  return {
    pageCount: doc.getPageCount(),
    rotations: doc.getPages().map((page) => page.getRotation().angle)
  };
}

export async function mergePdfBuffers(buffers) {
  if (!Array.isArray(buffers) || buffers.length < 2) {
    throw new Error("Birleştirmek için en az iki PDF seç.");
  }

  const output = await PDFDocument.create();
  for (const bytes of buffers) {
    const source = await PDFDocument.load(bytes);
    const copied = await output.copyPages(source, source.getPageIndices());
    copied.forEach((page) => output.addPage(page));
  }
  return output.save();
}

export async function extractPdfPages(bytes, selection) {
  const source = await PDFDocument.load(bytes);
  const selected = parsePageSelection(selection, source.getPageCount());
  const output = await PDFDocument.create();
  const copied = await output.copyPages(
    source,
    selected.map((page) => page - 1)
  );
  copied.forEach((page) => output.addPage(page));
  return output.save();
}

export async function rotatePdf(bytes, angle) {
  const delta = Number(angle);
  if (![90, 180, 270].includes(delta)) {
    throw new Error("Döndürme açısı 90, 180 veya 270 olmalı.");
  }

  const doc = await PDFDocument.load(bytes);
  for (const page of doc.getPages()) {
    const current = page.getRotation().angle || 0;
    page.setRotation(degrees((current + delta) % 360));
  }
  return doc.save();
}

export async function renderPdfFirstPage(bytes, canvas) {
  const [pdfjs, workerUrl] = await Promise.all([
    import("pdfjs-dist/build/pdf.mjs"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  ]);

  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;

  const task = pdfjs.getDocument({ data: new Uint8Array(bytes) });
  const doc = await task.promise;
  const page = await doc.getPage(1);

  const baseViewport = page.getViewport({ scale: 1 });
  const maxWidth = 900;
  const scale = Math.min(1.6, maxWidth / baseViewport.width);
  const viewport = page.getViewport({ scale });

  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const context = canvas.getContext("2d");
  await page.render({
    canvasContext: context,
    viewport,
    transform: dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0]
  }).promise;

  return {
    pageCount: doc.numPages,
    width: Math.round(baseViewport.width),
    height: Math.round(baseViewport.height)
  };
}
