import {
  buttonCss,
  contrastRatio,
  generateHarmony,
  generateSiteTheme,
  normalizeHex,
  readableText,
  themeToCss
} from "./design-tools.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shell({ tool, integration, body }) {
  return [
    '<button class="back-button" id="backToCatalog">← Araçlara dön</button>',
    '<div class="tool-panel design-tool-panel">',
    '  <div class="tool-title-row">',
    '    <div>',
    '      <span class="eyebrow">TASARIM</span>',
    `      <h2>${escapeHtml(tool.title)}</h2>`,
    `      <p>${escapeHtml(tool.description)}</p>`,
    '    </div>',
    '    <span class="privacy-badge compact">● Tarayıcıda</span>',
    '  </div>',
    '  <div class="integration-strip">',
    `    <span><strong>Motor:</strong> ${escapeHtml(integration.name)} ${escapeHtml(integration.version)}</span>`,
    `    <span><strong>Lisans:</strong> ${escapeHtml(integration.license)}</span>`,
    '    <span><strong>Veri cihazdan çıkar mı?</strong> Hayır</span>',
    '  </div>',
    body,
    '  <div class="design-source-note">',
    '    <strong>Araştırma temeli</strong>',
    '    <span>Radix Colors: durum bazlı renk ölçeği · Open Props: tasarım tokenları · Uiverse: buton varyasyonları · WCAG 2.2: hedef boyutu/kontrast.</span>',
    '  </div>',
    '</div>'
  ].join("\n");
}

function paletteBody() {
  return [
    '<div class="design-controls design-controls-2">',
    '  <label>Başlangıç rengi<input id="designSeed" class="text-control design-color-input" type="color" value="#4967ff" /></label>',
    '  <label>Armoni',
    '    <select id="harmonyMode" class="text-control">',
    '      <option value="analogous">Analog</option>',
    '      <option value="complementary">Tamamlayıcı</option>',
    '      <option value="triadic">Üçlü</option>',
    '      <option value="split">Ayrık tamamlayıcı</option>',
    '      <option value="tetradic">Dörtlü</option>',
    '      <option value="monochrome">Monokrom</option>',
    '    </select>',
    '  </label>',
    '</div>',
    '<div class="action-row"><button class="primary-button" id="designRun" type="button">Paleti üret</button><button class="secondary-button" id="designRandom" type="button">Rastgele</button></div>',
    '<div id="paletteOutput" class="palette-output" aria-live="polite"></div>',
    '<div class="design-export-row"><button class="secondary-button" id="paletteCopyCss" type="button">CSS değişkenlerini kopyala</button><button class="secondary-button" id="paletteCopyJson" type="button">JSON kopyala</button></div>',
    '<div id="designStatus" class="design-status">Başlangıç rengi seç ve paleti üret.</div>'
  ].join("\n");
}

function siteThemeBody() {
  return [
    '<div class="design-controls design-controls-2">',
    '  <label>Marka / vurgu rengi<input id="designSeed" class="text-control design-color-input" type="color" value="#4967ff" /></label>',
    '  <label>Önizleme',
    '    <select id="themeScheme" class="text-control"><option value="light">Açık tema</option><option value="dark">Koyu tema</option></select>',
    '  </label>',
    '</div>',
    '<div id="themePreview" class="site-theme-preview"></div>',
    '<div id="themeChecks" class="theme-checks"></div>',
    '<div class="design-export-row"><button class="primary-button" id="themeCopyCss" type="button">CSS tokenlarını kopyala</button><button class="secondary-button" id="themeCopyJson" type="button">JSON kopyala</button></div>',
    '<div id="designStatus" class="design-status">Rengi veya tema türünü değiştir; önizleme anında güncellenir.</div>'
  ].join("\n");
}

function buttonBody(mode) {
  const isMobile = mode === "mobile";
  return [
    '<div class="design-controls design-controls-2">',
    `  <label>Buton yazısı<input id="buttonLabel" class="text-control" type="text" value="${isMobile ? "Devam et" : "İşlemi başlat"}" maxlength="42" /></label>`,
    '  <label>Renk<input id="buttonColor" class="text-control design-color-input" type="color" value="#4967ff" /></label>',
    '  <label>Stil<select id="buttonVariant" class="text-control"><option value="solid">Dolu</option><option value="outline">Çerçeveli</option><option value="soft">Yumuşak</option><option value="ghost">Ghost</option></select></label>',
    `  <label>Köşe <output id="radiusValue">${isMobile ? 14 : 10}px</output><input id="buttonRadius" type="range" min="0" max="32" value="${isMobile ? 14 : 10}" /></label>`,
    `  <label>Yükseklik <output id="heightValue">${isMobile ? 48 : 44}px</output><input id="buttonHeight" type="range" min="32" max="64" value="${isMobile ? 48 : 44}" /></label>`,
    '  <label>Yatay boşluk <output id="paddingValue">20px</output><input id="buttonPadding" type="range" min="10" max="36" value="20" /></label>',
    `  <label class="design-check"><input id="buttonFull" type="checkbox" ${isMobile ? "checked" : ""}/> Tam genişlik</label>`,
    '</div>',
    `<div class="button-preview-shell ${isMobile ? "mobile" : "web"}"><div class="button-preview-stage"><button id="buttonPreview" type="button">${isMobile ? "Devam et" : "İşlemi başlat"}</button></div></div>`,
    '<div id="touchAudit" class="touch-audit"></div>',
    '<div class="design-code-grid"><div><div class="result-head"><span>HTML</span><button class="text-button" id="copyButtonHtml" type="button">Kopyala</button></div><pre id="buttonHtml"></pre></div><div><div class="result-head"><span>CSS</span><button class="text-button" id="copyButtonCss" type="button">Kopyala</button></div><pre id="buttonCss"></pre></div></div>',
    '<div id="designStatus" class="design-status">Değerleri değiştir; kod ve önizleme birlikte güncellenir.</div>'
  ].join("\n");
}

