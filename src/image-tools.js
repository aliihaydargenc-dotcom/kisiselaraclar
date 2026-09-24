export const IMAGE_FILE_LIMIT = 30 * 1024 * 1024;
export const IMAGE_PIXEL_LIMIT = 50_000_000;
export const EDITABLE_IMAGE_TYPES = Object.freeze(["image/jpeg", "image/png", "image/webp"]);

const MIME_BY_EXTENSION = Object.freeze({
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
});

const EXTENSION_BY_MIME = Object.freeze({
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
});

function positiveNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function inferImageMime(fileLike = {}) {
  const explicit = String(fileLike.type || "").toLowerCase();
  if (EDITABLE_IMAGE_TYPES.includes(explicit)) return explicit;
  const extension = String(fileLike.name || "").toLowerCase().split(".").pop();
  return MIME_BY_EXTENSION[extension] || "";
}

export function validateImageDescriptor(fileLike = {}) {
  const size = Number(fileLike.size || 0);
  if (!fileLike.name) throw new Error("Görsel dosyası seç.");
  if (!Number.isFinite(size) || size <= 0) throw new Error("Görsel dosyası boş.");
  if (size > IMAGE_FILE_LIMIT) throw new Error(`${fileLike.name} 30 MB sınırını aşıyor.`);
  const mime = inferImageMime(fileLike);
  if (!mime) throw new Error("Bu sürüm JPEG, PNG ve WebP dosyalarını destekliyor.");
  return { mime, size, name: String(fileLike.name) };
}

export function normalizeQuality(value, fallback = 0.82) {
  let quality = Number(value);
  if (!Number.isFinite(quality)) quality = fallback;
  if (quality > 1) quality /= 100;
  return clamp(quality, 0.1, 1);
}

export function calculateResizeDimensions(
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  { keepAspect = true, allowUpscale = false } = {}
) {
  const sourceW = positiveNumber(sourceWidth);
  const sourceH = positiveNumber(sourceHeight);
  if (!sourceW || !sourceH) throw new Error("Kaynak görsel ölçüleri geçersiz.");

  const targetW = positiveNumber(targetWidth);
  const targetH = positiveNumber(targetHeight);
  if (!targetW && !targetH) return { width: Math.round(sourceW), height: Math.round(sourceH) };

  if (!keepAspect) {
    const width = Math.round(targetW || sourceW);
    const height = Math.round(targetH || sourceH);
    if (!allowUpscale && (width > sourceW || height > sourceH)) {
      throw new Error("Büyütme kapalıyken kaynak ölçülerinin üstüne çıkılamaz.");
    }
    return { width, height };
  }

  const scales = [];
  if (targetW) scales.push(targetW / sourceW);
  if (targetH) scales.push(targetH / sourceH);
  let scale = Math.min(...scales);
  if (!allowUpscale) scale = Math.min(scale, 1);
  return {
    width: Math.max(1, Math.round(sourceW * scale)),
    height: Math.max(1, Math.round(sourceH * scale))
  };
}

export function normalizeCropRect(rect, sourceWidth, sourceHeight) {
  const width = positiveNumber(sourceWidth);
  const height = positiveNumber(sourceHeight);
  if (!width || !height) throw new Error("Kaynak görsel ölçüleri geçersiz.");

  const x = clamp(Number(rect?.x || 0), 0, width - 1);
  const y = clamp(Number(rect?.y || 0), 0, height - 1);
  const cropWidth = clamp(positiveNumber(rect?.width, width - x), 1, width - x);
  const cropHeight = clamp(positiveNumber(rect?.height, height - y), 1, height - y);

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight)
  };
}

export function resolveOutputType(requested = "preserve", inputMime = "image/jpeg") {
  const normalized = requested === "preserve" ? inputMime : requested;
  const mime = EDITABLE_IMAGE_TYPES.includes(normalized) ? normalized : "image/jpeg";
  return {
    mime,
    extension: EXTENSION_BY_MIME[mime],
    qualitySupported: mime !== "image/png"
  };
}

export function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

