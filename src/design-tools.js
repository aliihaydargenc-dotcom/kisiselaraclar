const HEX_RE = /^#?([0-9a-f]{6})$/i;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHex(value) {
  const raw = String(value || "").trim();
  const match = raw.match(HEX_RE);
  if (!match) throw new Error("Geçerli bir 6 haneli HEX renk gir.");
  return `#${match[1].toUpperCase()}`;
}

export function hexToRgb(value) {
  const hex = normalizeHex(value).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

export function rgbToHex({ r, g, b }) {
  const toHex = (part) => Math.round(clamp(part, 0, 255)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }

  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }) {
  const hn = ((Number(h) % 360) + 360) % 360;
  const sn = clamp(Number(s), 0, 100) / 100;
  const ln = clamp(Number(l), 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (hn < 60) [rp, gp, bp] = [c, x, 0];
  else if (hn < 120) [rp, gp, bp] = [x, c, 0];
  else if (hn < 180) [rp, gp, bp] = [0, c, x];
  else if (hn < 240) [rp, gp, bp] = [0, x, c];
  else if (hn < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255)
  };
}

export function hslToHex(hsl) {
  return rgbToHex(hslToRgb(hsl));
}

export function relativeLuminance(value) {
  const { r, g, b } = hexToRgb(value);
  const channel = (part) => {
    const n = part / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a, b) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

export function readableText(background) {
  const whiteRatio = contrastRatio(background, "#FFFFFF");
  const blackRatio = contrastRatio(background, "#0A0B10");
  return whiteRatio >= blackRatio ? "#FFFFFF" : "#0A0B10";
}

export function mixHex(a, b, weight = 0.5) {
  const first = hexToRgb(a);
  const second = hexToRgb(b);
  const w = clamp(Number(weight), 0, 1);
  return rgbToHex({
    r: first.r + (second.r - first.r) * w,
    g: first.g + (second.g - first.g) * w,
    b: first.b + (second.b - first.b) * w
  });
}

function shifted(seed, hueDelta = 0, saturationDelta = 0, lightnessDelta = 0) {
  const hsl = rgbToHsl(hexToRgb(seed));
  return hslToHex({
    h: hsl.h + hueDelta,
    s: clamp(hsl.s + saturationDelta, 8, 96),
    l: clamp(hsl.l + lightnessDelta, 12, 88)
  });
}

export function generateHarmony(seedValue, mode = "analogous") {
  const seed = normalizeHex(seedValue);
  const hsl = rgbToHsl(hexToRgb(seed));
  const make = (h, s = hsl.s, l = hsl.l) => hslToHex({ h, s: clamp(s, 8, 96), l: clamp(l, 12, 88) });

  const modes = {
    analogous: [-60, -30, 0, 30, 60].map((delta) => make(hsl.h + delta)),
    complementary: [
      shifted(seed, 0, -8, 22),
      seed,
      shifted(seed, 180, 0, 0),
      shifted(seed, 180, -8, 20),
      shifted(seed, 0, 4, -16)
    ],
    triadic: [
      shifted(seed, 0, -6, 20),
      seed,
      shifted(seed, 120, 0, 0),
      shifted(seed, 240, 0, 0),
      shifted(seed, 120, -8, 18)
    ],
    split: [
      shifted(seed, 0, -6, 20),
      seed,
      shifted(seed, 150, 0, 0),
      shifted(seed, 210, 0, 0),
      shifted(seed, 210, -8, 18)
    ],
    tetradic: [
      seed,
      shifted(seed, 90, 0, 0),
      shifted(seed, 180, 0, 0),
      shifted(seed, 270, 0, 0),
      shifted(seed, 0, -10, 22)
    ],
    monochrome: [20, 34, 48, 64, 80].map((lightness) =>
      make(hsl.h, Math.max(18, hsl.s - (Math.abs(50 - lightness) * 0.28)), lightness)
    )
  };

  return modes[mode] || modes.analogous;
}

function ensureTextContrast(text, background, target = 4.5) {
  if (contrastRatio(text, background) >= target) return text;
  return readableText(background);
}

export function generateSiteTheme(seedValue, scheme = "light") {
  const seed = normalizeHex(seedValue);
  const dark = scheme === "dark";
  const accent = dark ? mixHex(seed, "#FFFFFF", 0.08) : mixHex(seed, "#000000", 0.06);
  const background = dark ? "#0C0D11" : mixHex(seed, "#FFFFFF", 0.965);
  const surface = dark ? mixHex(seed, "#111318", 0.82) : "#FFFFFF";
  const surfaceAlt = dark ? mixHex(seed, "#171922", 0.78) : mixHex(seed, "#FFFFFF", 0.91);
  const text = dark ? "#F7F7F3" : "#111318";
  const muted = dark ? "#B8B9B3" : "#5D615F";
  const border = dark ? mixHex(seed, "#6B6D76", 0.72) : mixHex(seed, "#D9DCE2", 0.80);
  const focus = shifted(seed, 38, 10, dark ? 16 : -2);
  const primaryText = readableText(accent);
  const primaryHover = dark ? mixHex(accent, "#FFFFFF", 0.10) : mixHex(accent, "#000000", 0.12);

  return {
    scheme: dark ? "dark" : "light",
    seed,
    tokens: {
      bg: background,
      surface,
      surfaceAlt,
      text: ensureTextContrast(text, background),
      muted: ensureTextContrast(muted, background, 3),
      border,
      primary: accent,
      primaryHover,
      onPrimary: primaryText,
      focus
    },
    checks: {
      body: contrastRatio(text, background),
      primary: contrastRatio(primaryText, accent),
      muted: contrastRatio(muted, background)
    }
  };
}

export function themeToCss(theme) {
  const t = theme.tokens;
  return [
    `:root {`,
    `  --ui-bg: ${t.bg};`,
    `  --ui-surface: ${t.surface};`,
    `  --ui-surface-alt: ${t.surfaceAlt};`,
    `  --ui-text: ${t.text};`,
    `  --ui-muted: ${t.muted};`,
    `  --ui-border: ${t.border};`,
    `  --ui-primary: ${t.primary};`,
    `  --ui-primary-hover: ${t.primaryHover};`,
    `  --ui-on-primary: ${t.onPrimary};`,
    `  --ui-focus: ${t.focus};`,
    `}`
  ].join("\n");
}

export function buttonCss(options = {}) {
  const mode = options.mode === "mobile" ? "mobile" : "web";
  const variant = ["solid", "outline", "soft", "ghost"].includes(options.variant) ? options.variant : "solid";
  const color = normalizeHex(options.color || "#4967FF");
  const radius = clamp(Number(options.radius ?? (mode === "mobile" ? 14 : 10)), 0, 40);
  const minHeight = clamp(Number(options.minHeight ?? (mode === "mobile" ? 48 : 44)), 32, 72);
  const horizontal = clamp(Number(options.horizontal ?? (mode === "mobile" ? 18 : 20)), 8, 40);
  const fullWidth = Boolean(options.fullWidth);
  const foreground = readableText(color);
  const softBackground = mixHex(color, "#FFFFFF", 0.86);
  const softText = readableText(softBackground) === "#0A0B10" ? mixHex(color, "#000000", 0.28) : foreground;
  const selector = mode === "mobile" ? ".mobile-action" : ".ui-button";

  let background = color;
  let text = foreground;
  let border = color;
  let hoverBackground = mixHex(color, "#000000", 0.12);
  let hoverText = readableText(hoverBackground);

  if (variant === "outline") {
    background = "transparent";
    text = color;
    border = color;
    hoverBackground = color;
    hoverText = foreground;
  } else if (variant === "soft") {
    background = softBackground;
    text = softText;
    border = "transparent";
    hoverBackground = mixHex(color, "#FFFFFF", 0.78);
    hoverText = readableText(hoverBackground);
  } else if (variant === "ghost") {
    background = "transparent";
    text = color;
    border = "transparent";
    hoverBackground = mixHex(color, "#FFFFFF", 0.88);
    hoverText = readableText(hoverBackground) === "#0A0B10" ? mixHex(color, "#000000", 0.28) : foreground;
  }

  const lines = [
    `${selector} {`,
    `  min-height: ${minHeight}px;`,
    `  padding: 0 ${horizontal}px;`,
    `  border: ${variant === "ghost" ? "1px" : "2px"} solid ${border};`,
    `  border-radius: ${radius}px;`,
    `  background: ${background};`,
    `  color: ${text};`,
    `  font: 700 15px/1 system-ui, sans-serif;`,
    `  cursor: pointer;`,
    `  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;`,
    `  ${fullWidth ? "width: 100%;" : "width: auto;"}`,
    `}`,
    `${selector}:hover {`,
    `  background: ${hoverBackground};`,
    `  color: ${hoverText};`,
    `  transform: translateY(-1px);`,
    `}`,
    `${selector}:focus-visible {`,
    `  outline: 3px solid ${mixHex(color, "#FFFFFF", 0.32)};`,
    `  outline-offset: 3px;`,
    `}`,
    `${selector}:active { transform: translateY(0); }`
  ];

  if (mode === "mobile") {
    lines.push(
      `@media (max-width: 620px) {`,
      `  ${selector} { min-height: ${Math.max(48, minHeight)}px; ${fullWidth ? "width: 100%;" : ""} }`,
      `}`
    );
  }

  return {
    selector,
    css: lines.join("\n"),
    html: `<button class="${selector.slice(1)}">Devam et</button>`,
    metrics: {
      minHeight,
      wcagMinimum: minHeight >= 24,
      recommendedTouch: minHeight >= 48
    },
    preview: { background, text, border, hoverBackground, hoverText, radius, minHeight, horizontal, fullWidth }
  };
}

export function gradientCss(options = {}) {
  const start = normalizeHex(options.start || "#4967FF");
  const end = normalizeHex(options.end || "#FF6B6B");
  const type = options.type === "radial" ? "radial" : "linear";
  const angle = clamp(Number(options.angle ?? 135), 0, 360);
  const background = type === "radial"
    ? "radial-gradient(circle at center, " + start + " 0%, " + end + " 100%)"
    : "linear-gradient(" + angle + "deg, " + start + " 0%, " + end + " 100%)";
  return { start, end, type, angle, background, css: "background: " + background + ";" };
}

export function shadowCss(options = {}) {
  const color = normalizeHex(options.color || "#0A0B10");
  const x = clamp(Number(options.x ?? 0), -80, 80);
  const y = clamp(Number(options.y ?? 18), -80, 80);
  const blur = clamp(Number(options.blur ?? 40), 0, 120);
  const spread = clamp(Number(options.spread ?? -12), -60, 60);
  const opacity = clamp(Number(options.opacity ?? 22), 0, 100) / 100;
  const inset = Boolean(options.inset);
  const rgb = hexToRgb(color);
  const value = (inset ? "inset " : "") + x + "px " + y + "px " + blur + "px " + spread + "px rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + opacity.toFixed(2) + ")";
  return { value, css: "box-shadow: " + value + ";", metrics: { x, y, blur, spread, opacity, inset } };
}

