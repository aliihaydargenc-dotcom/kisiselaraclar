export const OCR_IMAGE_LIMIT = 20 * 1024 * 1024;
export const OCR_PDF_LIMIT = 25 * 1024 * 1024;
export const OCR_PIXEL_LIMIT = 18_000_000;
export const OCR_LANGUAGES = Object.freeze({
  tur: ["tur"],
  eng: ["eng"],
  "tur+eng": ["tur", "eng"]
});

function extensionOf(name) {
  return String(name || "").toLowerCase().split(".").pop();
}

export function normalizeOcrLanguages(value = "tur+eng") {
  const key = String(value || "tur+eng").toLowerCase();
  return [...(OCR_LANGUAGES[key] || OCR_LANGUAGES["tur+eng"])];
}

export function validateOcrImage(fileLike = {}) {
  const name = String(fileLike.name || "");
  const size = Number(fileLike.size || 0);
  const type = String(fileLike.type || "").toLowerCase();
  if (!name) throw new Error("OCR için bir görsel seç.");
  if (!Number.isFinite(size) || size <= 0) throw new Error("Görsel dosyası boş.");
  if (size > OCR_IMAGE_LIMIT) throw new Error("Görsel 20 MB sınırını aşıyor.");

  const ext = extensionOf(name);
  const inferred = type || (
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
    ext === "png" ? "image/png" :
    ext === "webp" ? "image/webp" : ""
  );
  if (!["image/jpeg", "image/png", "image/webp"].includes(inferred)) {
    throw new Error("OCR için JPEG, PNG veya WebP kullan.");
  }
  return { name, size, type: inferred };
}

export function validateOcrPdf(fileLike = {}) {
  const name = String(fileLike.name || "");
  const size = Number(fileLike.size || 0);
  const type = String(fileLike.type || "").toLowerCase();
  if (!name) throw new Error("OCR için bir PDF seç.");
  if (!Number.isFinite(size) || size <= 0) throw new Error("PDF dosyası boş.");
  if (size > OCR_PDF_LIMIT) throw new Error("PDF 25 MB sınırını aşıyor.");
  if (type && type !== "application/pdf" && extensionOf(name) !== "pdf") {
    throw new Error("Seçilen dosya PDF olarak tanınmadı.");
  }
  if (!type && extensionOf(name) !== "pdf") throw new Error("Seçilen dosya PDF değil.");
  return { name, size, type: "application/pdf" };
}

export function cleanOcrText(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function summarizeOcrText(value) {
  const text = cleanOcrText(value);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  return {
    text,
    characters: text.length,
    words,
    lines: text ? text.split("\n").length : 0
  };
}

export function formatOcrProgress(message = {}) {
  const progress = Math.max(0, Math.min(1, Number(message.progress) || 0));
  const labels = {
    loading: "OCR motoru hazırlanıyor",
    "loading tesseract core": "OCR çekirdeği yükleniyor",
    "initializing tesseract": "OCR çekirdeği başlatılıyor",
    "loading language traineddata": "Dil modeli yükleniyor",
    "initializing api": "Dil modeli hazırlanıyor",
    "recognizing text": "Metin okunuyor"
  };
  return {
    progress,
    percent: Math.round(progress * 100),
    label: labels[String(message.status || "").toLowerCase()] || "OCR işleniyor"
  };
}

function baseUrl() {
  const configured = import.meta.env?.BASE_URL || "/";
  const origin = globalThis.location?.origin || "http://localhost";
  return new URL(configured, origin);
}

export function getOcrAssetPaths() {
  const base = baseUrl();
  return {
    workerPath: new URL("ocr/worker.min.js", base).href,
    corePath: new URL("ocr/core", base).href,
    langPath: new URL("ocr/lang", base).href
  };
}

export async function recognizeOcrSource(source, {
  languages = "tur+eng",
  onProgress = () => {}
} = {}) {
  const { createWorker, OEM } = await import("tesseract.js");
  const paths = getOcrAssetPaths();
  const worker = await createWorker(
    normalizeOcrLanguages(languages),
    OEM.LSTM_ONLY,
    {
      ...paths,
      gzip: true,
      logger(message) {
        onProgress(formatOcrProgress(message));
      }
    }
  );

  try {
    await worker.setParameters({ preserve_interword_spaces: "1" });
    const result = await worker.recognize(source);
    const summary = summarizeOcrText(result.data?.text || "");
    return {
      ...summary,
      confidence: Number.isFinite(Number(result.data?.confidence))
        ? Math.round(Number(result.data.confidence))
        : null
    };
  } finally {
    await worker.terminate();
  }
}

async function loadPdfDocument(file) {
  validateOcrPdf(file);
  const [pdfjs, workerUrl] = await Promise.all([
    import("pdfjs-dist/build/pdf.mjs"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data: bytes });
  return task.promise;
}

export async function getOcrPdfInfo(file) {
  const doc = await loadPdfDocument(file);
  try {
    return { pageCount: doc.numPages };
  } finally {
    await doc.destroy();
  }
}

export async function renderOcrPdfPage(file, pageNumber, canvas) {
  if (!canvas?.getContext) throw new Error("PDF önizleme alanı bulunamadı.");
  const doc = await loadPdfDocument(file);

  try {
    const number = Math.trunc(Number(pageNumber));
    if (!Number.isInteger(number) || number < 1 || number > doc.numPages) {
      throw new Error(`Sayfa 1-${doc.numPages} aralığında olmalı.`);
    }

    const page = await doc.getPage(number);
    const baseViewport = page.getViewport({ scale: 1 });
    let scale = Math.min(3, Math.max(1.5, 1800 / baseViewport.width));

    let viewport = page.getViewport({ scale });
    const pixels = viewport.width * viewport.height;
    if (pixels > OCR_PIXEL_LIMIT) {
      scale *= Math.sqrt(OCR_PIXEL_LIMIT / pixels);
      viewport = page.getViewport({ scale });
    }

    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: context, viewport }).promise;
    return {
      pageCount: doc.numPages,
      pageNumber: number,
      width: canvas.width,
      height: canvas.height
    };
  } finally {
    await doc.destroy();
  }
}
