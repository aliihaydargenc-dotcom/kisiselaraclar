export const RECENT_TOOLS_KEY = "kisiselaraclar:recent-tools";
export const FEATURED_TOOL_IDS = Object.freeze([
  "pdf-merge",
  "image-compress",
  "ocr-image",
  "qr-generate",
  "zip-create",
  "csv-json",
  "media-convert"
]);

export function parseToolHash(hash = "") {
  const raw = String(hash || "").replace(/^#/, "");
  const params = new URLSearchParams(raw);
  return params.get("tool") || "";
}

export function toolHash(id) {
  return `#tool=${encodeURIComponent(String(id || ""))}`;
}

export function normalizeRecentToolIds(
  recentIds = [],
  validIds = [],
  currentId = "",
  limit = 6
) {
  const allowed = new Set(validIds);
  const ordered = currentId ? [currentId, ...recentIds] : [...recentIds];
  const seen = new Set();
  const result = [];

  for (const id of ordered) {
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= limit) break;
  }

  return result;
}

export function loadRecentToolIds(storage, validIds = [], limit = 6) {
  try {
    const raw = storage?.getItem?.(RECENT_TOOLS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return normalizeRecentToolIds(Array.isArray(parsed) ? parsed : [], validIds, "", limit);
  } catch {
    return [];
  }
}

export function rememberRecentTool(storage, id, validIds = [], limit = 6) {
  const recent = normalizeRecentToolIds(
    loadRecentToolIds(storage, validIds, limit),
    validIds,
    id,
    limit
  );
  try {
    storage?.setItem?.(RECENT_TOOLS_KEY, JSON.stringify(recent));
  } catch {
    // Storage kapalıysa ürün normal çalışmaya devam eder.
  }
  return recent;
}

function setDroppedFiles(input, files) {
  if (!files?.length || typeof DataTransfer === "undefined") return false;
  const transfer = new DataTransfer();
  const selected = input.multiple ? [...files] : [files[0]];
  selected.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

export function enhanceFileDrops(root = document) {
  root.querySelectorAll?.(".file-drop").forEach((drop) => {
    if (drop.dataset.dropEnhanced === "true") return;
    const input = drop.querySelector('input[type="file"]');
    if (!input) return;
    drop.dataset.dropEnhanced = "true";

    const stop = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    drop.addEventListener("dragenter", (event) => {
      stop(event);
      drop.classList.add("is-dragging");
    });
    drop.addEventListener("dragover", (event) => {
      stop(event);
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      drop.classList.add("is-dragging");
    });
    drop.addEventListener("dragleave", (event) => {
      stop(event);
      if (!drop.contains(event.relatedTarget)) drop.classList.remove("is-dragging");
    });
    drop.addEventListener("drop", (event) => {
      stop(event);
      drop.classList.remove("is-dragging");
      const files = event.dataTransfer?.files;
      if (files?.length) setDroppedFiles(input, files);
    });
  });
}

export function quickToolIds(recentIds = [], validIds = [], limit = 6) {
  const result = [];
  const seen = new Set();
  for (const id of [...recentIds, ...FEATURED_TOOL_IDS]) {
    if (!validIds.includes(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= limit) break;
  }
  return result;
}


const SMART_FILE_RULES = Object.freeze({
  pdf: ["pdf-preview", "pdf-to-images", "pdf-merge", "pdf-extract", "pdf-rotate", "ocr-pdf-page"],
  image: ["image-compress", "image-resize", "image-crop", "image-convert", "images-to-pdf", "image-metadata", "ocr-image", "barcode-scan"],
  csv: ["csv-json"],
  zip: ["zip-extract"],
  gzip: ["gzip"],
  media: ["media-info", "media-trim", "media-convert"],
  generic: ["zip-create"]
});

let pendingFileHandoff = null;

function fileExtension(name = "") {
  const clean = String(name || "").toLowerCase().split(/[?#]/)[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1) : "";
}

export function classifyFile(fileLike = {}) {
  const type = String(fileLike.type || "").toLowerCase();
  const ext = fileExtension(fileLike.name);

  if (type === "application/pdf" || ext === "pdf") return "pdf";
  if (
    ["image/jpeg", "image/png", "image/webp"].includes(type) ||
    ["jpg", "jpeg", "png", "webp"].includes(ext)
  ) return "image";
  if (
    ["text/csv", "application/csv", "application/vnd.ms-excel"].includes(type) ||
    ext === "csv"
  ) return "csv";
  if (
    ["application/zip", "application/x-zip-compressed"].includes(type) ||
    ext === "zip"
  ) return "zip";
  if (
    type.startsWith("audio/") ||
    type.startsWith("video/") ||
    ["mp4", "m4v", "mov", "webm", "mkv", "mp3", "wav", "m4a", "aac", "flac", "ogg", "opus"].includes(ext)
  ) return "media";
  if (
    ["application/gzip", "application/x-gzip"].includes(type) ||
    ext === "gz" ||
    ext === "gzip"
  ) return "gzip";
  return "generic";
}

export function classifyFileSelection(fileLikes = [], validIds = []) {
  const files = [...(fileLikes || [])].filter(Boolean);
  const allowed = validIds.length ? new Set(validIds) : null;
  const filterIds = (ids) => allowed ? ids.filter((id) => allowed.has(id)) : [...ids];

  if (!files.length) {
    return {
      family: "none",
      label: "",
      summary: "",
      toolIds: []
    };
  }

  if (files.length > 1) {
    const families = files.map(classifyFile);
    const allPdf = families.every((family) => family === "pdf");
    const allImage = families.every((family) => family === "image");
    return {
      family: allPdf ? "pdf-multi" : allImage ? "image-multi" : "multi",
      label: allPdf
        ? `${files.length} PDF`
        : allImage
          ? `${files.length} görsel`
          : `${files.length} dosya`,
      summary: allPdf
        ? "Birden fazla PDF algılandı. Birleştirebilir veya tek ZIP yapabilirsin."
        : allImage
          ? "Birden fazla görsel algılandı. Tek PDF oluşturabilir veya ZIP içinde paketleyebilirsin."
          : "Birden fazla dosya algılandı. Hepsini tek ZIP içinde paketleyebilirsin.",
      toolIds: filterIds(
        allPdf
          ? ["pdf-merge", "zip-create"]
          : allImage
            ? ["images-to-pdf", "zip-create"]
            : ["zip-create"]
      )
    };
  }

  const family = classifyFile(files[0]);
  const labels = {
    pdf: "PDF",
    image: "Görsel",
    csv: "CSV",
    zip: "ZIP",
    gzip: "GZIP",
    media: "Medya",
    generic: "Dosya"
  };
  const summaries = {
    pdf: "PDF algılandı. Görüntüle, düzenle veya OCR ile metnini çıkar.",
    image: "Görsel algılandı. Sıkıştır, boyutlandır, dönüştür, metadata incele veya OCR uygula.",
    csv: "CSV algılandı. Tabloyu görüntüle veya JSON'a dönüştür.",
    zip: "ZIP algılandı. İçeriğini cihazında güvenli biçimde inceleyip çıkart.",
    gzip: "GZIP algılandı. Dosyayı cihazında aç veya yeniden sıkıştır.",
    media: "Ses/video algılandı. Teknik bilgileri incele, kırp veya formatını dönüştür.",
    generic: "Bu dosya için doğrudan düzenleyici yok; istersen ZIP içinde paketleyebilirsin."
  };

  return {
    family,
    label: labels[family],
    summary: summaries[family],
    toolIds: filterIds(SMART_FILE_RULES[family] || SMART_FILE_RULES.generic)
  };
}

export function stageFilesForTool(fileLikes = [], toolId = "") {
  const files = [...(fileLikes || [])].filter(Boolean);
  if (!files.length || !toolId) {
    pendingFileHandoff = null;
    return false;
  }
  pendingFileHandoff = { files, toolId };
  return true;
}

export function clearStagedFiles() {
  pendingFileHandoff = null;
}

export function applyStagedFiles(root, toolId) {
  if (!pendingFileHandoff || pendingFileHandoff.toolId !== toolId) {
    return { attempted: false, applied: false, count: 0 };
  }

  const input = root?.querySelector?.('input[type="file"]');
  if (!input) {
    pendingFileHandoff = null;
    return { attempted: true, applied: false, count: 0, reason: "no-input" };
  }

  if (typeof DataTransfer === "undefined") {
    return {
      attempted: true,
      applied: false,
      count: pendingFileHandoff.files.length,
      reason: "unsupported"
    };
  }

  try {
    const transfer = new DataTransfer();
    const selected = input.multiple
      ? pendingFileHandoff.files
      : pendingFileHandoff.files.slice(0, 1);
    selected.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    pendingFileHandoff = null;
    return { attempted: true, applied: true, count: selected.length };
  } catch {
    return {
      attempted: true,
      applied: false,
      count: pendingFileHandoff.files.length,
      reason: "unsupported"
    };
  }
}