export function contrastAudit(foregroundValue, backgroundValue) {
  const foreground = normalizeHex(foregroundValue);
  const background = normalizeHex(backgroundValue);
  const ratio = contrastRatio(foreground, background);
  return {
    foreground,
    background,
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5
  };
}

export function typographyScale(options = {}) {
  const base = clamp(Number(options.base ?? 16), 10, 32);
  const ratio = clamp(Number(options.ratio ?? 1.25), 1.05, 1.8);
  const steps = clamp(Math.round(Number(options.steps ?? 7)), 4, 10);
  return Array.from({ length: steps }, (_, index) => {
    const px = Number((base * (ratio ** index)).toFixed(2));
    return { index, token: "--font-" + index, px, rem: Number((px / 16).toFixed(4)) };
  });
}

export function spacingScale(baseValue = 4) {
  const base = clamp(Number(baseValue || 4), 2, 12);
  return [1, 2, 3, 4, 6, 8, 12, 16].map((multiplier, index) => ({
    token: "--space-" + (index + 1),
    px: Number((base * multiplier).toFixed(2)),
    multiplier
  }));
}

export function radiusScale(baseValue = 8) {
  const base = clamp(Number(baseValue || 8), 2, 32);
  const values = [0, base / 2, base, base * 1.5, base * 2, base * 3];
  return [
    ...values.map((px, index) => ({ token: "--radius-" + index, px: Number(px.toFixed(2)) })),
    { token: "--radius-pill", px: 999 }
  ];
}
