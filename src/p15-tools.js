const HEX = "0123456789ABCDEF";

export const FAVICON_SIZES = Object.freeze([16, 32, 48, 180, 192, 512]);

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function gcd(a, b) {
  let x = Math.abs(Math.round(Number(a) || 0));
  let y = Math.abs(Math.round(Number(b) || 0));
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

export function aspectRatio(width, height) {
  const w = Math.max(1, Math.round(Number(width) || 0));
  const h = Math.max(1, Math.round(Number(height) || 0));
  const d = gcd(w, h);
  return {
    width: w,
    height: h,
    ratio: `${w / d}:${h / d}`,
    decimal: w / h,
    orientation: w === h ? "square" : w > h ? "landscape" : "portrait"
  };
}

function byteHex(value) {
  const n = clamp(value, 0, 255);
  return `${HEX[(n >> 4) & 15]}${HEX[n & 15]}`;
}

export function rgbaToHex(r, g, b) {
  return `#${byteHex(r)}${byteHex(g)}${byteHex(b)}`;
}

export function pixelColor(data, width, height, x, y) {
  const w = Math.max(1, Math.round(Number(width) || 1));
  const h = Math.max(1, Math.round(Number(height) || 1));
  const px = clamp(Math.floor(Number(x) || 0), 0, w - 1);
  const py = clamp(Math.floor(Number(y) || 0), 0, h - 1);
  const index = (py * w + px) * 4;
  const r = data[index] ?? 0;
  const g = data[index + 1] ?? 0;
  const b = data[index + 2] ?? 0;
  const a = data[index + 3] ?? 255;
  return { x: px, y: py, r, g, b, a, hex: rgbaToHex(r, g, b), alpha: a / 255 };
}

function quantize(value, step) {
  const safeStep = Math.max(1, Number(step) || 32);
  return clamp(Math.round(value / safeStep) * safeStep, 0, 255);
}

export function imageColorStats(data, { limit = 8, quantizeStep = 32, sampleStep = 1 } = {}) {
  const counts = new Map();
  let sampled = 0;
  let visible = 0;
  let transparent = 0;
  const stride = Math.max(1, Math.round(Number(sampleStep) || 1)) * 4;

  for (let i = 0; i < data.length; i += stride) {
    sampled += 1;
    const alpha = data[i + 3] ?? 255;
    if (alpha < 32) {
      transparent += 1;
      continue;
    }
    visible += 1;
    const color = rgbaToHex(
      quantize(data[i] ?? 0, quantizeStep),
      quantize(data[i + 1] ?? 0, quantizeStep),
      quantize(data[i + 2] ?? 0, quantizeStep)
    );
    counts.set(color, (counts.get(color) || 0) + 1);
  }

  const colors = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(1, Number(limit) || 8))
    .map(([hex, count]) => ({
      hex,
      count,
      pct: visible ? (count / visible) * 100 : 0
    }));

  return {
    sampled,
    visible,
    transparent,
    transparentPct: sampled ? (transparent / sampled) * 100 : 0,
    dominant: colors[0]?.hex || null,
    colors
  };
}

export function transparencyReport(data) {
  let transparent = 0;
  let translucent = 0;
  let opaque = 0;
  let total = 0;
  for (let i = 3; i < data.length; i += 4) {
    total += 1;
    const alpha = data[i] ?? 255;
    if (alpha === 0) transparent += 1;
    else if (alpha < 255) translucent += 1;
    else opaque += 1;
  }
  const pct = (value) => total ? (value / total) * 100 : 0;
  return {
    total,
    transparent,
    translucent,
    opaque,
    transparentPct: pct(transparent),
    translucentPct: pct(translucent),
    opaquePct: pct(opaque),
    hasAlpha: transparent + translucent > 0
  };
}

function isSafeSvgReference(value) {
  const ref = String(value || "").trim();
  return ref.startsWith("#") || /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(ref);
}

