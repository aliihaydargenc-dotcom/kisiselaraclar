import {
  PDF_FILE_LIMIT,
  extractPdfPages,
  getPdfInfo,
  mergePdfBuffers,
  renderPdfFirstPage,
  rotatePdf
} from "./pdf-tools.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateFiles(files) {
  const list = [...files];
  if (!list.length) throw new Error("PDF dosyası seç.");
  for (const file of list) {
    if (file.size > PDF_FILE_LIMIT) {
      throw new Error(`${file.name} 25 MB sınırını aşıyor.`);
    }
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error(`${file.name} PDF olarak tanınmadı.`);
    }
  }
  return list;
}

function shell({ tool, integration, body }) {
  return `
    <button class="back-button" id="backToCatalog">← Araçlara dön</button>
    <div class="tool-panel">
      <div class="tool-title-row">
        <div>
          <span class="eyebrow">PDF</span>
          <h2>${escapeHtml(tool.title)}</h2>
          <p>${escapeHtml(tool.description)}</p>
        </div>
        <span class="privacy-badge compact">● Tarayıcıda</span>
      </div>
      <div class="integration-strip">
        <span><strong>Motor:</strong> ${escapeHtml(integration.name)} ${escapeHtml(integration.version)}</span>
        <span><strong>Lisans:</strong> ${escapeHtml(integration.license)}</span>
        <span><strong>Veri cihazdan çıkar mı?</strong> Hayır</span>
      </div>
      ${body}
      <div id="pdfStatus" class="pdf-status">Henüz işlem yapılmadı.</div>
    </div>
  `;
}

async function bytesOf(file) {
  return file.arrayBuffer();
}

export function renderPdfTool({ tool, toolView, integration, onBack }) {
  let body = "";

  if (tool.pdfMode === "preview") {
    body = `
      <label class="file-drop">
        <strong>PDF seç</strong>
        <span>İlk sayfa cihazında render edilir. Dosya yüklenmez.</span>
        <input id="pdfFiles" type="file" accept="application/pdf,.pdf" />
      </label>
      <div class="pdf-canvas-wrap hidden" id="pdfCanvasWrap">
        <canvas id="pdfCanvas"></canvas>
      </div>
    `;
  }

  if (tool.pdfMode === "merge") {
    body = `
      <label class="file-drop">
        <strong>Birleştirilecek PDF'leri seç</strong>
        <span>Seçim sırası çıktı sırası olarak kullanılır.</span>
        <input id="pdfFiles" type="file" accept="application/pdf,.pdf" multiple />
      </label>
      <button class="primary-button" id="pdfRun">PDF'leri birleştir</button>
    `;
  }

  if (tool.pdfMode === "extract") {
    body = `
      <label class="file-drop">
        <strong>PDF seç</strong>
        <span>İstediğin sayfaları yeni dosyaya çıkar.</span>
        <input id="pdfFiles" type="file" accept="application/pdf,.pdf" />
      </label>
      <label for="pageSelection">Sayfalar</label>
      <input class="text-control" id="pageSelection" placeholder="Örnek: 1-3,5,8" />
      <button class="primary-button pdf-run-button" id="pdfRun">Seçili sayfaları çıkar</button>
    `;
  }

  if (tool.pdfMode === "rotate") {
    body = `
      <label class="file-drop">
        <strong>PDF seç</strong>
        <span>Tüm sayfalar aynı açıyla döndürülür.</span>
        <input id="pdfFiles" type="file" accept="application/pdf,.pdf" />
      </label>
      <label for="rotationAngle">Döndürme açısı</label>
      <select class="text-control" id="rotationAngle">
        <option value="90">90°</option>
        <option value="180">180°</option>
        <option value="270">270°</option>
      </select>
      <button class="primary-button pdf-run-button" id="pdfRun">PDF'i döndür</button>
    `;
  }

  toolView.innerHTML = shell({ tool, integration, body });
  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);

  const fileInput = toolView.querySelector("#pdfFiles");
  const status = toolView.querySelector("#pdfStatus");

  if (tool.pdfMode === "preview") {
    fileInput.addEventListener("change", async () => {
      try {
        const [file] = validateFiles(fileInput.files);
        status.textContent = "PDF hazırlanıyor...";
        const bytes = await bytesOf(file);
        const canvas = toolView.querySelector("#pdfCanvas");
        const info = await renderPdfFirstPage(bytes, canvas);
        toolView.querySelector("#pdfCanvasWrap").classList.remove("hidden");
        status.textContent = `${file.name} • ${info.pageCount} sayfa • ilk sayfa ${info.width}×${info.height}`;
      } catch (error) {
        status.textContent = `Hata: ${error instanceof Error ? error.message : "PDF açılamadı."}`;
      }
    });
    return;
  }

  toolView.querySelector("#pdfRun").addEventListener("click", async () => {
    status.textContent = "İşleniyor...";
    try {
      const files = validateFiles(fileInput.files);

      if (tool.pdfMode === "merge") {
        if (files.length < 2) throw new Error("En az iki PDF seç.");
        const output = await mergePdfBuffers(await Promise.all(files.map(bytesOf)));
        downloadPdf(output, "birlestirilmis.pdf");
        const info = await getPdfInfo(output);
        status.textContent = `Tamamlandı: ${files.length} dosya, ${info.pageCount} sayfa.`;
      }

      if (tool.pdfMode === "extract") {
        const bytes = await bytesOf(files[0]);
        const selection = toolView.querySelector("#pageSelection").value;
        const output = await extractPdfPages(bytes, selection);
        downloadPdf(output, "secilen-sayfalar.pdf");
        const info = await getPdfInfo(output);
        status.textContent = `Tamamlandı: ${info.pageCount} sayfa yeni PDF'e çıkarıldı.`;
      }

      if (tool.pdfMode === "rotate") {
        const bytes = await bytesOf(files[0]);
        const angle = Number(toolView.querySelector("#rotationAngle").value);
        const output = await rotatePdf(bytes, angle);
        downloadPdf(output, `dondurulmus-${angle}.pdf`);
        const info = await getPdfInfo(output);
        status.textContent = `Tamamlandı: ${info.pageCount} sayfa ${angle}° döndürüldü.`;
      }
    } catch (error) {
      status.textContent = `Hata: ${error instanceof Error ? error.message : "PDF işlemi tamamlanamadı."}`;
    }
  });
}
