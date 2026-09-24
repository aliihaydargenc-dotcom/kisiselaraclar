import { categories, searchTools, tools } from "./catalog.js";
import { getIntegration } from "./integrations.js";
import {
  applyStagedFiles,
  classifyFileSelection,
  enhanceFileDrops,
  loadRecentToolIds,
  parseToolHash,
  quickToolIds,
  rememberRecentTool,
  stageFilesForTool,
  toolHash
} from "./product-ux.js";
import { runEngine } from "./tool-engines.js";

const searchInput = document.querySelector("#toolSearch");
const categoryList = document.querySelector("#categoryList");
const catalogView = document.querySelector("#catalogView");
const toolView = document.querySelector("#toolView");
const toolCountSummary = document.querySelector("#toolCountSummary");
const headerSearchButton = document.querySelector("#headerSearchButton");
const toolBrowser = document.querySelector("#toolBrowser");
const mobileDock = document.querySelector("#mobileDock");
const validToolIds = tools.map((tool) => tool.id);

let activeCategory = "all";
let currentToolId = "";
let smartFiles = [];

function safeStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function categoryLabel(id) {
  return categories.find((category) => category.id === id)?.label || id;
}

function setDocumentTitle(tool = null) {
  document.title = tool ? `${tool.title} | Kişisel Araçlar` : "Kişisel Araçlar — Local-first araç kutusu";
}

function renderCategories() {
  const items = [{ id: "all", label: "Tüm araçlar" }, ...categories];
  categoryList.innerHTML = items
    .map(
      (item) => `
        <button
          class="category-button ${item.id === activeCategory ? "active" : ""}"
          data-category="${item.id}"
          aria-pressed="${item.id === activeCategory ? "true" : "false"}"
        >
          <span>${item.label}</span>
          <span class="count">${item.id === "all" ? tools.length : tools.filter((tool) => tool.category === item.id).length}</span>
        </button>
      `
    )
    .join("");
}

function formatSmartBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function smartRouterMarkup() {
  const selection = classifyFileSelection(smartFiles, validToolIds);
  const recommended = selection.toolIds
    .map((id) => tools.find((tool) => tool.id === id))
    .filter(Boolean);
  const totalBytes = smartFiles.reduce((sum, file) => sum + Number(file.size || 0), 0);
  const fileNames = smartFiles.slice(0, 2).map((file) => escapeHtml(file.name || "dosya")).join(" • ");
  const extra = smartFiles.length > 2 ? ` • +${smartFiles.length - 2}` : "";

  return `
    <section class="smart-router" aria-labelledby="smartRouterTitle">
      <div class="smart-router-copy">
        <span class="eyebrow">DOSYAYLA BAŞLA</span>
        <h2 id="smartRouterTitle">Dosyanı bırak. Uygun araçları bulalım.</h2>
        <p>Türünü cihazında algılar, kullanabileceğin araçları hemen öne çıkarırız.</p>
      </div>
      <label class="smart-drop-zone ${smartFiles.length ? "has-selection" : ""}" id="smartDropZone">
        <input class="smart-file-input" id="smartFileInput" type="file" multiple />
        <span class="smart-drop-mark" aria-hidden="true">+</span>
        <strong>${smartFiles.length ? escapeHtml(selection.label) : "Dosya seç veya sürükleyip bırak"}</strong>
        <span>${smartFiles.length ? `${fileNames}${extra} • ${formatSmartBytes(totalBytes)}` : "PDF, görsel, medya, CSV, ZIP ve daha fazlası"}</span>
      </label>
      ${smartFiles.length ? `
        <div class="smart-detected">
          <div>
            <span class="smart-family">${escapeHtml(selection.label)}</span>
            <strong>${escapeHtml(selection.summary)}</strong>
          </div>
          <button class="text-button smart-clear" id="smartClear" type="button">Temizle</button>
        </div>
        <div class="smart-tool-grid">
          ${recommended.map((tool, index) => `
            <button class="smart-tool-card ${index === 0 ? "recommended" : ""}" data-smart-tool="${tool.id}" type="button">
              <span>${index === 0 ? "Önerilen" : categoryLabel(tool.category)}</span>
              <strong>${escapeHtml(tool.title)}</strong>
              <small>${escapeHtml(tool.description)}</small>
            </button>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function wireSmartRouter() {
  const zone = catalogView.querySelector("#smartDropZone");
  const input = catalogView.querySelector("#smartFileInput");
  if (!zone || !input) return;

  input.addEventListener("change", () => {
    smartFiles = [...(input.files || [])];
    renderCatalog();
  });

  const stop = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  zone.addEventListener("dragenter", (event) => {
    stop(event);
    zone.classList.add("is-dragging");
  });
  zone.addEventListener("dragover", (event) => {
    stop(event);
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    zone.classList.add("is-dragging");
  });
  zone.addEventListener("dragleave", (event) => {
    stop(event);
    if (!zone.contains(event.relatedTarget)) zone.classList.remove("is-dragging");
  });
  zone.addEventListener("drop", (event) => {
    stop(event);
    zone.classList.remove("is-dragging");
    const files = [...(event.dataTransfer?.files || [])];
    if (!files.length) return;
    smartFiles = files;
    renderCatalog();
  });

  catalogView.querySelector("#smartClear")?.addEventListener("click", (event) => {
    event.preventDefault();
    smartFiles = [];
    renderCatalog();
  });
}

function toolCard(tool, compact = false) {
  return `
    <button class="${compact ? "quick-tool" : "tool-card"}" data-tool="${tool.id}" aria-label="${escapeHtml(tool.title)} aracını aç">
      ${compact ? "" : `
        <div class="tool-card-top">
          <span class="tool-category">${categoryLabel(tool.category)}</span>
          <span class="tool-card-arrow" aria-hidden="true">↗</span>
        </div>
      `}
      <strong>${escapeHtml(tool.title)}</strong>
      ${compact ? `<span>${categoryLabel(tool.category)}</span>` : `
        <span>${escapeHtml(tool.description)}</span>
      `}
    </button>
  `;
}

function renderCatalog() {
  currentToolId = "";
  document.body.classList.remove("tool-open");
  setDocumentTitle();
  const query = searchInput.value;
  const list = searchTools(query, activeCategory);
  const recentIds = loadRecentToolIds(safeStorage(), validToolIds);
  const quickIds = activeCategory === "all" && !query.trim()
    ? quickToolIds(recentIds, validToolIds)
    : [];
  const quickTools = quickIds
    .map((id) => tools.find((tool) => tool.id === id))
    .filter(Boolean);

  catalogView.innerHTML = `
    ${activeCategory === "all" && !query.trim() ? smartRouterMarkup() : ""}
    ${quickTools.length ? `
      <section class="quick-section" aria-labelledby="quickTitle">
        <div class="quick-head">
          <div>
            <span class="eyebrow">HIZLI ERİŞİM</span>
            <h2 id="quickTitle">Hızlı erişim</h2>
          </div>
          <span>Son kullandıkların önce gelir.</span>
        </div>
        <div class="quick-grid">
          ${quickTools.map((tool) => toolCard(tool, true)).join("")}
        </div>
      </section>
    ` : ""}
    <div class="catalog-head">
      <div>
        <span class="eyebrow">${activeCategory === "all" ? "ARAÇ KATALOĞU" : categoryLabel(activeCategory).toLocaleUpperCase("tr-TR")}</span>
        <h2>Araçlar <span class="catalog-count">${list.length}</span></h2>
      </div>
      <span class="catalog-note">Türkçe • cihazında işler</span>
    </div>
    <div class="tool-grid">
      ${list.map((tool) => toolCard(tool)).join("")}
    </div>
    ${list.length ? "" : '<div class="empty-state">Bu aramayla eşleşen araç bulunamadı.</div>'}
  `;
  toolView.classList.add("hidden");
  catalogView.classList.remove("hidden");
  wireSmartRouter();
  if (toolCountSummary) toolCountSummary.textContent = `${tools.length} araç`;
}

function csvTable(result) {
  const columns = result.columns;
  const rows = result.previewRows;
  if (!columns.length) return '<div class="empty-state">Başlık satırı bulunamadı.</div>';

  return `
    <div class="csv-meta">
      <span>${result.rows.length.toLocaleString("tr-TR")} kayıt</span>
      <span>Ayırıcı: <code>${escapeHtml(result.delimiter === "\t" ? "TAB" : result.delimiter)}</code></span>
      ${result.truncated ? "<span>Önizleme ilk 200 kayıtla sınırlandı</span>" : ""}
    </div>
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function loadingPanel(label) {
  return `
    <div class="tool-panel loading-panel" role="status">
      <span class="loading-spinner" aria-hidden="true"></span>
      <strong>${escapeHtml(label)}</strong>
    </div>
  `;
}

function finalizeToolOpen() {
  enhanceFileDrops(toolView);
  const handoff = applyStagedFiles(toolView, currentToolId);
  if (handoff.attempted && !handoff.applied) {
    const panel = toolView.querySelector(".tool-panel");
    if (panel) {
      const note = document.createElement("div");
      note.className = "smart-handoff-note";
      note.textContent = handoff.reason === "unsupported"
        ? "Dosyan hazır; bu tarayıcı otomatik aktarmaya izin vermedi. Dosyayı aşağıdaki seçim alanından yeniden seç."
        : "Bu araçta otomatik dosya aktarımı kullanılamadı.";
      panel.prepend(note);
    }
  }
  toolView.querySelector("#backToCatalog")?.focus({ preventScroll: true });
}

function navigateCatalog({ replace = false } = {}) {
  const method = replace ? "replaceState" : "pushState";
  history[method]({ tool: null }, "", `${location.pathname}${location.search}`);
  renderCatalog();
}

async function openTool(id, { record = true } = {}) {
  const tool = tools.find((item) => item.id === id);
  if (!tool) {
    navigateCatalog({ replace: true });
    return;
  }

  currentToolId = id;
  document.body.classList.add("tool-open");
  setDocumentTitle(tool);
  if (record) rememberRecentTool(safeStorage(), id, validToolIds);
  const integration = getIntegration(tool.integration);
  const onBack = () => navigateCatalog();

  async function renderLazy(label, importer, rendererName, fallback) {
    catalogView.classList.add("hidden");
    toolView.classList.remove("hidden");
    toolView.innerHTML = loadingPanel(label);
    try {
      const module = await importer();
      module[rendererName]({ tool, toolView, integration, onBack });
      finalizeToolOpen();
    } catch (error) {
      toolView.innerHTML = `
        <button class="back-button" id="backToCatalog">← Araçlara dön</button>
        <div class="tool-panel error-panel">
          <strong>Bu araç açılamadı.</strong>
          <p>${escapeHtml(error instanceof Error ? error.message : fallback)}</p>
        </div>
      `;
      toolView.querySelector("#backToCatalog").addEventListener("click", onBack);
    }
  }

  if (tool.inputType === "media") {
    await renderLazy("Medya aracı yükleniyor", () => import("./media-ui.js"), "renderMediaTool", "Medya aracı yüklenemedi.");
    return;
  }
  if (tool.inputType === "ocr") {
    await renderLazy("OCR aracı yükleniyor", () => import("./ocr-ui.js"), "renderOcrTool", "OCR aracı yüklenemedi.");
    return;
  }
  if (tool.inputType === "code") {
    await renderLazy("QR / barkod aracı yükleniyor", () => import("./code-ui.js"), "renderCodeTool", "QR / barkod aracı yüklenemedi.");
    return;
  }
  if (tool.inputType === "archive") {
    await renderLazy("Arşiv aracı yükleniyor", () => import("./archive-ui.js"), "renderArchiveTool", "Arşiv aracı yüklenemedi.");
    return;
  }
  if (tool.inputType === "image") {
    await renderLazy("Görsel aracı yükleniyor", () => import("./image-ui.js"), "renderImageTool", "Görsel aracı yüklenemedi.");
    return;
  }
  if (tool.inputType === "pdf") {
    await renderLazy("PDF aracı yükleniyor", () => import("./pdf-ui.js"), "renderPdfTool", "PDF aracı yüklenemedi.");
    return;
  }

  const fileControl =
    tool.inputType === "csv-file"
      ? `
        <label class="file-drop" for="csvFile">
          <strong>CSV dosyası seç veya buraya bırak</strong>
          <span>Dosya yalnızca bu tarayıcıda okunur.</span>
          <input id="csvFile" type="file" accept=".csv,text/csv,text/plain" />
        </label>
      `
      : "";

  catalogView.classList.add("hidden");
  toolView.classList.remove("hidden");
  toolView.innerHTML = `
    <button class="back-button" id="backToCatalog">← Araçlara dön</button>
    <div class="tool-panel">
      <div class="tool-title-row">
        <div>
          <span class="eyebrow">${categoryLabel(tool.category).toLocaleUpperCase("tr-TR")}</span>
          <h2>${escapeHtml(tool.title)}</h2>
          <p>${escapeHtml(tool.description)}</p>
        </div>
        <span class="privacy-badge compact">● Tarayıcıda</span>
      </div>

      <div class="integration-strip">
        <span><strong>Motor:</strong> ${escapeHtml(integration.name)} ${escapeHtml(integration.version)}</span>
        <span><strong>Lisans:</strong> ${escapeHtml(integration.license)}</span>
        <span><strong>Veri cihazdan çıkar mı?</strong> ${integration.dataLeavesDevice ? "Evet" : "Hayır"}</span>
      </div>

      ${fileControl}
      <label for="toolInput">${tool.inputLabel}</label>
      <textarea id="toolInput" spellcheck="false" placeholder="Buraya yapıştır veya yaz..."></textarea>
      <div class="action-row">
        ${tool.actions.map((action) => `<button class="primary-button" data-action="${action.id}">${action.label}</button>`).join("")}
        <button class="secondary-button" id="clearTool">Temizle</button>
      </div>
      <div class="result-wrap">
        <div class="result-head">
          <span>Sonuç</span>
          <button id="copyResult" class="text-button">Kopyala</button>
        </div>
        <div id="structuredResult" class="hidden"></div>
        <pre id="toolResult">Henüz sonuç yok.</pre>
      </div>
    </div>
  `;

  const input = toolView.querySelector("#toolInput");
  const result = toolView.querySelector("#toolResult");
  const structuredResult = toolView.querySelector("#structuredResult");
  const csvFile = toolView.querySelector("#csvFile");

  csvFile?.addEventListener("change", async () => {
    const file = csvFile.files?.[0];
    if (!file) return;
    const maxBytes = 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      result.textContent = "Hata: CSV dosyası en fazla 20 MB olabilir.";
      return;
    }
    input.value = await file.text();
    result.textContent = `${file.name} hazır. Önizle veya JSON'a dönüştür.`;
  });

  toolView.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      result.classList.remove("hidden");
      structuredResult.classList.add("hidden");
      result.textContent = "İşleniyor...";
      try {
        const output = await runEngine(button.dataset.action, input.value);
        if (button.dataset.action === "previewCsv") {
          result.classList.add("hidden");
          structuredResult.classList.remove("hidden");
          structuredResult.innerHTML = csvTable(output);
        } else {
          result.textContent = String(output);
        }
      } catch (error) {
        result.textContent = `Hata: ${error instanceof Error ? error.message : "İşlem tamamlanamadı."}`;
      }
    });
  });

  toolView.querySelector("#clearTool").addEventListener("click", () => {
    input.value = "";
    if (csvFile) csvFile.value = "";
    structuredResult.innerHTML = "";
    structuredResult.classList.add("hidden");
    result.classList.remove("hidden");
    result.textContent = "Henüz sonuç yok.";
    input.focus();
  });

  toolView.querySelector("#copyResult").addEventListener("click", async () => {
    const value = result.textContent;
    if (!value || result.classList.contains("hidden") || value === "Henüz sonuç yok.") return;
    await navigator.clipboard.writeText(value);
  });

  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);
  finalizeToolOpen();
}

