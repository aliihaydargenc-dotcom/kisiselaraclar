import qrcode from "qrcode-generator";

export const QR_TEXT_LIMIT = 4000;
export const CODE_IMAGE_LIMIT = 20 * 1024 * 1024;
export const CODE_IMAGE_TYPES = Object.freeze(["image/jpeg", "image/png", "image/webp"]);

const CORRECTION_LEVELS = new Set(["L", "M", "Q", "H"]);

export function validateQrText(value) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error("QR kod için metin veya bağlantı gir.");
  if (text.length > QR_TEXT_LIMIT) throw new Error("QR içeriği 4000 karakter sınırını aşıyor.");
  return text;
}

export function normalizeCorrectionLevel(value = "M") {
  const level = String(value || "M").toUpperCase();
  return CORRECTION_LEVELS.has(level) ? level : "M";
}

export function generateQrSvg(value, { correction = "M", cellSize = 8, margin = 4 } = {}) {
  const text = validateQrText(value);
  const qr = qrcode(0, normalizeCorrectionLevel(correction));
  qr.addData(text, "Byte");
  qr.make();

  const size = Math.max(2, Math.min(16, Math.round(Number(cellSize) || 8)));
  const quiet = Math.max(0, Math.min(12, Math.round(Number(margin) || 4)));
  return qr.createSvgTag({
    cellSize: size,
    margin: quiet * size,
    scalable: true
  });
}

export function validateCodeImage(fileLike = {}) {
  const name = String(fileLike.name || "");
  const size = Number(fileLike.size || 0);
  const type = String(fileLike.type || "").toLowerCase();

  if (!name) throw new Error("QR veya barkod içeren bir görsel seç.");
  if (!Number.isFinite(size) || size <= 0) throw new Error("Görsel dosyası boş.");
  if (size > CODE_IMAGE_LIMIT) throw new Error("Görsel 20 MB sınırını aşıyor.");

  const extension = name.toLowerCase().split(".").pop();
  const inferred = type || (
    extension === "jpg" || extension === "jpeg" ? "image/jpeg" :
    extension === "png" ? "image/png" :
    extension === "webp" ? "image/webp" : ""
  );

  if (!CODE_IMAGE_TYPES.includes(inferred)) {
    throw new Error("Barkod okuma için JPEG, PNG veya WebP kullan.");
  }

  return { name, size, type: inferred };
}

export async function decodeBarcodeFromImageElement(imageElement) {
  if (!imageElement) throw new Error("Görsel önizlemesi bulunamadı.");

  const [{ BrowserMultiFormatReader }, { BarcodeFormat }] = await Promise.all([
    import("@zxing/browser"),
    import("@zxing/library")
  ]);

  const reader = new BrowserMultiFormatReader();
  const result = await reader.decodeFromImageElement(imageElement);
  const rawFormat = result.getBarcodeFormat?.();
  return {
    text: result.getText?.() ?? String(result),
    format: BarcodeFormat?.[rawFormat] || String(rawFormat ?? "Bilinmiyor")
  };
}
