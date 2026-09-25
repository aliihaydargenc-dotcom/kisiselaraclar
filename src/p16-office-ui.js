import { shell } from "./p16-office-ui-shared.js";

const groups = {
  "quick-note": () => import("./p16-office-notes-ui.js").then((m) => m.getNotesOfficeView("quick-note")),
  "meeting-notes": () => import("./p16-office-notes-ui.js").then((m) => m.getNotesOfficeView("meeting-notes")),
  "tasks-calendar": () => import("./p16-office-tasks-ui.js").then((m) => m.getTasksOfficeView("tasks-calendar")),
  "voice-note": () => import("./p16-office-tasks-ui.js").then((m) => m.getTasksOfficeView("voice-note")),
  "image-annotate": () => import("./p16-office-image-ui.js").then((m) => m.getImageOfficeView("image-annotate")),
  "document-scan": () => import("./p16-office-image-ui.js").then((m) => m.getImageOfficeView("document-scan")),
  "document-compare": () => import("./p16-office-document-ui.js").then((m) => m.getDocumentOfficeView("document-compare")),
  "pdf-fill-sign": () => import("./p16-office-document-ui.js").then((m) => m.getDocumentOfficeView("pdf-fill-sign"))
};

export async function renderP16OfficeTool({ tool, toolView, integration, onBack }) {
  toolView.dataset.officeMode = tool.officeMode;
  const load = groups[tool.officeMode];
  if (!load) throw new Error("P16 ofis aracı tanımlı değil.");
  const view = await load();
  if (!view) throw new Error("P16 ofis görünümü bulunamadı.");
  toolView.innerHTML = shell(tool, integration, view.body());
  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);
  const cleanup = view.wire(toolView);
  return typeof cleanup === "function" ? cleanup : undefined;
}
