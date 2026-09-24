import {
  buttonCss,
  contrastAudit,
  contrastRatio,
  generateHarmony,
  generateSiteTheme,
  gradientCss,
  radiusScale,
  readableText,
  shadowCss,
  spacingScale,
  themeToCss,
  typographyScale
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

function gradientBody() {
  return [
    '<div class="design-controls design-controls-2">',
    '<label>Başlangıç<input id="gradientStart" class="text-control design-color-input" type="color" value="#4967ff" /></label>',
    '<label>Bitiş<input id="gradientEnd" class="text-control design-color-input" type="color" value="#ff6b6b" /></label>',
    '<label>Tür<select id="gradientType" class="text-control"><option value="linear">Linear</option><option value="radial">Radial</option></select></label>',
    '<label>Açı <output id="gradientAngleValue">135°</output><input id="gradientAngle" type="range" min="0" max="360" value="135" /></label>',
    '</div>',
    '<div id="p14DesignPreview" class="p14-design-preview"><span>Gradient</span></div>',
    '<div class="p14-code-row"><code id="p14DesignCode"></code><button class="secondary-button" id="p14Copy" type="button">CSS kopyala</button></div>',
    '<div id="designStatus" class="design-status">Renkleri değiştir; CSS anında güncellensin.</div>'
  ].join("\n");
}

function shadowBody() {
  return [
    '<div class="design-controls design-controls-2">',
    '<label>Gölge rengi<input id="shadowColor" class="text-control design-color-input" type="color" value="#0a0b10" /></label>',
    '<label>Saydamlık <output id="shadowOpacityValue">22%</output><input id="shadowOpacity" type="range" min="0" max="80" value="22" /></label>',
    '<label>X <output id="shadowXValue">0px</output><input id="shadowX" type="range" min="-40" max="40" value="0" /></label>',
    '<label>Y <output id="shadowYValue">18px</output><input id="shadowY" type="range" min="-40" max="60" value="18" /></label>',
    '<label>Blur <output id="shadowBlurValue">40px</output><input id="shadowBlur" type="range" min="0" max="100" value="40" /></label>',
    '<label>Spread <output id="shadowSpreadValue">-12px</output><input id="shadowSpread" type="range" min="-30" max="30" value="-12" /></label>',
    '<label class="design-check"><input id="shadowInset" type="checkbox" /> İç gölge</label>',
    '</div>',
    '<div class="p14-shadow-stage"><div id="p14ShadowCard">Gölge önizlemesi</div></div>',
    '<div class="p14-code-row"><code id="p14DesignCode"></code><button class="secondary-button" id="p14Copy" type="button">CSS kopyala</button></div>',
    '<div id="designStatus" class="design-status">Gölge değerlerini görsel olarak ayarla.</div>'
  ].join("\n");
}

function contrastBody() {
  return [
    '<div class="design-controls design-controls-2">',
    '<label>Metin rengi<input id="contrastFg" class="text-control design-color-input" type="color" value="#111318" /></label>',
    '<label>Arka plan<input id="contrastBg" class="text-control design-color-input" type="color" value="#ffffff" /></label>',
    '</div>',
    '<div id="p14ContrastPreview" class="p14-contrast-preview"><strong>Okunabilir mi?</strong><span>Normal ve büyük metin için kontrol.</span></div>',
    '<div id="p14ContrastBadges" class="theme-checks"></div>',
    '<div id="designStatus" class="design-status">WCAG kontrast oranı otomatik hesaplanır.</div>'
  ].join("\n");
}

function scaleBody(kind) {
  const typography = kind === "typography";
  const spacing = kind === "spacing";
  return [
    '<div class="design-controls design-controls-2">',
    typography
      ? '<label>Temel boyut (px)<input id="scaleBase" class="text-control" type="number" min="10" max="32" value="16" /></label>'
      : '<label>Temel birim (px)<input id="scaleBase" class="text-control" type="number" min="2" max="32" value="' + (spacing ? "4" : "8") + '" /></label>',
    typography
      ? '<label>Oran<select id="typeRatio" class="text-control"><option value="1.125">Major Second · 1.125</option><option value="1.2">Minor Third · 1.20</option><option value="1.25" selected>Major Third · 1.25</option><option value="1.333">Perfect Fourth · 1.333</option><option value="1.5">Perfect Fifth · 1.50</option></select></label>'
      : '',
    '</div>',
    '<div id="p14ScalePreview" class="p14-scale-preview"></div>',
    '<div class="p14-code-row"><code id="p14DesignCode"></code><button class="secondary-button" id="p14Copy" type="button">CSS tokenlarını kopyala</button></div>',
    '<div id="designStatus" class="design-status">Tutarlı ölçek tokenları üret.</div>'
  ].join("\n");
}

function wireGradient(toolView) {
  const start = toolView.querySelector("#gradientStart");
  const end = toolView.querySelector("#gradientEnd");
  const type = toolView.querySelector("#gradientType");
  const angle = toolView.querySelector("#gradientAngle");
  const preview = toolView.querySelector("#p14DesignPreview");
  const code = toolView.querySelector("#p14DesignCode");
  const status = toolView.querySelector("#designStatus");
  let generated;

  const render = () => {
    generated = gradientCss({ start: start.value, end: end.value, type: type.value, angle: angle.value });
    preview.style.background = generated.background;
    code.textContent = generated.css;
    toolView.querySelector("#gradientAngleValue").textContent = generated.angle + "°";
    angle.disabled = generated.type === "radial";
  };

  [start, end, type, angle].forEach((control) => control.addEventListener(control.tagName === "SELECT" ? "change" : "input", render));
  toolView.querySelector("#p14Copy").addEventListener("click", () => copyText(generated.css, status, "Gradient CSS kopyalandı."));
  render();
}

function wireShadow(toolView) {
  const ids = ["shadowColor", "shadowOpacity", "shadowX", "shadowY", "shadowBlur", "shadowSpread", "shadowInset"];
  const controls = Object.fromEntries(ids.map((id) => [id, toolView.querySelector("#" + id)]));
  const card = toolView.querySelector("#p14ShadowCard");
  const code = toolView.querySelector("#p14DesignCode");
  const status = toolView.querySelector("#designStatus");
  let generated;

  const render = () => {
    generated = shadowCss({
      color: controls.shadowColor.value,
      opacity: controls.shadowOpacity.value,
      x: controls.shadowX.value,
      y: controls.shadowY.value,
      blur: controls.shadowBlur.value,
      spread: controls.shadowSpread.value,
      inset: controls.shadowInset.checked
    });
    card.style.boxShadow = generated.value;
    code.textContent = generated.css;
    toolView.querySelector("#shadowOpacityValue").textContent = Math.round(generated.metrics.opacity * 100) + "%";
    ["X", "Y", "Blur", "Spread"].forEach((key) => {
      toolView.querySelector("#shadow" + key + "Value").textContent = generated.metrics[key.toLowerCase()] + "px";
    });
  };

  Object.values(controls).forEach((control) => control.addEventListener(control.type === "checkbox" ? "change" : "input", render));
  toolView.querySelector("#p14Copy").addEventListener("click", () => copyText(generated.css, status, "Shadow CSS kopyalandı."));
  render();
}

function wireContrast(toolView) {
  const fg = toolView.querySelector("#contrastFg");
  const bg = toolView.querySelector("#contrastBg");
  const preview = toolView.querySelector("#p14ContrastPreview");
  const badges = toolView.querySelector("#p14ContrastBadges");
  const status = toolView.querySelector("#designStatus");

  const render = () => {
    const audit = contrastAudit(fg.value, bg.value);
    preview.style.color = audit.foreground;
    preview.style.background = audit.background;
    badges.innerHTML = [
      '<span class="' + (audit.aaNormal ? "pass" : "warn") + '">AA normal ' + (audit.aaNormal ? "✓" : "×") + '</span>',
      '<span class="' + (audit.aaLarge ? "pass" : "warn") + '">AA büyük ' + (audit.aaLarge ? "✓" : "×") + '</span>',
      '<span class="' + (audit.aaaNormal ? "pass" : "warn") + '">AAA normal ' + (audit.aaaNormal ? "✓" : "×") + '</span>',
      '<span class="' + (audit.aaaLarge ? "pass" : "warn") + '">AAA büyük ' + (audit.aaaLarge ? "✓" : "×") + '</span>'
    ].join("");
    status.textContent = "Kontrast: " + audit.ratio.toFixed(2) + ":1";
  };

  [fg, bg].forEach((control) => control.addEventListener("input", render));
  render();
}

function wireScale(toolView, kind) {
  const base = toolView.querySelector("#scaleBase");
  const ratio = toolView.querySelector("#typeRatio");
  const preview = toolView.querySelector("#p14ScalePreview");
  const code = toolView.querySelector("#p14DesignCode");
  const status = toolView.querySelector("#designStatus");
  let css = "";

  const render = () => {
    let scale;
    if (kind === "typography") scale = typographyScale({ base: base.value, ratio: ratio.value });
    else if (kind === "spacing") scale = spacingScale(base.value);
    else scale = radiusScale(base.value);

    css = [":root {", ...scale.map((item) => "  " + item.token + ": " + item.px + "px;"), "}"].join("\n");
    code.textContent = css;

    if (kind === "typography") {
      preview.innerHTML = scale.map((item, index) =>
        '<div class="p14-type-row"><span>' + item.token + '</span><strong style="font-size:' + Math.min(item.px, 58) + 'px">Başlık ' + (index + 1) + '</strong><small>' + item.px + 'px · ' + item.rem + 'rem</small></div>'
      ).join("");
    } else if (kind === "spacing") {
      preview.innerHTML = scale.map((item) =>
        '<div class="p14-token-row"><span>' + item.token + '</span><i style="width:' + Math.min(item.px * 4, 280) + 'px"></i><strong>' + item.px + 'px</strong></div>'
      ).join("");
    } else {
      preview.innerHTML = scale.map((item) =>
        '<div class="p14-radius-item"><i style="border-radius:' + item.px + 'px"></i><span>' + item.token + '</span><strong>' + item.px + 'px</strong></div>'
      ).join("");
    }
  };

  base.addEventListener("input", render);
  if (ratio) ratio.addEventListener("change", render);
  toolView.querySelector("#p14Copy").addEventListener("click", () => copyText(css, status, "CSS tokenları kopyalandı."));
  render();
}

export function renderDesignTool({ tool, toolView, integration, onBack }) {
  const bodies = {
    palette: paletteBody,
    "site-theme": siteThemeBody,
    "web-button": () => buttonBody("web"),
    "mobile-button": () => buttonBody("mobile"),
    gradient: gradientBody,
    shadow: shadowBody,
    contrast: contrastBody,
    typography: () => scaleBody("typography"),
    spacing: () => scaleBody("spacing"),
    radius: () => scaleBody("radius")
  };
  const body = (bodies[tool.designMode] || paletteBody)();

  toolView.innerHTML = shell({ tool, integration, body });
  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);

  if (tool.designMode === "palette") wirePalette(toolView);
  else if (tool.designMode === "site-theme") wireSiteTheme(toolView);
  else if (tool.designMode === "web-button") wireButton(toolView, "web");
  else if (tool.designMode === "mobile-button") wireButton(toolView, "mobile");
  else if (tool.designMode === "gradient") wireGradient(toolView);
  else if (tool.designMode === "shadow") wireShadow(toolView);
  else if (tool.designMode === "contrast") wireContrast(toolView);
  else if (tool.designMode === "typography") wireScale(toolView, "typography");
  else if (tool.designMode === "spacing") wireScale(toolView, "spacing");
  else if (tool.designMode === "radius") wireScale(toolView, "radius");
}
