import { gzip, gunzip, unzip, zip } from "fflate";

export const ARCHIVE_FILE_LIMIT = 100 * 1024 * 1024;
export const ARCHIVE_TOTAL_INPUT_LIMIT = 150 * 1024 * 1024;
export const ARCHIVE_OUTPUT_LIMIT = 300 * 1024 * 1024;
export const ARCHIVE_ENTRY_LIMIT = 1000;

function toUint8Array(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new Error("Dosya verisi okunamadı.");
}

export function sanitizeArchivePath(value) {
  const normalized = String(value || "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");

  const parts = normalized
    .split("/")
    .filter((part) => part && part !== "." && part !== "..");

  return parts.join("/") || "dosya";
}

export function validateArchiveEntries(entries = []) {
  if (!Array.isArray(entries) || !entries.length) throw new Error("En az bir dosya seç.");
  if (entries.length > ARCHIVE_ENTRY_LIMIT) throw new Error("Tek arşivde en fazla 1000 dosya olabilir.");

  let total = 0;
  const seen = new Set();

  const normalized = entries.map((entry, index) => {
    const bytes = toUint8Array(entry.bytes);
    if (!bytes.byteLength) throw new Error(`${entry.name || index + 1}. dosya boş.`);
    if (bytes.byteLength > ARCHIVE_FILE_LIMIT) {
      throw new Error(`${entry.name || index + 1}. dosya 100 MB sınırını aşıyor.`);
    }
    total += bytes.byteLength;
    if (total > ARCHIVE_TOTAL_INPUT_LIMIT) throw new Error("Toplam giriş boyutu 150 MB sınırını aşıyor.");

    let name = sanitizeArchivePath(entry.name || `dosya-${index + 1}`);
    const original = name;
    let suffix = 2;
    while (seen.has(name)) {
      const dot = original.lastIndexOf(".");
      name = dot > 0
        ? `${original.slice(0, dot)}-${suffix}${original.slice(dot)}`
        : `${original}-${suffix}`;
      suffix += 1;
    }
    seen.add(name);
    return { name, bytes };
  });

  return { entries: normalized, totalBytes: total };
}

function asyncZip(data, options) {
  return new Promise((resolve, reject) => {
    zip(data, options, (error, output) => {
      if (error) reject(error);
      else resolve(output);
    });
  });
}

function asyncUnzip(data) {
  return new Promise((resolve, reject) => {
    unzip(data, (error, output) => {
      if (error) reject(error);
      else resolve(output);
    });
  });
}

function asyncGzip(data, options) {
  return new Promise((resolve, reject) => {
    gzip(data, options, (error, output) => {
      if (error) reject(error);
      else resolve(output);
    });
  });
}

function asyncGunzip(data) {
  return new Promise((resolve, reject) => {
    gunzip(data, (error, output) => {
      if (error) reject(error);
      else resolve(output);
    });
  });
}

function findEndOfCentralDirectory(data) {
  const minOffset = Math.max(0, data.length - 65557);
  for (let offset = data.length - 22; offset >= minOffset; offset -= 1) {
    if (
      data[offset] === 0x50 &&
      data[offset + 1] === 0x4b &&
      data[offset + 2] === 0x05 &&
      data[offset + 3] === 0x06
    ) {
      return offset;
    }
  }
  return -1;
}

