const GLYPHS = {
  all: "◎",
  gorsel: "G",
  tasarim: "T",
  ofis: "O",
  gelistirici: "</>",
  veri: "V",
  pdf: "PDF",
  medya: "M",
  ocr: "OCR",
  kod: "QR",
  arsiv: "ZIP",
  metin: "Aa",
  zaman: "◷"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function mountDesktopToolNav({ root, categories, tools, onToolOpen, isDesktop }) {
  if (!root) return null;

  const allItems = [{ id: "all", label: "Tüm araçlar" }, ...categories];
  let expanded = false;
  let activeCategory = "";
  let flyoutMode = "";
  let searchQuery = "";

  root.innerHTML = `
    <div class="desktop-tool-rail">
      <button class="desktop-tool-toggle" type="button" aria-expanded="false" aria-label="Araç menüsünü aç">
        <span class="desktop-tool-toggle-icon" aria-hidden="true">☰</span>
        <strong>Menü</strong>
      </button>
      <button class="desktop-tool-search" type="button" aria-label="Araç ara" title="Araç ara">
        <span aria-hidden="true">⌕</span>
        <strong>Ara</strong>
      </button>
      <div class="desktop-tool-categories" role="list">
        ${allItems.map((item) => {
          const count = item.id === "all" ? tools.length : tools.filter((tool) => tool.category === item.id).length;
          return `
            <button
              class="desktop-tool-category"
              type="button"
              data-desktop-category="${item.id}"
              aria-expanded="false"
              title="${escapeHtml(item.label)}"
            >
              <span class="desktop-tool-glyph" aria-hidden="true">${escapeHtml(GLYPHS[item.id] || item.label.slice(0, 2))}</span>
              <span class="desktop-tool-category-copy">
                <strong>${escapeHtml(item.label)}</strong>
                <small>${count}</small>
              </span>
            </button>
          `;
        }).join("")}
      </div>
    </div>
    <section class="desktop-tool-flyout" aria-live="polite" aria-label="Araç alt menüsü" hidden></section>
  `;

  const rail = root.querySelector(".desktop-tool-rail");
  const toggle = root.querySelector(".desktop-tool-toggle");
  const searchButton = root.querySelector(".desktop-tool-search");
  const flyout = root.querySelector(".desktop-tool-flyout");

  function setExpanded(next) {
    expanded = Boolean(next);
    root.classList.toggle("is-expanded", expanded);
    toggle?.setAttribute("aria-expanded", String(expanded));
    toggle?.setAttribute("aria-label", expanded ? "Araç menüsünü daralt" : "Araç menüsünü aç");
  }

  function clearActiveCategory() {
    root.querySelectorAll("[data-desktop-category]").forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-expanded", "false");
    });
  }

  function closeFlyout() {
    activeCategory = "";
    flyoutMode = "";
    searchQuery = "";
    clearActiveCategory();
    flyout.hidden = true;
    flyout.innerHTML = "";
    root.classList.remove("has-flyout");
  }

  function toolRows(list) {
    if (!list.length) return '<div class="desktop-tool-empty">Eşleşen araç yok.</div>';
    return list.map((tool) => `
      <button class="desktop-tool-item" type="button" data-desktop-tool="${tool.id}">
        <span>
          <strong>${escapeHtml(tool.title)}</strong>
          <small>${escapeHtml(tool.description)}</small>
        </span>
        <i aria-hidden="true">→</i>
      </button>
    `).join("");
  }

  function renderCategory(categoryId) {
    const item = allItems.find((entry) => entry.id === categoryId);
    if (!item) return;

    if (flyoutMode === "category" && activeCategory === categoryId && !flyout.hidden) {
      closeFlyout();
      return;
    }

    activeCategory = categoryId;
    flyoutMode = "category";
    searchQuery = "";
    clearActiveCategory();
    const categoryButton = root.querySelector(`[data-desktop-category="${categoryId}"]`);
    categoryButton?.classList.add("is-active");
    categoryButton?.setAttribute("aria-expanded", "true");

    const list = categoryId === "all" ? tools : tools.filter((tool) => tool.category === categoryId);
    flyout.innerHTML = `
      <div class="desktop-tool-flyout-head">
        <div>
          <span>ARAÇLAR</span>
          <h3>${escapeHtml(item.label)}</h3>
        </div>
        <button class="desktop-tool-close" type="button" aria-label="Alt menüyü kapat">×</button>
      </div>
      <div class="desktop-tool-list">
        ${toolRows(list)}
      </div>
    `;
    flyout.hidden = false;
    root.classList.add("has-flyout");
  }

  function renderSearch(query = "") {
    flyoutMode = "search";
    activeCategory = "";
    searchQuery = query;
    clearActiveCategory();

    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    const list = normalized
      ? tools.filter((tool) => {
          const haystack = [tool.title, tool.description, ...(tool.aliases || [])].join(" ").toLocaleLowerCase("tr-TR");
          return haystack.includes(normalized);
        })
      : tools.slice(0, 12);

    flyout.innerHTML = `
      <div class="desktop-tool-flyout-head">
        <div>
          <span>HIZLI ERİŞİM</span>
          <h3>Araç ara</h3>
        </div>
        <button class="desktop-tool-close" type="button" aria-label="Aramayı kapat">×</button>
      </div>
      <label class="desktop-tool-search-field">
        <span class="sr-only">Araç ara</span>
        <input type="search" data-desktop-tool-search-input placeholder="Araç adı veya işlem..." value="${escapeHtml(query)}" autocomplete="off" />
      </label>
      <div class="desktop-tool-list">
        ${toolRows(list)}
      </div>
    `;
    flyout.hidden = false;
    root.classList.add("has-flyout");
    requestAnimationFrame(() => {
      const input = flyout.querySelector("[data-desktop-tool-search-input]");
      input?.focus({ preventScroll: true });
      if (query) input?.setSelectionRange(query.length, query.length);
    });
  }

  function openSearch() {
    if (!isDesktop?.()) return false;
    setExpanded(true);
    renderSearch(searchQuery);
    return true;
  }

  toggle?.addEventListener("click", () => setExpanded(!expanded));
  searchButton?.addEventListener("click", () => openSearch());

  rail?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-desktop-category]");
    if (!button) return;
    renderCategory(button.dataset.desktopCategory);
  });

  flyout?.addEventListener("click", (event) => {
    if (event.target.closest(".desktop-tool-close")) {
      closeFlyout();
      return;
    }
    const tool = event.target.closest("[data-desktop-tool]");
    if (!tool) return;
    closeFlyout();
    onToolOpen?.(tool.dataset.desktopTool);
  });

  flyout?.addEventListener("input", (event) => {
    if (!event.target.matches("[data-desktop-tool-search-input]")) return;
    const next = event.target.value;
    searchQuery = next;
    const normalized = next.trim().toLocaleLowerCase("tr-TR");
    const list = normalized
      ? tools.filter((tool) => {
          const haystack = [tool.title, tool.description, ...(tool.aliases || [])].join(" ").toLocaleLowerCase("tr-TR");
          return haystack.includes(normalized);
        })
      : tools.slice(0, 12);
    const listRoot = flyout.querySelector(".desktop-tool-list");
    if (listRoot) listRoot.innerHTML = toolRows(list);
  });

  document.addEventListener("pointerdown", (event) => {
    if (flyout.hidden || root.contains(event.target)) return;
    closeFlyout();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || flyout.hidden) return;
    closeFlyout();
  });

  return {
    openSearch,
    closeFlyout,
    setExpanded,
    openCategory: renderCategory
  };
}
