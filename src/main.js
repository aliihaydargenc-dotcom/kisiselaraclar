import { categories, searchTools, tools } from "./catalog.js";
import { getIntegration } from "./integrations.js";
import {
  applyStagedFiles,
  classifyFileSelection,
  enhanceFileDrops,
  loadRecentToolIds,
  parseToolHash,
  rememberRecentTool,
  stageFilesForTool,
  toolHash
} from "./product-ux.js";
import { runEngine } from "./tool-engines.js";
import { buildP17HomeMarkup, buildP17SearchMarkup, wireP17Workspace } from "./p17-workspace.js";
import { ensurePrivateSession } from "./appwrite-cloud.js";
import { mountDesktopToolNav } from "./desktop-tool-nav.js";
import { mountMobilePlatform } from "./p30-mobile.js";

await ensurePrivateSession();

const searchInput = document.querySelector("#toolSearch");
const categoryList = document.querySelector("#categoryList");
const catalogView = document.querySelector("#catalogView");
const toolView = document.querySelector("#toolView");
const homeView = document.querySelector("#homeView");
const desktopHomeView = document.querySelector("#desktopHomeView");
const desktopHomeQuery = globalThis.matchMedia?.("(min-width: 1180px)");
const toolCountSummary = document.querySelector("#toolCountSummary");
const headerSearchButton = document.querySelector("#headerSearchButton");
const toolBrowser = document.querySelector("#toolBrowser");
const mobileDock = document.querySelector("#mobileDock");
const mobileToolsDrawer = document.querySelector("#mobileToolsDrawer");
const mobileToolsBackdrop = document.querySelector("#mobileToolsBackdrop");
const mobileToolsClose = document.querySelector("#mobileToolsClose");
const heroSearchButton = document.querySelector("#heroSearchButton");
const scrollProgress = document.querySelector("#scrollProgress");
const desktopToolNavRoot = document.querySelector("#desktopToolNav");
const validToolIds = tools.map((tool) => tool.id);
const UI_RENDER_EVENT = "kisiselaraclar:ui-rendered";

function announceUiRendered() {
  try { globalThis.dispatchEvent(new CustomEvent(UI_RENDER_EVENT)); } catch {}
}

let activeCategory = "all";
let currentToolId = "";
let smartFiles = [];
let catalogExpanded = false;
let desktopToolNavApi = null;
let activeToolCleanup = null;
let activeHomeCleanup = null;

function runCleanup(cleanup) {
  if (typeof cleanup !== "function") return;
  try { cleanup(); } catch (error) { console.warn("UI cleanup:", error); }
}

function disposeTool() {
  runCleanup(activeToolCleanup);
  activeToolCleanup = null;
}

