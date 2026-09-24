export const RECENT_TOOLS_KEY = "kisiselaraclar:recent-tools";
export const FEATURED_TOOL_IDS = Object.freeze([
  "pdf-merge",
  "image-compress",
  "ocr-image",
  "qr-generate",
  "zip-create",
  "csv-json"
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
