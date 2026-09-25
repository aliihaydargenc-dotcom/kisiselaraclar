import { safeJsonParse } from "./p16-office-tools.js";
import { downloadBlob, e } from "./p15-ui-shared.js";
export { e };


export const storage = () => {
  try { return globalThis.localStorage; } catch { return null; }
};

export function getJson(key, fallback = []) {
  return safeJsonParse(storage()?.getItem(key), fallback);
}
export function putJson(key, value) {
  const target = storage();
  if (!target?.setItem) return false;
  try {
    target.setItem(key, JSON.stringify(value));
    try { globalThis.dispatchEvent?.(new CustomEvent("kisiselaraclar:local-change", { detail: { key } })); } catch {}
    return true;
  } catch {
    return false;
  }
}
export function status(root, value) {
  const node = root.querySelector("#p16Status");
  if (node) node.textContent = value;
}
export function downloadText(value, name, type = "text/plain;charset=utf-8") {
  downloadBlob(new Blob([value], { type }), name);
}
export function safeName(value, fallback = "dosya") {
  const clean = String(value || "").trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-");
  return clean || fallback;
}
export function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export function pdfSafeText(value = "") {
  return String(value)
    .replaceAll("Ç", "C").replaceAll("ç", "c")
    .replaceAll("Ğ", "G").replaceAll("ğ", "g")
    .replaceAll("İ", "I").replaceAll("ı", "i")
    .replaceAll("Ö", "O").replaceAll("ö", "o")
    .replaceAll("Ş", "S").replaceAll("ş", "s")
    .replaceAll("Ü", "U").replaceAll("ü", "u");
}
export function shell(tool, integration, body) {
  const dataFlow = tool.officeMode === "voice-note" ? "Tarayıcıya bağlı" : "Hayır";
  const privacyLabel = tool.officeMode === "voice-note" ? "● Tarayıcı desteğine bağlı" : "● Tarayıcıda";
  return `
    <button class="back-button" id="backToCatalog">← Araçlara dön</button>
    <div class="tool-panel p16-panel">
      <div class="tool-title-row">
        <div>
          <span class="eyebrow">OFİS ÇALIŞMA ALANI</span>
          <h2>${e(tool.title)}</h2>
          <p>${e(tool.description)}</p>
        </div>
        <span class="privacy-badge compact">${privacyLabel}</span>
      </div>
      <div class="integration-strip">
        <span><strong>Motor:</strong> ${e(integration?.name || "Web Platform API")}</span>
        <span><strong>Veri cihazdan çıkar mı?</strong> ${dataFlow}</span>
      </div>
      ${body}
    </div>`;
}
export const statusLine = (text) => `<div id="p16Status" class="p16-status" role="status">${e(text)}</div>`;