function navigateTool(id, { replace = false, record = true } = {}) {
  if (!validToolIds.includes(id)) return navigateCatalog({ replace: true });
  const method = replace ? "replaceState" : "pushState";
  history[method]({ tool: id }, "", toolHash(id));
  openTool(id, { record });
}

function syncRoute() {
  const id = parseToolHash(location.hash);
  if (id && validToolIds.includes(id)) {
    openTool(id, { record: false });
  } else {
    renderCatalog();
  }
}

categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  if (currentToolId) navigateCatalog({ replace: true });
  activeCategory = button.dataset.category;
  renderCategories();
  renderCatalog();
});

catalogView.addEventListener("click", (event) => {
  const smartCard = event.target.closest("[data-smart-tool]");
  if (smartCard) {
    const id = smartCard.dataset.smartTool;
    stageFilesForTool(smartFiles, id);
    smartFiles = [];
    navigateTool(id);
    return;
  }

  const card = event.target.closest("[data-tool]");
  if (card) navigateTool(card.dataset.tool);
});

searchInput.addEventListener("input", () => {
  if (currentToolId) navigateCatalog({ replace: true });
  renderCatalog();
});

document.addEventListener("keydown", (event) => {
  const tag = event.target?.tagName?.toLowerCase();
  const isTyping = ["input", "textarea", "select"].includes(tag) || event.target?.isContentEditable;

  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
  }

  if (event.key === "Escape" && currentToolId && !isTyping) {
    navigateCatalog();
  }
});