function disposeHome() {
  runCleanup(activeHomeCleanup);
  activeHomeCleanup = null;
}

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
  document.title = tool ? `${tool.title} | Kişisel Araçlar` : "Kişisel Araçlar — özel çalışma alanı";
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
    <section class="smart-router ${smartFiles.length ? "has-files" : "is-empty"}" aria-labelledby="smartRouterTitle">
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
    <button class="${compact ? `quick-tool cat-${tool.category}` : `tool-card cat-${tool.category}`}" data-tool="${tool.id}" aria-label="${escapeHtml(tool.title)} aracını aç">
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
  disposeTool();
  disposeHome();
  currentToolId = "";
  document.body.classList.remove("tool-open");
  delete document.body.dataset.toolCategory;
  setDocumentTitle();
  const query = searchInput.value;
  const list = searchTools(query, activeCategory);
  const recentIds = loadRecentToolIds(safeStorage(), validToolIds);
  const isHome = activeCategory === "all" && !query.trim();
  const quickIds = isHome ? recentIds.slice(0, 5) : [];
  const quickTools = quickIds
    .map((id) => tools.find((tool) => tool.id === id))
    .filter(Boolean);

  const homeMarkup = isHome ? buildP17HomeMarkup(safeStorage()) : "";
  const useDesktopHome = Boolean(desktopHomeQuery?.matches);
  const compactHomeCatalog = isHome && !useDesktopHome && !catalogExpanded;
  const visibleList = compactHomeCatalog ? list.slice(0, 8) : list;
  if (homeView) homeView.innerHTML = useDesktopHome ? "" : homeMarkup;
  if (desktopHomeView) desktopHomeView.innerHTML = useDesktopHome ? homeMarkup : "";

  catalogView.innerHTML = useDesktopHome ? "" : `
    ${isHome ? smartRouterMarkup() : ""}
    ${activeCategory === "all" && query.trim() ? buildP17SearchMarkup(safeStorage(), query) : ""}
    ${quickTools.length ? `
      <section class="quick-section" aria-labelledby="quickTitle">
        <div class="quick-head">
          <div>
            <span class="eyebrow">SON</span>
            <h2 id="quickTitle">Son kullandıkların</h2>
          </div>
        </div>
        <div class="quick-grid">
          ${quickTools.map((tool) => toolCard(tool, true)).join("")}
        </div>
      </section>
    ` : ""}
    <div class="catalog-head">
      <div>
        <span class="eyebrow">${activeCategory === "all" ? "HEPSİ" : categoryLabel(activeCategory).toLocaleUpperCase("tr-TR")}</span>
        <h2><span class="catalog-count">${visibleList.length}</span>${visibleList.length === list.length ? "" : ` / ${list.length}`} araç</h2>
      </div>
    </div>
    <div class="tool-grid">
      ${visibleList.map((tool) => toolCard(tool)).join("")}
    </div>
    ${compactHomeCatalog && list.length > visibleList.length ? `
      <button class="catalog-expand" id="expandCatalog" type="button">Tüm ${list.length} aracı göster <span aria-hidden="true">↓</span></button>
    ` : ""}
    ${list.length ? "" : '<div class="empty-state">Bu aramayla eşleşen araç bulunamadı.</div>'}
  `;
  toolView.classList.add("hidden");
  catalogView.classList.remove("hidden");
  if (!useDesktopHome) wireSmartRouter();
  catalogView.querySelector("#expandCatalog")?.addEventListener("click", () => {
    catalogExpanded = true;
    renderCatalog();
    requestAnimationFrame(() => catalogView.querySelector(".catalog-head")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  });
  const activeHomeRoot = useDesktopHome ? desktopHomeView : homeView;
  if (activeHomeRoot) {
    activeHomeCleanup = wireP17Workspace(
      activeHomeRoot,
      safeStorage(),
      (id, action) => navigateTool(id, { action }),
      () => renderCatalog()
    ) || null;
  }
  if (toolCountSummary) toolCountSummary.textContent = `${tools.length} araç`;
  announceUiRendered();
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

function installMobileTechDetails() {
  const strip = toolView.querySelector(".integration-strip");
  if (!strip || toolView.querySelector(".mobile-tech-details")) return;

  const details = document.createElement("details");
  details.className = "mobile-tech-details";
  const summary = document.createElement("summary");
  summary.textContent = "Teknik bilgi";
  const mobileStrip = strip.cloneNode(true);
  mobileStrip.classList.add("integration-strip-mobile");
  details.append(summary, mobileStrip);
  strip.after(details);
}

function applyToolOpenAction(action = "") {
  if (!action) return false;

  if (action === "voice-notes") {
    toolView.querySelector('[data-note-kind="voice"]')?.click();
    toolView.querySelector("#p16NoteList")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  if (action.startsWith("note:")) {
    const id = action.slice(5);
    const note = [...toolView.querySelectorAll("[data-note]")].find((item) => item.dataset.note === id);
    if (!note) return false;
    note.click();
    const editor = toolView.querySelector("#p16NoteText");
    editor?.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => editor?.focus({ preventScroll: true }));
    return true;
  }

  if (action === "new-note") {
    const title = toolView.querySelector("#p16NoteTitle");
    const text = toolView.querySelector("#p16NoteText");
    const create = toolView.querySelector("#p16NewNote");
    if (!text) return false;
    const hasContent = Boolean(title?.value.trim() || text.value.trim());
    if (hasContent) create?.click();
    text.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => text.focus({ preventScroll: true }));
    return true;
  }

  if (action === "new-task") {
    const title = toolView.querySelector("#p16TaskTitle");
    if (!title) return false;
    toolView.querySelector(".p16-task-create")?.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => title.focus({ preventScroll: true }));
    return true;
  }

  if (action === "meeting-focus") {
    const title = toolView.querySelector("#p16MeetingTitle");
    if (!title) return false;
    title.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => title.focus({ preventScroll: true }));
    return true;
  }

  return false;
}

function finalizeToolOpen(action = "") {
  enhanceFileDrops(toolView);
  installMobileTechDetails();
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
  const actionHandled = applyToolOpenAction(action);
  if (!actionHandled) toolView.querySelector("#backToCatalog")?.focus({ preventScroll: true });
  announceUiRendered();
}

function navigateCatalog({ replace = false } = {}) {
  const method = replace ? "replaceState" : "pushState";
  history[method]({ tool: null }, "", `${location.pathname}${location.search}`);
  renderCatalog();
}