function copyText(value, status, message) {
  navigator.clipboard.writeText(value).then(
    () => { status.textContent = message; },
    () => { status.textContent = "Kopyalama izni verilemedi."; }
  );
}

function wirePalette(toolView) {
  const seed = toolView.querySelector("#designSeed");
  const mode = toolView.querySelector("#harmonyMode");
  const output = toolView.querySelector("#paletteOutput");
  const status = toolView.querySelector("#designStatus");
  let colors = [];

  const render = () => {
    try {
      colors = generateHarmony(seed.value, mode.value);
      output.innerHTML = colors.map((color, index) => {
        const text = readableText(color);
        return `<button class="palette-swatch" data-color="${color}" style="--swatch:${color};--swatch-text:${text}" type="button"><span>${String(index + 1).padStart(2, "0")}</span><strong>${color}</strong><small>Kopyala</small></button>`;
      }).join("");
      status.textContent = `${colors.length} renk üretildi. Bir karta dokunarak HEX değerini kopyalayabilirsin.`;
    } catch (error) {
      status.textContent = `Hata: ${error instanceof Error ? error.message : "Palet üretilemedi."}`;
    }
  };

  toolView.querySelector("#designRun").addEventListener("click", render);
  toolView.querySelector("#designRandom").addEventListener("click", () => {
    seed.value = `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0")}`;
    render();
  });
  seed.addEventListener("input", render);
  mode.addEventListener("change", render);
  output.addEventListener("click", (event) => {
    const card = event.target.closest("[data-color]");
    if (card) copyText(card.dataset.color, status, `${card.dataset.color} kopyalandı.`);
  });
  toolView.querySelector("#paletteCopyCss").addEventListener("click", () => {
    const css = [":root {", ...colors.map((color, index) => `  --palette-${index + 1}: ${color};`), "}"].join("\n");
    copyText(css, status, "CSS değişkenleri kopyalandı.");
  });
  toolView.querySelector("#paletteCopyJson").addEventListener("click", () => copyText(JSON.stringify(colors, null, 2), status, "JSON kopyalandı."));
  render();
}

function wireSiteTheme(toolView) {
  const seed = toolView.querySelector("#designSeed");
  const scheme = toolView.querySelector("#themeScheme");
  const preview = toolView.querySelector("#themePreview");
  const checks = toolView.querySelector("#themeChecks");
  const status = toolView.querySelector("#designStatus");
  let theme;

  const render = () => {
    theme = generateSiteTheme(seed.value, scheme.value);
    const t = theme.tokens;
    preview.style.setProperty("--p-bg", t.bg);
    preview.style.setProperty("--p-surface", t.surface);
    preview.style.setProperty("--p-surface-alt", t.surfaceAlt);
    preview.style.setProperty("--p-text", t.text);
    preview.style.setProperty("--p-muted", t.muted);
    preview.style.setProperty("--p-border", t.border);
    preview.style.setProperty("--p-primary", t.primary);
    preview.style.setProperty("--p-primary-hover", t.primaryHover);
    preview.style.setProperty("--p-on-primary", t.onPrimary);
    preview.style.setProperty("--p-focus", t.focus);
    preview.innerHTML = [
      '<div class="theme-demo-nav"><strong>marka.</strong><span>Ürünler&nbsp;&nbsp;Hakkımızda</span></div>',
      '<div class="theme-demo-card"><span>YENİ</span><h3>Uyumlu bir arayüz.</h3><p>Arka plan, yüzey, metin, border ve aksiyon renkleri tek sistemden türetilir.</p><div><button>Başla</button><a>Detaylar</a></div></div>',
      '<div class="theme-demo-mini"><b>Yüzey 2</b><span>İkincil içerik ve sakin alanlar.</span></div>'
    ].join("");
    checks.innerHTML = [
      `<span class="${theme.checks.body >= 4.5 ? "pass" : "warn"}">Metin ${theme.checks.body.toFixed(2)}:1</span>`,
      `<span class="${theme.checks.primary >= 4.5 ? "pass" : "warn"}">Buton ${theme.checks.primary.toFixed(2)}:1</span>`,
      `<span class="${theme.checks.muted >= 3 ? "pass" : "warn"}">İkincil ${theme.checks.muted.toFixed(2)}:1</span>`
    ].join("");
  };

  seed.addEventListener("input", render);
  scheme.addEventListener("change", render);
  toolView.querySelector("#themeCopyCss").addEventListener("click", () => copyText(themeToCss(theme), status, "CSS tasarım tokenları kopyalandı."));
  toolView.querySelector("#themeCopyJson").addEventListener("click", () => copyText(JSON.stringify(theme, null, 2), status, "Tema JSON'u kopyalandı."));
  render();
}