window.addEventListener("popstate", syncRoute);

renderCategories();
history.replaceState({ tool: parseToolHash(location.hash) || null }, "", location.href);
syncRoute();


headerSearchButton?.addEventListener("click", () => {
  if (currentToolId) navigateCatalog({ replace: true });
  requestAnimationFrame(() => {
    toolBrowser?.scrollIntoView({ behavior: "smooth", block: "start" });
    searchInput.focus({ preventScroll: true });
  });
});


function prepareCatalogForMobileAction() {
  if (currentToolId) {
    history.replaceState({ tool: null }, "", `${location.pathname}${location.search}`);
  }
  activeCategory = "all";
  searchInput.value = "";
  renderCategories();
  renderCatalog();
}

mobileDock?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mobile-action]");
  if (!button) return;

  if (button.dataset.mobileAction === "file") {
    prepareCatalogForMobileAction();
    requestAnimationFrame(() => {
      document.querySelector("#smartDropZone")?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.querySelector("#smartFileInput")?.click();
    });
    return;
  }

  if (button.dataset.mobileAction === "search") {
    if (currentToolId) prepareCatalogForMobileAction();
    requestAnimationFrame(() => {
      toolBrowser?.scrollIntoView({ behavior: "smooth", block: "start" });
      searchInput.focus({ preventScroll: true });
    });
  }
});
