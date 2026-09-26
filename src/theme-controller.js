const STORAGE_KEY = "notlar:theme";
const media = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
const validPreferences = new Set(["system", "light", "dark"]);

function storage() {
  try { return globalThis.localStorage; } catch { return null; }
}

function readPreference() {
  const value = storage()?.getItem(STORAGE_KEY) || "system";
  return validPreferences.has(value) ? value : "system";
}

let preference = readPreference();

function resolvedTheme(value = preference) {
  if (value === "dark" || value === "light") return value;
  return media?.matches ? "dark" : "light";
}

function themeIcon(theme) {
  return theme === "dark"
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"/></svg>`;
}

function updateThemeColor(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#11150f" : "#f2efe8");
}

function updateButtons(theme) {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const next = theme === "dark" ? "Gündüz moduna geç" : "Gece moduna geç";
    button.innerHTML = `${themeIcon(theme)}<span>${next}</span>`;
    button.setAttribute("aria-label", next);
    button.title = next;
  });
}

function applyTheme(nextPreference = preference) {
  preference = validPreferences.has(nextPreference) ? nextPreference : "system";
  const theme = resolvedTheme(preference);
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = theme;
  updateThemeColor(theme);
  updateButtons(theme);
  try {
    globalThis.dispatchEvent(new CustomEvent("notlar:theme-change", {
      detail: { preference, theme }
    }));
  } catch {}
}

function persistPreference(nextPreference) {
  preference = nextPreference;
  try { storage()?.setItem(STORAGE_KEY, nextPreference); } catch {}
  applyTheme(nextPreference);
}

function createToggle(location) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  button.dataset.themeToggle = location;
  button.addEventListener("click", () => {
    persistPreference(resolvedTheme() === "dark" ? "light" : "dark");
  });
  return button;
}

function installButtons() {
  const desktop = document.querySelector(".site-nav");
  if (desktop && !desktop.querySelector('[data-theme-toggle="desktop"]')) {
    desktop.prepend(createToggle("desktop"));
  }

  const mobile = document.querySelector(".mobile-header > div");
  if (mobile && !mobile.querySelector('[data-theme-toggle="mobile"]')) {
    mobile.prepend(createToggle("mobile"));
  }

  updateButtons(resolvedTheme());
}

applyTheme(preference);

const observer = new MutationObserver(() => installButtons());
observer.observe(document.documentElement, { childList: true, subtree: true });
installButtons();

media?.addEventListener?.("change", () => {
  if (preference === "system") applyTheme("system");
});

globalThis.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) applyTheme(readPreference());
});
