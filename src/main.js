import { categories, searchTools, tools } from "./catalog.js";
import { runEngine } from "./tool-engines.js";

const searchInput = document.querySelector("#toolSearch");
const categoryList = document.querySelector("#categoryList");
const catalogView = document.querySelector("#catalogView");
const toolView = document.querySelector("#toolView");

let activeCategory = "all";

function categoryLabel(id) {
  return categories.find((category) => category.id === id)?.label || id;
}

function renderCategories() {
  const items = [
    { id: "all", label: "Tüm araçlar" },
    ...categories
  ];
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
      <span class="catalog-note">İlk çekirdek • veriler cihazında</span>
    </div>
    <div class="tool-grid">
      ${list
        .map(
          (tool) => `
            <button class="tool-card" data-tool="${tool.id}">
              <div class="tool-card-top">
                <span class="tool-category">${categoryLabel(tool.category)}</span>
                <span class="local-dot" title="Tarayıcıda çalışır">●</span>
              </div>
              <strong>${tool.title}</strong>
              <span>${tool.description}</span>
            </button>
          `
        )
        .join("")}
    </div>
    ${list.length ? "" : '<div class="empty-state">Bu aramayla eşleşen araç bulunamadı.</div>'}
  `;
  toolView.classList.add("hidden");
  catalogView.classList.remove("hidden");
}

function openTool(id) {
  const tool = tools.find((item) => item.id === id);
  if (!tool) return;
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
        <pre id="toolResult">Henüz sonuç yok.</pre>
      </div>
    </div>
  `;

  const input = toolView.querySelector("#toolInput");
  const result = toolView.querySelector("#toolResult");

  toolView.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      result.textContent = "İşleniyor...";
      try {
        const output = await runEngine(button.dataset.action, input.value);
        result.textContent = String(output);
      } catch (error) {
        result.textContent = `Hata: ${error instanceof Error ? error.message : "İşlem tamamlanamadı."}`;
      }
    });
  });

  toolView.querySelector("#clearTool").addEventListener("click", () => {
    input.value = "";
    result.textContent = "Henüz sonuç yok.";
    input.focus();
  });

  toolView.querySelector("#copyResult").addEventListener("click", async () => {
    const value = result.textContent;
    if (!value || value === "Henüz sonuç yok.") return;
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
