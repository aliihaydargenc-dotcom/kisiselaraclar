import {
  PDF_FILE_LIMIT,
  extractPdfPages,
  getPdfInfo,
  imagesToPdf,
  mergePdfBuffers,
  renderPdfFirstPage,
  renderPdfPagesToImages,
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

function downloadBytes(bytes, filename, type = "application/octet-stream") {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadPdf(bytes, filename) {
  downloadBytes(bytes, filename, "application/pdf");
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

function validateImageFiles(files) {
  const list = [...files];
  if (!list.length) throw new Error("En az bir görsel seç.");
  if (list.length > 30) throw new Error("Tek PDF için en fazla 30 görsel seçilebilir.");
  let total = 0;
  for (const file of list) {
    if (file.size > 30 * 1024 * 1024) throw new Error(`${file.name} 30 MB sınırını aşıyor.`);
    total += file.size;
    if (total > 120 * 1024 * 1024) throw new Error("Görsellerin toplam boyutu 120 MB sınırını aşıyor.");
    const type = String(file.type || "").toLowerCase();
    const name = file.name.toLowerCase();
    const supported = ["image/jpeg", "image/png", "image/webp"].includes(type) ||
      /\.(jpe?g|png|webp)$/.test(name);
    if (!supported) throw new Error(`${file.name} desteklenen bir görsel değil.`);
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

  if (tool.pdfMode === "to-images") {
    body = `
      <label class="file-drop">
        <strong>PDF seç</strong>
        <span>Seçili sayfalar cihazında PNG veya JPEG'e dönüştürülür ve ZIP olarak indirilir.</span>
        <input id="pdfFiles" type="file" accept="application/pdf,.pdf" />
      </label>
      <label for="pageSelection">Sayfalar</label>
      <input class="text-control" id="pageSelection" placeholder="Boş = tüm sayfalar (en fazla 40) • Örnek: 1-3,5" />
      <div class="pdf-control-grid">
        <label>Görsel formatı
          <select class="text-control" id="pdfImageFormat">
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
          </select>
        </label>
        <label>Hedef genişlik
          <select class="text-control" id="pdfImageWidth">
            <option value="1200">1200 px</option>
            <option value="1600" selected>1600 px</option>
            <option value="2000">2000 px</option>
          </select>
        </label>
      </div>
      <button class="primary-button pdf-run-button" id="pdfRun">Sayfaları görsele dönüştür</button>
    `;
  }

  if (tool.pdfMode === "from-images") {
    body = `
      <label class="file-drop">
        <strong>Görselleri seç</strong>
        <span>JPEG, PNG veya WebP • en fazla 30 görsel • seçim sırası PDF sayfa sırasıdır.</span>
        <input id="pdfFiles" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple />
      </label>
      <div class="pdf-convert-note">Görseller A4 sayfaya oran korunarak sığdırılır; yatay görseller için sayfa otomatik yatay olur.</div>
      <button class="primary-button pdf-run-button" id="pdfRun">Görsellerden PDF oluştur</button>
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

  if (tool.pdfMode === "from-images") {
    fileInput.addEventListener("change", () => {
      try {
        const files = validateImageFiles(fileInput.files);
        status.textContent = `${files.length} görsel hazır. Seçim sırası PDF sayfa sırası olacak.`;
      } catch (error) {
        status.textContent = `Hata: ${error instanceof Error ? error.message : "Görseller okunamadı."}`;
      }
    });
  }

  toolView.querySelector("#pdfRun").addEventListener("click", async () => {
    status.textContent = "İşleniyor...";
    try {
      if (tool.pdfMode === "from-images") {
        const files = validateImageFiles(fileInput.files);
        const { processImageFile, validateImageDescriptor } = await import("./image-tools.js");
        const entries = [];
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          const descriptor = validateImageDescriptor(file);
          status.textContent = `Görsel ${index + 1}/${files.length} hazırlanıyor...`;
          const outputType = descriptor.mime === "image/webp" ? "image/jpeg" : descriptor.mime;
          const processed = await processImageFile(file, {
            outputType,
            quality: 0.94
          });
          entries.push({
            name: file.name,
            mime: processed.mime,
            bytes: new Uint8Array(await processed.blob.arrayBuffer())
          });
        }
        const output = await imagesToPdf(entries);
        downloadPdf(output, "gorsellerden.pdf");
        const info = await getPdfInfo(output);
        status.textContent = `Tamamlandı: ${info.pageCount} görsel tek PDF'e dönüştürüldü.`;
        return;
      }

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

      if (tool.pdfMode === "to-images") {
        const bytes = await bytesOf(files[0]);
        const selection = toolView.querySelector("#pageSelection").value;
        const format = toolView.querySelector("#pdfImageFormat").value;
        const targetWidth = Number(toolView.querySelector("#pdfImageWidth").value);
        const rendered = await renderPdfPagesToImages(bytes, selection, {
          format,
          targetWidth,
          onProgress({ current, total, pageNumber }) {
            status.textContent = `Sayfa ${pageNumber} hazırlanıyor • ${current}/${total}`;
          }
        });
        const { createZipArchive } = await import("./archive-tools.js");
        status.textContent = "Görseller ZIP olarak paketleniyor...";
        const archive = await createZipArchive(rendered.entries, { level: 3 });
        downloadBytes(archive.bytes, `pdf-sayfalari-${rendered.format}.zip`, "application/zip");
        status.textContent = `Tamamlandı: ${rendered.selectedCount} sayfa ${rendered.format.toUpperCase()} olarak indirildi.`;
      }
    } catch (error) {
      status.textContent = `Hata: ${error instanceof Error ? error.message : "PDF işlemi tamamlanamadı."}`;
    }
  });
}