function sanitizeSvgReferences(value) {
  return String(value || "")
    .replace(/@import\s+(?:url\([^)]*\)|["'][^"']+["'])\s*;?/gi, "")
    .replace(/url\(\s*(["']?)([^)"']+)\1\s*\)/gi, (match, quote, ref) =>
      isSafeSvgReference(ref) ? match : "none"
    );
}

export function sanitizeSvgText(input) {
  let svg = String(input ?? "").trim();
  if (!/<svg\b/i.test(svg)) throw new Error("Geçerli bir SVG kök etiketi bulunamadı.");
  svg = svg
    .replace(/<\?(?:xml)[^>]*>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<(script|foreignObject|iframe|object|embed)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|foreignObject|iframe|object|embed)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:href|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (match, raw) => {
      const ref = raw.replace(/^(["'])|(["'])$/g, "");
      return isSafeSvgReference(ref) ? match : "";
    })
    .replace(/url\(\s*(["']?)\s*javascript:[^)]+\)/gi, "none");
  svg = sanitizeSvgReferences(svg);
  return svg.trim();
}

function attrValue(svg, name) {
  const match = String(svg).match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] || null;
}

function numericLength(value) {
  const match = String(value || "").match(/^\s*([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : null;
}

export function svgInfo(input) {
  const sanitized = sanitizeSvgText(input);
  const widthAttr = attrValue(sanitized, "width");
  const heightAttr = attrValue(sanitized, "height");
  const viewBox = attrValue(sanitized, "viewBox");
  let width = numericLength(widthAttr);
  let height = numericLength(heightAttr);
  if ((!width || !height) && viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      width ||= Math.abs(parts[2]);
      height ||= Math.abs(parts[3]);
    }
  }
  const elements = [...sanitized.matchAll(/<([a-z][\w:-]*)\b/gi)].map((match) => match[1].toLowerCase());
  const uniqueElements = [...new Set(elements)];
  return {
    sanitized,
    width,
    height,
    viewBox,
    elementCount: elements.length,
    uniqueElements,
    bytes: new TextEncoder().encode(sanitized).length
  };
}

function parseJson(value) {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function joinPath(base, key, array = false) {
  if (array) return `${base}[${key}]`;
  return base ? `${base}.${key}` : String(key);
}

export function jsonDiff(leftInput, rightInput) {
  const left = parseJson(leftInput);
  const right = parseJson(rightInput);
  const changes = [];

  function walk(a, b, path = "$" ) {
    if (Object.is(a, b)) return;
    const ta = typeOf(a);
    const tb = typeOf(b);
    if (ta !== tb || !["object", "array"].includes(ta)) {
      changes.push({ type: "changed", path, before: a, after: b });
      return;
    }

    if (ta === "array") {
      const length = Math.max(a.length, b.length);
      for (let i = 0; i < length; i += 1) {
        const next = joinPath(path, i, true);
        if (i >= a.length) changes.push({ type: "added", path: next, after: b[i] });
        else if (i >= b.length) changes.push({ type: "removed", path: next, before: a[i] });
        else walk(a[i], b[i], next);
      }
      return;
    }

    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      const next = path === "$" ? `$.${key}` : joinPath(path, key);
      if (!(key in a)) changes.push({ type: "added", path: next, after: b[key] });
      else if (!(key in b)) changes.push({ type: "removed", path: next, before: a[key] });
      else walk(a[key], b[key], next);
    }
  }

  walk(left, right);
  return {
    equal: changes.length === 0,
    changes,
    summary: {
      added: changes.filter((item) => item.type === "added").length,
      removed: changes.filter((item) => item.type === "removed").length,
      changed: changes.filter((item) => item.type === "changed").length
    }
  };
}

export function regexMatches(pattern, flags = "g", text = "", maxMatches = 500) {
  const allowed = new Set("dgimsuvy".split(""));
  const cleanFlags = [...new Set(String(flags || "").split(""))].filter((flag) => allowed.has(flag)).join("");
  const scanFlags = cleanFlags.includes("g") || cleanFlags.includes("y") ? cleanFlags : `${cleanFlags}g`;
  const regex = new RegExp(String(pattern ?? ""), scanFlags);
  const source = String(text ?? "");
  const matches = [];
  let match;
  while ((match = regex.exec(source)) && matches.length < maxMatches) {
    matches.push({
      value: match[0],
      index: match.index,
      end: match.index + match[0].length,
      groups: match.slice(1),
      namedGroups: match.groups ? { ...match.groups } : null
    });
    if (match[0] === "") regex.lastIndex += 1;
  }
  return { flags: scanFlags, matches, limited: matches.length >= maxMatches };
}

export function uuidV4FromBytes(input) {
  if (!input || input.length < 16) throw new Error("UUID için 16 byte gerekir.");
  const bytes = Uint8Array.from(input).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

export function makeUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (!globalThis.crypto?.getRandomValues) throw new Error("Güvenli rastgele sayı üreticisi kullanılamıyor.");
  globalThis.crypto.getRandomValues(bytes);
  return uuidV4FromBytes(bytes);
}

function decodeBase64Url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = globalThis.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwt(token) {
  const parts = String(token || "").trim().split(".");
  if (parts.length < 2) throw new Error("JWT en az header.payload biçiminde olmalı.");
  const header = JSON.parse(decodeBase64Url(parts[0]));
  const payload = JSON.parse(decodeBase64Url(parts[1]));
  return { header, payload, signaturePresent: Boolean(parts[2]), verified: false };
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return text;
}

export function markdownToHtml(input) {
  const lines = String(input ?? "").replace(/\r\n?/g, "\n").split("\n");
  const output = [];
  let listType = "";
  let inCode = false;
  let codeLines = [];

  const closeList = () => {
    if (listType) output.push(`</${listType}>`);
    listType = "";
  };

  for (const raw of lines) {
    if (/^```/.test(raw.trim())) {
      closeList();
      if (inCode) {
        output.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(raw);
      continue;
    }
    const heading = raw.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const unordered = raw.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = raw.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      const wanted = unordered ? "ul" : "ol";
      if (listType && listType !== wanted) closeList();
      if (!listType) {
        listType = wanted;
        output.push(`<${wanted}>`);
      }
      output.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
      continue;
    }
    closeList();
    if (!raw.trim()) continue;
    if (/^>\s?/.test(raw)) output.push(`<blockquote>${inlineMarkdown(raw.replace(/^>\s?/, ""))}</blockquote>`);
    else output.push(`<p>${inlineMarkdown(raw)}</p>`);
  }
  closeList();
  if (inCode) output.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  return output.join("\n");
}

export function minifyHtml(input) {
  return String(input ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function minifyCss(input) {
  return String(input ?? "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

export async function sha256Text(input) {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto kullanılamıyor.");
  const bytes = new TextEncoder().encode(String(input ?? ""));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}


export function decodeHtmlEntities(input) {
  return String(input ?? "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}
