import "./p38-command-center.js";

const cssHref = new URL("./p38-command-center.css", import.meta.url).href;
if (![...document.styleSheets].some((sheet) => sheet.href === cssHref)) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssHref;
  document.head.append(link);
}

function applyAction(action, attempt = 0) {
  if (!action || attempt > 18) return;
  const toolView = document.querySelector("#toolView");
  if (!toolView || toolView.classList.contains("hidden")) {
    setTimeout(() => applyAction(action, attempt + 1), 70);
    return;
  }

  let handled = false;
  if (action.startsWith("note:")) {
    const id = action.slice(5);
    const note = [...toolView.querySelectorAll("[data-note]")].find((item) => item.dataset.note === id);
    if (note) {
      note.click();
      requestAnimationFrame(() => toolView.querySelector("#p16NoteText")?.focus({ preventScroll: true }));
      handled = true;
    }
  } else if (action === "new-note") {
    const text = toolView.querySelector("#p16NoteText");
    const title = toolView.querySelector("#p16NoteTitle");
    if (text) {
      if (title?.value.trim() || text.value.trim()) toolView.querySelector("#p16NewNote")?.click();
      requestAnimationFrame(() => text.focus({ preventScroll: true }));
      handled = true;
    }
  } else if (action === "new-task") {
    const title = toolView.querySelector("#p16TaskTitle");
    if (title) {
      requestAnimationFrame(() => title.focus({ preventScroll: true }));
      handled = true;
    }
  }

  if (!handled) setTimeout(() => applyAction(action, attempt + 1), 70);
}

globalThis.addEventListener("kisiselaraclar:navigate-tool", (event) => {
  const id = String(event.detail?.id || "").trim();
  const action = String(event.detail?.action || "").trim();
  if (!id) return;
  const next = `#tool=${encodeURIComponent(id)}`;
  history.pushState({ tool: id, action: action || null }, "", next);
  globalThis.dispatchEvent(new PopStateEvent("popstate", { state: { tool: id, action: action || null } }));
  if (action) setTimeout(() => applyAction(action), 80);
});