export function inspectZipSafety(value) {
  const data = toUint8Array(value);
  if (data.byteLength > ARCHIVE_FILE_LIMIT) throw new Error("ZIP dosyası 100 MB sınırını aşıyor.");

  const eocd = findEndOfCentralDirectory(data);
  if (eocd < 0) throw new Error("Geçerli ZIP merkez dizini bulunamadı.");

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const totalEntries = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);

  if (
    totalEntries === 0xffff ||
    centralSize === 0xffffffff ||
    centralOffset === 0xffffffff
  ) {
    throw new Error("ZIP64 arşivleri bu sürümde desteklenmiyor.");
  }
  if (totalEntries > ARCHIVE_ENTRY_LIMIT) throw new Error("ZIP 1000'den fazla giriş içeriyor.");
  if (centralOffset + centralSize > data.byteLength) throw new Error("ZIP merkez dizini bozuk.");

  const decoder = new TextDecoder();
  const entries = [];
  let totalUncompressed = 0;
  let offset = centralOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (offset + 46 > data.byteLength || view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("ZIP merkez dizini okunamadı.");
    }

    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new Error("ZIP64 girişleri bu sürümde desteklenmiyor.");
    }

    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > data.byteLength) throw new Error("ZIP dosya adı okunamadı.");

    const rawName = decoder.decode(data.subarray(nameStart, nameEnd));
    const name = sanitizeArchivePath(rawName);
    totalUncompressed += uncompressedSize;

    if (uncompressedSize > ARCHIVE_FILE_LIMIT) {
      throw new Error(`${name} açıldığında 100 MB sınırını aşıyor.`);
    }
    if (totalUncompressed > ARCHIVE_OUTPUT_LIMIT) {
      throw new Error("ZIP açıldığında 300 MB güvenlik sınırını aşıyor.");
    }

    entries.push({
      name,
      compressedSize,
      uncompressedSize,
      directory: rawName.endsWith("/")
    });

    offset = nameEnd + extraLength + commentLength;
  }

  return {
    entryCount: totalEntries,
    compressedBytes: data.byteLength,
    uncompressedBytes: totalUncompressed,
    entries
  };
}

export async function createZipArchive(entries, { level = 6 } = {}) {
  const validated = validateArchiveEntries(entries);
  const payload = Object.create(null);
  for (const entry of validated.entries) payload[entry.name] = entry.bytes;

  const output = await asyncZip(payload, {
    level: Math.max(0, Math.min(9, Math.round(Number(level) || 6)))
  });

  return {
    bytes: output,
    inputBytes: validated.totalBytes,
    outputBytes: output.byteLength,
    entryCount: validated.entries.length
  };
}

export async function extractZipArchive(value) {
  const data = toUint8Array(value);
  const inspection = inspectZipSafety(data);
  const extracted = await asyncUnzip(data);
  const entries = [];

  for (const [rawName, bytes] of Object.entries(extracted)) {
    const name = sanitizeArchivePath(rawName);
    if (rawName.endsWith("/")) continue;
    entries.push({ name, bytes: toUint8Array(bytes) });
  }

  return { inspection, entries };
}

export function inspectGzipExpectedSize(value) {
  const data = toUint8Array(value);
  if (data.byteLength < 18 || data[0] !== 0x1f || data[1] !== 0x8b) {
    throw new Error("Geçerli bir GZIP dosyası değil.");
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const expectedBytes = view.getUint32(data.byteLength - 4, true);
  if (expectedBytes > ARCHIVE_OUTPUT_LIMIT) {
    throw new Error("GZIP açıldığında 300 MB güvenlik sınırını aşıyor.");
  }
  return expectedBytes;
}

export async function gzipBuffer(value, { level = 6 } = {}) {
  const data = toUint8Array(value);
  if (!data.byteLength) throw new Error("Sıkıştırılacak dosya boş.");
  if (data.byteLength > ARCHIVE_FILE_LIMIT) throw new Error("Dosya 100 MB sınırını aşıyor.");
  return asyncGzip(data, {
    level: Math.max(0, Math.min(9, Math.round(Number(level) || 6)))
  });
}

export async function gunzipBuffer(value) {
  const data = toUint8Array(value);
  if (data.byteLength > ARCHIVE_FILE_LIMIT) throw new Error("GZIP dosyası 100 MB sınırını aşıyor.");
  inspectGzipExpectedSize(data);
  const output = await asyncGunzip(data);
  if (output.byteLength > ARCHIVE_OUTPUT_LIMIT) throw new Error("Çıktı 300 MB güvenlik sınırını aşıyor.");
  return output;
}