async function openTool(id, { record = true, action = "" } = {}) {
  disposeHome();
  disposeTool();
  delete toolView.dataset.officeMode;
  const tool = tools.find((item) => item.id === id);
  if (!tool) {
    navigateCatalog({ replace: true });
    return;
  }

  currentToolId = id;
  document.body.classList.add("tool-open");
  document.body.dataset.toolCategory = tool.category;
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
      const cleanup = await module[rendererName]({ tool, toolView, integration, onBack });
      activeToolCleanup = typeof cleanup === "function" ? cleanup : null;
      finalizeToolOpen(action);
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

  if (tool.inputType === "design") {
    await renderLazy("Tasarım aracı yükleniyor", () => import("./design-ui.js"), "renderDesignTool", "Tasarım aracı yüklenemedi.");
    return;
  }
  if (tool.inputType === "data-lab") {
    await renderLazy("Veri analizi yükleniyor", () => import("./data-lab-ui.js"), "renderDataLabTool", "Veri analizi yüklenemedi.");
    return;
  }
  if (tool.inputType === "p16-office") {
    await renderLazy("Ofis aracı yükleniyor", () => import("./p16-office-ui.js"), "renderP16OfficeTool", "Ofis aracı yüklenemedi.");
    return;
  }
  if (tool.inputType === "p15") {
    await renderLazy("Laboratuvar aracı yükleniyor", () => import("./p15-ui.js"), "renderP15Tool", "Laboratuvar aracı yüklenemedi.");
    return;
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
  finalizeToolOpen(action);
}

function navigateTool(id, { replace = false, record = true, action = "" } = {}) {
  if (!validToolIds.includes(id)) return navigateCatalog({ replace: true });
  closeMobileTools();
  const method = replace ? "replaceState" : "pushState";
  history[method]({ tool: id, action: action || null }, "", toolHash(id));
  openTool(id, { record, action });
}

function openMobileTools({ focus = true } = {}) {
  if (desktopHomeQuery?.matches || !mobileToolsDrawer) return;
  document.body.classList.add("mobile-tools-open");
  mobileToolsDrawer.setAttribute("aria-hidden", "false");
  if (mobileToolsBackdrop) mobileToolsBackdrop.hidden = false;
  if (focus) requestAnimationFrame(() => searchInput.focus({ preventScroll: true }));
}

function closeMobileTools() {
  document.body.classList.remove("mobile-tools-open");
  mobileToolsDrawer?.setAttribute("aria-hidden", "true");
  if (mobileToolsBackdrop) mobileToolsBackdrop.hidden = true;
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
    if (desktopHomeQuery?.matches) {
      desktopToolNavApi?.openSearch();
    } else {
      searchInput.focus();
      searchInput.select();
    }
  }

  if (event.key === "Escape" && currentToolId && !isTyping) {
    navigateCatalog();
  }
});

window.addEventListener("popstate", syncRoute);
window.addEventListener("pagehide", () => {
  disposeTool();
  disposeHome();
}, { once: true });
window.addEventListener("kisiselaraclar:remote-change", () => {
  if (!currentToolId) renderCatalog();
});
desktopHomeQuery?.addEventListener?.("change", () => {
  if (!currentToolId) renderCatalog();
});

desktopToolNavApi = mountDesktopToolNav({
  root: desktopToolNavRoot,
  categories,
  tools,
  isDesktop: () => Boolean(desktopHomeQuery?.matches),
  onToolOpen: (id) => navigateTool(id)
});

renderCategories();
history.replaceState({ tool: parseToolHash(location.hash) || null }, "", location.href);
syncRoute();


headerSearchButton?.addEventListener("click", () => {
  if (desktopHomeQuery?.matches) {
    desktopToolNavApi?.openSearch();
    return;
  }
  if (currentToolId) navigateCatalog({ replace: true });
  openMobileTools();
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

  if (button.dataset.mobileAction === "today") {
    closeMobileTools();
    if (currentToolId) prepareCatalogForMobileAction();
    requestAnimationFrame(() => {
      const today = document.querySelector("#p17Workspace");
      (today || toolBrowser)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return;
  }

  if (button.dataset.mobileAction === "note") {
    navigateTool("quick-note");
    return;
  }

  if (button.dataset.mobileAction === "task") {
    navigateTool("tasks-calendar");
    return;
  }

  if (button.dataset.mobileAction === "search") {
    if (currentToolId) prepareCatalogForMobileAction();
    openMobileTools({ focus: true });
  }
});

mobileToolsClose?.addEventListener("click", closeMobileTools);
mobileToolsBackdrop?.addEventListener("click", closeMobileTools);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("mobile-tools-open")) closeMobileTools();
});

mountMobilePlatform({ mobileDock });


heroSearchButton?.addEventListener("click", () => {
  toolBrowser?.scrollIntoView({ behavior: "smooth", block: "start" });
  requestAnimationFrame(() => searchInput.focus({ preventScroll: true }));
});

function updateScrollProgress() {
  if (!scrollProgress) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  const ratio = max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0;
  scrollProgress.style.transform = `scaleX(${ratio})`;
}

addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();
