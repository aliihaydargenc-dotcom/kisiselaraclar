import { categories, searchTools, tools } from "./catalog.js";
import { getIntegration } from "./integrations.js";
import { runEngine } from "./tool-engines.js";

const searchInput = document.querySelector("#toolSearch");
const categoryList = document.querySelector("#categoryList");
const catalogView = document.querySelector("#catalogView");
const toolView = document.querySelector("#toolView");

let activeCategory = "all";

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

function renderCategories() {
  const items = [{ id: "all", label: "Tüm araçlar" }, ...categories];
  categoryList.innerHTML = items
    .map(
      (item) => `
        <button class="category-button ${item.id === activeCategory ? "active" : ""}" data-category="${item.id}">
          <span>${item.label}</span>
          <span class="count">${item.id === "all" ? tools.length : tools.filter((tool) => tool.category === item.id).length}</span>
        </button>
      `
    )
    .join("");
}

function renderCatalog() {
  const list = searchTools(searchInput.value, activeCategory);
  catalogView.innerHTML = `
    <div class="catalog-head">
      <div>
        <span class="eyebrow">${activeCategory === "all" ? "ARAÇ KATALOĞU" : categoryLabel(activeCategory).toLocaleUpperCase("tr-TR")}</span>
        <h2>${list.length} araç hazır</h2>
      </div>
      <span class="catalog-note">Local-first • Türkçe</span>
    </div>
    <div class="tool-grid">
      ${list
        .map((tool) => {
          const integration = getIntegration(tool.integration);
          return `
            <button class="tool-card" data-tool="${tool.id}">
              <div class="tool-card-top">
                <span class="tool-category">${categoryLabel(tool.category)}</span>
                <span class="local-dot" title="Tarayıcıda çalışır">●</span>
              </div>
              <strong>${tool.title}</strong>
              <span>${tool.description}</span>
              <small class="engine-label">${integration.name}</small>
            </button>
          `;
        })
        .join("")}
    </div>
    ${list.length ? "" : '<div class="empty-state">Bu aramayla eşleşen araç bulunamadı.</div>'}
  `;
  toolView.classList.add("hidden");
  catalogView.classList.remove("hidden");
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

async function openTool(id) {
  const tool = tools.find((item) => item.id === id);
  if (!tool) return;

  const integration = getIntegration(tool.integration);

  if (tool.inputType === "ocr") {
    catalogView.classList.add("hidden");
    toolView.classList.remove("hidden");
    toolView.innerHTML = '<div class="tool-panel"><p>OCR aracı yükleniyor...</p></div>';
    try {
      const { renderOcrTool } = await import("./ocr-ui.js");
      renderOcrTool({ tool, toolView, integration, onBack: renderCatalog });
    } catch (error) {
      toolView.innerHTML = `<div class="tool-panel"><p>Hata: ${escapeHtml(error instanceof Error ? error.message : "OCR aracı yüklenemedi.")}</p></div>`;
    }
    return;
  }

  if (tool.inputType === "code") {
    catalogView.classList.add("hidden");
    toolView.classList.remove("hidden");
    toolView.innerHTML = '<div class="tool-panel"><p>QR / barkod aracı yükleniyor...</p></div>';
    try {
      const { renderCodeTool } = await import("./code-ui.js");
      renderCodeTool({ tool, toolView, integration, onBack: renderCatalog });
    } catch (error) {
      toolView.innerHTML = `<div class="tool-panel"><p>Hata: ${escapeHtml(error instanceof Error ? error.message : "QR / barkod aracı yüklenemedi.")}</p></div>`;
    }
    return;
  }

  if (tool.inputType === "archive") {
    catalogView.classList.add("hidden");
    toolView.classList.remove("hidden");
    toolView.innerHTML = '<div class="tool-panel"><p>Arşiv aracı yükleniyor...</p></div>';
    try {
      const { renderArchiveTool } = await import("./archive-ui.js");
      renderArchiveTool({ tool, toolView, integration, onBack: renderCatalog });
    } catch (error) {
      toolView.innerHTML = `<div class="tool-panel"><p>Hata: ${escapeHtml(error instanceof Error ? error.message : "Arşiv aracı yüklenemedi.")}</p></div>`;
    }
    return;
  }

  if (tool.inputType === "image") {
    catalogView.classList.add("hidden");
    toolView.classList.remove("hidden");
    toolView.innerHTML = '<div class="tool-panel"><p>Görsel aracı yükleniyor...</p></div>';
    try {
      const { renderImageTool } = await import("./image-ui.js");
      renderImageTool({ tool, toolView, integration, onBack: renderCatalog });
    } catch (error) {
      toolView.innerHTML = `<div class="tool-panel"><p>Hata: ${escapeHtml(error instanceof Error ? error.message : "Görsel aracı yüklenemedi.")}</p></div>`;
    }
    return;
  }

  if (tool.inputType === "pdf") {
    catalogView.classList.add("hidden");
    toolView.classList.remove("hidden");
    toolView.innerHTML = '<div class="tool-panel"><p>PDF aracı yükleniyor...</p></div>';
    try {
      const { renderPdfTool } = await import("./pdf-ui.js");
      renderPdfTool({ tool, toolView, integration, onBack: renderCatalog });
    } catch (error) {
      toolView.innerHTML = `<div class="tool-panel"><p>Hata: ${escapeHtml(error instanceof Error ? error.message : "PDF aracı yüklenemedi.")}</p></div>`;
    }
    return;
  }

  const fileControl =
    tool.inputType === "csv-file"
      ? `
        <label class="file-drop" for="csvFile">
          <strong>CSV dosyası seç</strong>
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
          <h2>${tool.title}</h2>
          <p>${tool.description}</p>
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
      result.textContent = "Hata: Bu ilk sürümde CSV dosyası en fazla 20 MB olabilir.";
      return;
    }
    input.value = await file.text();
    result.textContent = `${file.name} yüklendi. Önizle veya JSON'a dönüştür.`;
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

  toolView.querySelector("#backToCatalog").addEventListener("click", renderCatalog);
}

categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  renderCategories();
  renderCatalog();
});

catalogView.addEventListener("click", (event) => {
  const card = event.target.closest("[data-tool]");
  if (card) openTool(card.dataset.tool);
});

searchInput.addEventListener("input", renderCatalog);

renderCategories();
renderCatalog();
