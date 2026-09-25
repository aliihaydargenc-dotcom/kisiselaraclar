const MOBILE_QUERY = "(max-width: 1179px)";

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

function updateConnection() {
  const online = navigator.onLine !== false;
  document.querySelectorAll("[data-p30-connection]").forEach((node) => {
    node.classList.toggle("is-offline", !online);
    const label = node.querySelector("strong");
    const message = online ? "Çevrimiçi · senkron hazır" : "Çevrimdışı · cihazda çalışıyor";
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
  addEventListener("online", updateConnection);
  addEventListener("offline", updateConnection);
  addEventListener("hashchange", () => updateDock(mobileDock));
  addEventListener("popstate", () => updateDock(mobileDock));

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-p30-install]");
    if (!button || !installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    updateInstallButtons();
  });

  new MutationObserver(() => {
    updateDock(mobileDock);
    updateConnection();
    updateInstallButtons();
  }).observe(document.body, { childList: true, subtree: true });

  updateDock(mobileDock);
  updateConnection();
  updateInstallButtons();

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    addEventListener("load", () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {});
    }, { once: true });
  }
}
