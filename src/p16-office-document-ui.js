import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { canvasBlob, downloadBlob, e } from "./p15-ui-shared.js";
import { diffText } from "./p16-office-tools.js";
import { localDateValue, pdfSafeText, safeName, status, statusLine } from "./p16-office-ui-shared.js";

async function extractPdfText(file) {
  const [pdfjs, workerUrl] = await Promise.all([
    import("pdfjs-dist/build/pdf.mjs"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const parts = [];
  for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo);
    const content = await page.getTextContent();
    parts.push(content.items.map((item) => item.str).join(" "));
  }
  return parts.join("\n\n");
}
async function comparisonFileText(file) {
  if (!file) return "";
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return extractPdfText(file);
  return file.text();
}
function compareBody() {
  return `
    <div class="p16-compare-grid">
      <label class="p16-compare-side"><strong>Eski / A</strong><input id="p16CompareFileA" type="file" accept=".pdf,.txt,.md,.csv,.json,.html,text/*,application/pdf"><textarea id="p16CompareA" class="text-control" placeholder="Metni yapıştır veya dosya seç…"></textarea></label>
      <label class="p16-compare-side"><strong>Yeni / B</strong><input id="p16CompareFileB" type="file" accept=".pdf,.txt,.md,.csv,.json,.html,text/*,application/pdf"><textarea id="p16CompareB" class="text-control" placeholder="Metni yapıştır veya dosya seç…"></textarea></label>
    </div>
    <div class="action-row"><button class="primary-button" id="p16CompareRun">Karşılaştır</button></div>
    <div id="p16CompareSummary" class="p16-metrics"></div>
    <div id="p16CompareResult" class="p16-diff-view"></div>
    ${statusLine("Metin, TXT/MD/CSV/JSON/HTML veya metin katmanı olan PDF'leri karşılaştır.")}`;
}
function wireCompare(root) {
  const a = root.querySelector("#p16CompareA");
  const b = root.querySelector("#p16CompareB");
  [["#p16CompareFileA", a], ["#p16CompareFileB", b]].forEach(([selector, target]) => {
    root.querySelector(selector).onchange = async (event) => {
      try {
        status(root, "Dosya okunuyor…");
        target.value = await comparisonFileText(event.target.files?.[0]);
        status(root, "Dosya hazır.");
      } catch (error) { status(root, `Dosya okunamadı: ${error.message}`); }
    };
  });
  root.querySelector("#p16CompareRun").onclick = () => {
    const result = diffText(a.value, b.value);
    root.querySelector("#p16CompareSummary").innerHTML = [
      ["Eklenen", result.summary.added],
      ["Silinen", result.summary.removed],
      ["Mod", result.summary.mode === "word" ? "Kelime" : "Satır"]
    ].map(([label, value]) => `<article><span>${label}</span><strong>${e(value)}</strong></article>`).join("");
    root.querySelector("#p16CompareResult").innerHTML = result.ops.map((op) => `<span class="${op.type}">${e(op.value)}</span>`).join("") || `<div class="p16-empty">İçerik yok.</div>`;
    status(root, result.equal ? "İki içerik aynı." : `${result.summary.added} ekleme, ${result.summary.removed} silme bulundu.`);
  };
}

async function renderPdfPage(file, pageNumber, canvas) {
  const [pdfjs, workerUrl] = await Promise.all([
    import("pdfjs-dist/build/pdf.mjs"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data: bytes });
  const doc = await task.promise;
  const pageNo = Math.max(1, Math.min(doc.numPages, Number(pageNumber) || 1));
  const page = await doc.getPage(pageNo);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(1.35, 900 / base.width);
  const viewport = page.getViewport({ scale });
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return { bytes, pageCount: doc.numPages, pageNumber: pageNo };
}
function signBody() {
  const today = localDateValue();
  return `
    <label class="file-drop p16-file" for="p16SignFile"><strong>PDF seç</strong><span>Dosya cihazında açılır ve yine cihazında imzalanır</span><input id="p16SignFile" type="file" accept="application/pdf,.pdf"></label>
    <div class="p16-sign-controls">
      <label>Sayfa<input id="p16SignPage" class="text-control" type="number" min="1" value="1"></label>
      <label>Metin<input id="p16SignText" class="text-control" placeholder="Ad Soyad / kısa not"></label>
      <label>Tarih<input id="p16SignDate" class="text-control" type="date" value="${today}"></label>
    </div>
    <div class="p16-sign-grid">
      <div>
        <span class="p16-label">PDF üzerinde yer seç</span>
        <div class="p16-pdf-stage"><canvas id="p16SignPreview"></canvas><i id="p16SignTarget"></i></div>
      </div>
      <div>
        <span class="p16-label">İmzanı çiz</span>
        <canvas id="p16Signature" class="p16-signature" width="520" height="180"></canvas>
        <button class="secondary-button" id="p16SignClear">İmzayı temizle</button>
      </div>
    </div>
    <div class="action-row"><button class="primary-button" id="p16SignRun" disabled>İmzalı PDF indir</button></div>
    ${statusLine("PDF seç; sayfada imza bloğunun yerini tıkla, imzanı çiz ve indir.")}`;
}
function wireSign(root) {
  const fileInput = root.querySelector("#p16SignFile");
  const preview = root.querySelector("#p16SignPreview");
  const sign = root.querySelector("#p16Signature");
  const sctx = sign.getContext("2d");
  sctx.lineWidth = 4; sctx.lineCap = "round"; sctx.strokeStyle = "#111";
  let drawing = false;
  let pdfInfo = null;
  let anchor = { x: .12, y: .78 };
  let sigDirty = false;

  const refresh = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    status(root, "PDF sayfası hazırlanıyor…");
    pdfInfo = await renderPdfPage(file, root.querySelector("#p16SignPage").value, preview);
    root.querySelector("#p16SignPage").max = pdfInfo.pageCount;
    root.querySelector("#p16SignPage").value = pdfInfo.pageNumber;
    root.querySelector("#p16SignRun").disabled = false;
    status(root, `${pdfInfo.pageCount} sayfa · ${pdfInfo.pageNumber}. sayfa hazır.`);
  };
  fileInput.onchange = () => refresh().catch((error) => status(root, `PDF açılamadı: ${error.message}`));
  root.querySelector("#p16SignPage").onchange = () => refresh().catch((error) => status(root, `Sayfa açılamadı: ${error.message}`));
  preview.onclick = (event) => {
    const rect = preview.getBoundingClientRect();
    anchor = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    const target = root.querySelector("#p16SignTarget");
    target.style.left = `${anchor.x * 100}%`;
    target.style.top = `${anchor.y * 100}%`;
    status(root, "İmza bloğu konumu seçildi.");
  };
  const sigPoint = (event) => {
    const rect = sign.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * sign.width, y: (event.clientY - rect.top) / rect.height * sign.height };
  };
  sign.onpointerdown = (event) => {
    drawing = true; sigDirty = true; sign.setPointerCapture?.(event.pointerId);
    const p = sigPoint(event); sctx.beginPath(); sctx.moveTo(p.x, p.y);
  };
  sign.onpointermove = (event) => {
    if (!drawing) return;
    const p = sigPoint(event); sctx.lineTo(p.x, p.y); sctx.stroke();
  };
  sign.onpointerup = () => { drawing = false; };
  root.querySelector("#p16SignClear").onclick = () => { sctx.clearRect(0, 0, sign.width, sign.height); sigDirty = false; };
  root.querySelector("#p16SignRun").onclick = async () => {
    try {
      const file = fileInput.files?.[0];
      if (!file) throw new Error("PDF seç.");
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const pageNo = Math.max(1, Math.min(doc.getPageCount(), Number(root.querySelector("#p16SignPage").value) || 1));
      const page = doc.getPage(pageNo - 1);
      const { width, height } = page.getSize();
      const x = Math.max(12, Math.min(width - 160, anchor.x * width));
      const y = Math.max(70, Math.min(height - 24, (1 - anchor.y) * height));
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const label = root.querySelector("#p16SignText").value.trim();
      const date = root.querySelector("#p16SignDate").value;
      if (label) page.drawText(pdfSafeText(label), { x, y, size: 11, font, color: rgb(.08, .08, .09) });
      if (date) page.drawText(date.split("-").reverse().join("."), { x, y: y - 16, size: 9, font, color: rgb(.2, .2, .22) });
      if (sigDirty) {
        const blob = await canvasBlob(sign, "image/png");
        const image = await doc.embedPng(new Uint8Array(await blob.arrayBuffer()));
        const maxW = 130;
        const maxH = 46;
        const scale = Math.min(maxW / image.width, maxH / image.height);
        page.drawImage(image, { x, y: y - 68, width: image.width * scale, height: image.height * scale });
      }
      if (!label && !date && !sigDirty) throw new Error("En az metin, tarih veya imza ekle.");
      downloadBlob(new Blob([await doc.save()], { type: "application/pdf" }), `imzali-${safeName(file.name.replace(/\.pdf$/i, ""), "belge")}.pdf`);
      status(root, "İmzalı PDF hazırlandı ve indirildi.");
    } catch (error) { status(root, `İşlem tamamlanamadı: ${error.message}`); }
  };
}


const VIEWS = {
  "document-compare": { body: compareBody, wire: wireCompare },
  "pdf-fill-sign": { body: signBody, wire: wireSign }
};
export const getDocumentOfficeView = (mode) => VIEWS[mode];
