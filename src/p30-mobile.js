const MOBILE_QUERY = "(max-width: 1179px)";
const UI_RENDER_EVENT = "kisiselaraclar:ui-rendered";
const SYNC_STATE_EVENT = "kisiselaraclar:sync-state";
let lastSyncState = null;

function mobileActiveAction() {
  const id = new URLSearchParams(location.hash.replace(/^#/, "")).get("tool") || "";
  if (id === "quick-note" || id === "voice-note") return "note";
  if (id === "tasks-calendar") return "task";
  return "today";
}

function updateDock(dock) {
  if (!dock) return;
  const active = mobileActiveAction();
  dock.querySelectorAll("[data-mobile-action]").forEach((button) => {
    const selected = button.dataset.mobileAction === active;
    button.classList.toggle("is-active", selected);
    if (selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function updateConnection(syncState = lastSyncState) {
  const online = navigator.onLine !== false;
  document.querySelectorAll("[data-p30-connection]").forEach((node) => {
    node.classList.toggle("is-offline", !online);
    node.classList.toggle("has-sync-error", online && syncState?.state === "error");
    const label = node.querySelector("strong");
    const message = !online
      ? "Çevrimdışı · cihazda çalışıyor"
      : syncState?.state === "syncing"
        ? "Senkronize ediliyor"
        : syncState?.state === "synced"
          ? "Bulut güncel"
          : syncState?.state === "error"
            ? "Senkron bekliyor"
            : "Çevrimiçi";
    if (label && label.textContent !== message) label.textContent = message;
  });
}

export function mountMobilePlatform({ mobileDock } = {}) {
  let installPrompt = null;

  const updateInstallButtons = () => {
    document.querySelectorAll("[data-p30-install]").forEach((button) => {
      button.hidden = !installPrompt || !matchMedia(MOBILE_QUERY).matches;
    });
  };

  addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    updateInstallButtons();
  });
  addEventListener("appinstalled", () => {
    installPrompt = null;
    updateInstallButtons();
  });
  const refresh = () => {
    updateDock(mobileDock);
    updateConnection();
    updateInstallButtons();
  };

  addEventListener("online", refresh);
  addEventListener("offline", refresh);
  addEventListener("hashchange", () => updateDock(mobileDock));
  addEventListener("popstate", () => updateDock(mobileDock));
  addEventListener(UI_RENDER_EVENT, refresh);
  addEventListener(SYNC_STATE_EVENT, (event) => {
    lastSyncState = event.detail || null;
    updateConnection(lastSyncState);
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-p30-install]");
    if (!button || !installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    updateInstallButtons();
  });

  refresh();

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    addEventListener("load", () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {});
    }, { once: true });
  }
}
