const ICONS = {
  all: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>',
  gorsel: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.7"/><path d="m6 17 4.4-4.2 3.2 2.7 2.7-2.5 2.2 4"/></svg>',
  tasarim: '<svg viewBox="0 0 24 24"><path d="M4 19h5l10-10-5-5L4 14v5Z"/><path d="m12.5 5.5 5 5"/><path d="M4 14h5v5"/></svg>',
  ofis: '<svg viewBox="0 0 24 24"><path d="M7 3.5h8l3 3V20H7z"/><path d="M15 3.5V7h3"/><path d="M10 11h5M10 14h5M10 17h3"/></svg>',
  gelistirici: '<svg viewBox="0 0 24 24"><path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M14 4l-4 16"/></svg>',
  veri: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
  pdf: '<svg viewBox="0 0 24 24"><path d="M7 3.5h8l3 3V20H7z"/><path d="M15 3.5V7h3"/><path d="M9 15c2.8-4.8 3.5-5.8 4-6.5.4 2.2 1.5 4.8 3 6.5-2-.6-4.9-.5-7 0Z"/></svg>',
  medya: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="m10 9 5 3-5 3z"/></svg>',
  ocr: '<svg viewBox="0 0 24 24"><path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4"/><path d="M8 12h8M8 9h8M8 15h6"/></svg>',
  kod: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h2v2h-2zM18 14h2v4h-2zM14 18h4v2h-4z"/></svg>',
  arsiv: '<svg viewBox="0 0 24 24"><path d="M4 7h16v13H4z"/><path d="M3 4h18v4H3z"/><path d="M9 12h6"/></svg>',
  metin: '<svg viewBox="0 0 24 24"><path d="M5 6h14M12 6v13M8 19h8"/></svg>',
  zaman: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>'
};

const SEARCH_ICON = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>';
const MENU_ICON = '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/></svg>';

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function iconFor(categoryId) {
  return ICONS[categoryId] || ICONS.all;
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
        <span class="desktop-tool-toggle-icon desktop-tool-svg" aria-hidden="true">${MENU_ICON}</span>
        <strong>Menü</strong>
      </button>
      <button class="desktop-tool-search" type="button" aria-label="Araç ara" title="Araç ara">
        <span class="desktop-tool-svg" aria-hidden="true">${SEARCH_ICON}</span>
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
              <span class="desktop-tool-glyph desktop-tool-svg" aria-hidden="true">${iconFor(item.id)}</span>
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
        <span class="desktop-tool-item-icon desktop-tool-svg" aria-hidden="true">${iconFor(tool.category)}</span>
        <span class="desktop-tool-item-copy">
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
      <div class="desktop-tool-list">${toolRows(list)}</div>
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
      <div class="desktop-tool-list">${toolRows(list)}</div>
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

  return { openSearch, closeFlyout, setExpanded, openCategory: renderCategory };
}