async function decodeWithImageElement(file) {
  if (typeof document === "undefined") throw new Error("Tarayıcı görsel decoder'ı bulunamadı.");
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Görsel açılamadı."));
      image.src = url;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose() { URL.revokeObjectURL(url); }
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function decodeImageFile(file) {
  validateImageDescriptor(file);

  if (typeof createImageBitmap === "function") {
    try {
      let bitmap;
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch {
        bitmap = await createImageBitmap(file);
      }
      if (bitmap.width * bitmap.height > IMAGE_PIXEL_LIMIT) {
        bitmap.close?.();
        throw new Error("Görsel 50 megapiksel güvenlik sınırını aşıyor.");
      }
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose() { bitmap.close?.(); }
      };
    } catch (error) {
      if (error instanceof Error && /50 megapiksel/.test(error.message)) throw error;
    }
  }

  const fallback = await decodeWithImageElement(file);
  if (fallback.width * fallback.height > IMAGE_PIXEL_LIMIT) {
    fallback.dispose();
    throw new Error("Görsel 50 megapiksel güvenlik sınırını aşıyor.");
  }
  return fallback;
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Görsel çıktısı oluşturulamadı."))),
      mime,
      quality
    );
  });
}

export async function processImageFile(
  file,
  {
    cropRect = null,
    targetWidth = null,
    targetHeight = null,
    keepAspect = true,
    allowUpscale = false,
    outputType = "preserve",
    quality = 0.82,
    background = "#ffffff"
  } = {}
) {
  const descriptor = validateImageDescriptor(file);
  const decoded = await decodeImageFile(file);

  try {
    const crop = normalizeCropRect(
      cropRect || { x: 0, y: 0, width: decoded.width, height: decoded.height },
      decoded.width,
      decoded.height
    );
    const dimensions = calculateResizeDimensions(
      crop.width,
      crop.height,
      targetWidth,
      targetHeight,
      { keepAspect, allowUpscale }
    );
    const output = resolveOutputType(outputType, descriptor.mime);

    if (typeof document === "undefined") throw new Error("Canvas yalnız tarayıcıda kullanılabilir.");
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext("2d", { alpha: output.mime !== "image/jpeg" });
    if (!context) throw new Error("Canvas 2D bağlamı açılamadı.");

    if (output.mime === "image/jpeg") {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      decoded.source,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      dimensions.width,
      dimensions.height
    );

    const blob = await canvasToBlob(
      canvas,
      output.mime,
      output.qualitySupported ? normalizeQuality(quality) : undefined
    );

    return {
      blob,
      width: dimensions.width,
      height: dimensions.height,
      mime: output.mime,
      extension: output.extension,
      originalBytes: descriptor.size,
      outputBytes: blob.size,
      savedPercent: descriptor.size > 0
        ? Math.round(((descriptor.size - blob.size) / descriptor.size) * 100)
        : 0
    };
  } finally {
    decoded.dispose();
  }
}

function metadataValue(tag) {
  const raw = tag?.description ?? tag?.value;
  if (raw === undefined || raw === null) return "";
  if (Array.isArray(raw)) return raw.join(", ");
  if (typeof raw === "object") {
    try { return JSON.stringify(raw); }
    catch { return String(raw); }
  }
  return String(raw);
}

export function normalizeMetadataTags(tags = {}) {
  const skipped = /^(Thumbnail|MakerNote|MPF|ICC_Profile|PrintIM)$/i;
  const rows = [];

  for (const [key, tag] of Object.entries(tags || {})) {
    if (skipped.test(key)) continue;
    let value = metadataValue(tag).replace(/\s+/g, " ").trim();
    if (!value) continue;
    if (value.length > 240) value = value.slice(0, 237) + "...";
    rows.push({ key, value });
    if (rows.length >= 120) break;
  }

  const sensitive = rows.some((row) =>
    /gps|latitude|longitude|location|geotag/i.test(row.key + " " + row.value)
  );
  return { rows, sensitive };
}

export async function readImageMetadata(file) {
  validateImageDescriptor(file);
  const module = await import("exifreader");
  const ExifReader = module.default || module;
  const tags = await ExifReader.load(await file.arrayBuffer());
  return normalizeMetadataTags(tags);
}