function wireButton(toolView, mode) {
  const label = toolView.querySelector("#buttonLabel");
  const color = toolView.querySelector("#buttonColor");
  const variant = toolView.querySelector("#buttonVariant");
  const radius = toolView.querySelector("#buttonRadius");
  const height = toolView.querySelector("#buttonHeight");
  const padding = toolView.querySelector("#buttonPadding");
  const full = toolView.querySelector("#buttonFull");
  const preview = toolView.querySelector("#buttonPreview");
  const html = toolView.querySelector("#buttonHtml");
  const css = toolView.querySelector("#buttonCss");
  const audit = toolView.querySelector("#touchAudit");
  const status = toolView.querySelector("#designStatus");
  let generated;

  const render = () => {
    generated = buttonCss({
      mode,
      color: color.value,
      variant: variant.value,
      radius: radius.value,
      minHeight: height.value,
      horizontal: padding.value,
      fullWidth: full.checked
    });
    const p = generated.preview;
    preview.textContent = label.value.trim() || "Buton";
    preview.style.minHeight = `${p.minHeight}px`;
    preview.style.padding = `0 ${p.horizontal}px`;
    preview.style.borderRadius = `${p.radius}px`;
    preview.style.background = p.background;
    preview.style.color = p.text;
    preview.style.border = `${variant.value === "ghost" ? 1 : 2}px solid ${p.border}`;
    preview.style.width = p.fullWidth ? "100%" : "auto";
    preview.style.setProperty("--preview-hover", p.hoverBackground);
    preview.style.setProperty("--preview-hover-text", p.hoverText);
    html.textContent = `<button class="${generated.selector.slice(1)}">${escapeHtml(label.value.trim() || "Buton")}</button>`;
    css.textContent = generated.css;
    toolView.querySelector("#radiusValue").textContent = `${p.radius}px`;
    toolView.querySelector("#heightValue").textContent = `${p.minHeight}px`;
    toolView.querySelector("#paddingValue").textContent = `${p.horizontal}px`;

    if (mode === "mobile") {
      audit.innerHTML = [
        `<span class="${generated.metrics.recommendedTouch ? "pass" : "warn"}">${generated.metrics.recommendedTouch ? "✓" : "!"} 48 px önerilen dokunma hedefi</span>`,
        `<span class="${generated.metrics.wcagMinimum ? "pass" : "warn"}">${generated.metrics.wcagMinimum ? "✓" : "!"} WCAG 24 px minimum</span>`
      ].join("");
    } else {
      const ratio = p.background === "transparent" ? contrastRatio(color.value, "#FFFFFF") : contrastRatio(p.text, p.background);
      audit.innerHTML = `<span class="${ratio >= 4.5 ? "pass" : "warn"}">${ratio >= 4.5 ? "✓" : "!"} Örnek kontrast ${ratio.toFixed(2)}:1</span>`;
    }
  };

  [label, color, variant, radius, height, padding, full].forEach((control) => {
    control.addEventListener(control.type === "range" || control.type === "color" || control.type === "text" ? "input" : "change", render);
    if (control.type === "checkbox" || control.tagName === "SELECT") control.addEventListener("change", render);
  });
  toolView.querySelector("#copyButtonHtml").addEventListener("click", () => copyText(html.textContent, status, "HTML kopyalandı."));
  toolView.querySelector("#copyButtonCss").addEventListener("click", () => copyText(css.textContent, status, "CSS kopyalandı."));
  render();
}

export function renderDesignTool({ tool, toolView, integration, onBack }) {
  let body = paletteBody();
  if (tool.designMode === "site-theme") body = siteThemeBody();
  if (tool.designMode === "web-button") body = buttonBody("web");
  if (tool.designMode === "mobile-button") body = buttonBody("mobile");

  toolView.innerHTML = shell({ tool, integration, body });
  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);

  if (tool.designMode === "palette") wirePalette(toolView);
  else if (tool.designMode === "site-theme") wireSiteTheme(toolView);
  else if (tool.designMode === "web-button") wireButton(toolView, "web");
  else wireButton(toolView, "mobile");
}
