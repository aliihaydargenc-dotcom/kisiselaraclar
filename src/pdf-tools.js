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


export const PDF_RASTER_PAGE_LIMIT = 40;
export const IMAGE_TO_PDF_FILE_LIMIT = 30 * 1024 * 1024;
export const IMAGE_TO_PDF_TOTAL_LIMIT = 120 * 1024 * 1024;
export const IMAGE_TO_PDF_COUNT_LIMIT = 30;

function byteView(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new Error("Görsel verisi okunamadı.");
}

export function resolvePdfRasterPages(selection, totalPages) {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    throw new Error("PDF sayfa sayısı geçersiz.");
  }

  const text = String(selection || "").trim();
  const pages = text
    ? parsePageSelection(text, totalPages)
    : Array.from({ length: totalPages }, (_, index) => index + 1);

  if (pages.length > PDF_RASTER_PAGE_LIMIT) {
    throw new Error(`Tek işlemde en fazla ${PDF_RASTER_PAGE_LIMIT} sayfa görsele dönüştürülebilir.`);
  }
  return pages;
}

export function resolvePdfRasterScale(sourceWidth, targetWidth = 1600) {
  const width = Number(sourceWidth);
  const target = Number(targetWidth);
  if (!Number.isFinite(width) || width <= 0) throw new Error("PDF sayfa genişliği geçersiz.");
  if (!Number.isFinite(target) || target < 600 || target > 2200) {
    throw new Error("Görsel genişliği 600-2200 px aralığında olmalı.");
  }
  return Math.max(0.25, Math.min(3, target / width));
}

export function validateImagePdfEntries(entries = []) {
  if (!Array.isArray(entries) || !entries.length) {
    throw new Error("PDF oluşturmak için en az bir görsel seç.");
  }
  if (entries.length > IMAGE_TO_PDF_COUNT_LIMIT) {
    throw new Error(`Tek PDF için en fazla ${IMAGE_TO_PDF_COUNT_LIMIT} görsel seçilebilir.`);
  }

  let totalBytes = 0;
  const normalized = entries.map((entry, index) => {
    const bytes = byteView(entry.bytes);
    const mime = String(entry.mime || "").toLowerCase();
    const name = String(entry.name || `gorsel-${index + 1}`);
    if (!["image/jpeg", "image/png"].includes(mime)) {
      throw new Error(`${name}: PDF'e yalnız JPEG veya PNG gömülebilir.`);
    }
    if (!bytes.byteLength) throw new Error(`${name}: görsel boş.`);
    if (bytes.byteLength > IMAGE_TO_PDF_FILE_LIMIT) {
      throw new Error(`${name} 30 MB sınırını aşıyor.`);
    }
    totalBytes += bytes.byteLength;
    if (totalBytes > IMAGE_TO_PDF_TOTAL_LIMIT) {
      throw new Error("Görsellerin toplam boyutu 120 MB sınırını aşıyor.");
    }
    return { name, mime, bytes };
  });

  return { entries: normalized, totalBytes };
}

export function fitImageToA4(width, height, margin = 24) {
  const sourceWidth = Number(width);
  const sourceHeight = Number(height);
  if (!Number.isFinite(sourceWidth) || sourceWidth <= 0 || !Number.isFinite(sourceHeight) || sourceHeight <= 0) {
    throw new Error("Görsel ölçüleri geçersiz.");
  }

  const portrait = sourceHeight >= sourceWidth;
  const pageWidth = portrait ? 595.28 : 841.89;
  const pageHeight = portrait ? 841.89 : 595.28;
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;
  const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;

  return {
    pageWidth,
    pageHeight,
    drawWidth,
    drawHeight,
    x: (pageWidth - drawWidth) / 2,
    y: (pageHeight - drawHeight) / 2
  };
}

export async function imagesToPdf(entries) {
  const validated = validateImagePdfEntries(entries);
  const doc = await PDFDocument.create();

  for (const entry of validated.entries) {
    const image = entry.mime === "image/png"
      ? await doc.embedPng(entry.bytes)
      : await doc.embedJpg(entry.bytes);
    const layout = fitImageToA4(image.width, image.height);
    const page = doc.addPage([layout.pageWidth, layout.pageHeight]);
    page.drawImage(image, {
      x: layout.x,
      y: layout.y,
      width: layout.drawWidth,
      height: layout.drawHeight
    });
  }

  return doc.save();
}

function canvasBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("PDF sayfası görsele dönüştürülemedi.")),
      mime,
      quality
    );
  });
}

export async function renderPdfPagesToImages(
  bytes,
  selection = "",
  {
    format = "png",
    targetWidth = 1600,
    jpegQuality = 0.9,
    onProgress = () => {}
  } = {}
) {
  if (typeof document === "undefined") {
    throw new Error("PDF → görsel dönüşümü yalnız tarayıcıda çalışır.");
  }

  const [pdfjs, workerUrl] = await Promise.all([
    import("pdfjs-dist/build/pdf.mjs"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;

  const task = pdfjs.getDocument({ data: new Uint8Array(bytes) });
  const doc = await task.promise;

  try {
    const pages = resolvePdfRasterPages(selection, doc.numPages);
    const normalizedFormat = format === "jpeg" ? "jpeg" : "png";
    const mime = normalizedFormat === "jpeg" ? "image/jpeg" : "image/png";
    const extension = normalizedFormat === "jpeg" ? "jpg" : "png";
    const entries = [];

    for (let index = 0; index < pages.length; index += 1) {
      const pageNumber = pages[index];
      const page = await doc.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = resolvePdfRasterScale(baseViewport.width, targetWidth);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext("2d", { alpha: mime !== "image/jpeg" });
      if (!context) throw new Error("Canvas 2D bağlamı açılamadı.");

      if (mime === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await canvasBlob(
        canvas,
        mime,
        mime === "image/jpeg" ? Math.max(0.5, Math.min(1, Number(jpegQuality) || 0.9)) : undefined
      );
      entries.push({
        name: `sayfa-${String(pageNumber).padStart(3, "0")}.${extension}`,
        bytes: new Uint8Array(await blob.arrayBuffer())
      });
      onProgress({ current: index + 1, total: pages.length, pageNumber });
    }

    return {
      entries,
      pageCount: doc.numPages,
      selectedCount: pages.length,
      format: normalizedFormat
    };
  } finally {
    await doc.destroy();
  }
}
