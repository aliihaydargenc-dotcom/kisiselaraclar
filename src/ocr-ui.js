import {
  formatOcrProgress,
  getOcrPdfInfo,
  recognizeOcrSource,
  renderOcrPdfPage,
  summarizeOcrText,
  validateOcrImage,
  validateOcrPdf
} from "./ocr-tools.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function commonControls() {
  return `
    <div class="ocr-control-grid">
      <label>OCR dili
        <select id="ocrLanguage" class="text-control">
          <option value="tur+eng">Türkçe + İngilizce</option>
          <option value="tur">Türkçe</option>
          <option value="eng">İngilizce</option>
        </select>
      </label>
      <div class="ocr-local-note">
        <strong>Tam yerel OCR</strong>
        <span>Worker, WASM ve Türkçe/İngilizce dil modelleri bu siteyle birlikte yüklenir.</span>
      </div>
    </div>
  `;
}

function imageBody() {
  return `
    <label class="file-drop">
      <strong>Görsel seç</strong>
      <span>JPEG, PNG veya WebP • en fazla 20 MB • dosya cihazından çıkmaz.</span>
      <input id="ocrFile" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" />
    </label>
    <div id="ocrSourceMeta" class="ocr-source-meta">Henüz görsel seçilmedi.</div>
    <div id="ocrImagePreview" class="ocr-image-preview hidden">
      <img id="ocrPreviewImage" alt="OCR kaynak görseli" />
    </div>
    ${commonControls()}
    <div class="action-row"><button class="primary-button" id="ocrRun" type="button">Metni çıkar</button></div>
  `;
}

function pdfBody() {
  return `
    <label class="file-drop">
      <strong>PDF seç</strong>
      <span>En fazla 25 MB • yalnız seçtiğin sayfa OCR için render edilir.</span>
      <input id="ocrFile" type="file" accept="application/pdf,.pdf" />
    </label>
    <div id="ocrSourceMeta" class="ocr-source-meta">Henüz PDF seçilmedi.</div>
    <div class="ocr-control-grid">
      <label>Sayfa
        <input id="ocrPage" class="text-control" type="number" min="1" step="1" value="1" />
      </label>
      <div class="ocr-local-note">
        <strong>PDF → Canvas → OCR</strong>
        <span>PDF.js sayfayı cihazında render eder; Tesseract yalnız bu canvas üzerinde çalışır.</span>
      </div>
    </div>
    <div id="ocrPdfPreview" class="ocr-pdf-preview hidden"><canvas id="ocrPdfCanvas"></canvas></div>
    ${commonControls()}
    <div class="action-row"><button class="primary-button" id="ocrRun" type="button">Sayfadaki metni çıkar</button></div>
  `;
}

function shell({ tool, integration, body }) {
  return `
    <button class="back-button" id="backToCatalog">← Araçlara dön</button>
    <div class="tool-panel ocr-tool-panel">
      <div class="tool-title-row">
        <div>
          <span class="eyebrow">OCR</span>
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
      <div class="ocr-progress-wrap hidden" id="ocrProgressWrap">
        <div class="ocr-progress-head"><span id="ocrProgressLabel">OCR hazırlanıyor</span><strong id="ocrProgressValue">0%</strong></div>
        <div class="ocr-progress-track"><i id="ocrProgressBar"></i></div>
      </div>
      <div id="ocrResult" class="ocr-result hidden">
        <div class="ocr-result-head">
          <div><span>OCR sonucu</span><strong id="ocrResultMeta"></strong></div>
          <div class="ocr-result-actions">
            <button class="secondary-button" id="ocrCopy" type="button">Kopyala</button>
            <button class="secondary-button" id="ocrDownload" type="button">TXT indir</button>
          </div>
        </div>
        <textarea id="ocrText" spellcheck="true" aria-label="OCR sonucu"></textarea>
      </div>
      <div id="ocrStatus" class="ocr-status">Henüz işlem yapılmadı.</div>
    </div>
  `;
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function renderOcrTool({ tool, toolView, integration, onBack }) {
  toolView.innerHTML = shell({
    tool,
    integration,
    body: tool.ocrMode === "pdf" ? pdfBody() : imageBody()
  });
  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);

  const input = toolView.querySelector("#ocrFile");
  const status = toolView.querySelector("#ocrStatus");
  const sourceMeta = toolView.querySelector("#ocrSourceMeta");
  const progressWrap = toolView.querySelector("#ocrProgressWrap");
  const progressLabel = toolView.querySelector("#ocrProgressLabel");
  const progressValue = toolView.querySelector("#ocrProgressValue");
  const progressBar = toolView.querySelector("#ocrProgressBar");
  const resultWrap = toolView.querySelector("#ocrResult");
  const resultMeta = toolView.querySelector("#ocrResultMeta");
  const resultText = toolView.querySelector("#ocrText");
  let previewUrl = null;
  let pageCount = 0;

  function resetResult() {
    resultWrap.classList.add("hidden");
    resultText.value = "";
    progressWrap.classList.add("hidden");
    progressBar.style.width = "0%";
  }

  function updateProgress(progress) {
    const view = progress?.percent === undefined ? formatOcrProgress(progress) : progress;
    progressWrap.classList.remove("hidden");
    progressLabel.textContent = view.label;
    progressValue.textContent = `${view.percent}%`;
    progressBar.style.width = `${view.percent}%`;
  }

  input.addEventListener("change", async () => {
    resetResult();
    const file = input.files?.[0];
    if (!file) return;

    try {
      if (tool.ocrMode === "image") {
        validateOcrImage(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(file);
        const image = toolView.querySelector("#ocrPreviewImage");
        image.src = previewUrl;
        toolView.querySelector("#ocrImagePreview").classList.remove("hidden");
        sourceMeta.textContent = `${file.name} • ${formatBytes(file.size)}`;
        status.textContent = "Görsel hazır.";
      } else {
        validateOcrPdf(file);
        status.textContent = "PDF sayfa bilgisi okunuyor...";
        const info = await getOcrPdfInfo(file);
        pageCount = info.pageCount;
        const page = toolView.querySelector("#ocrPage");
        page.max = String(pageCount);
        page.value = "1";
        sourceMeta.textContent = `${file.name} • ${formatBytes(file.size)} • ${pageCount} sayfa`;
        toolView.querySelector("#ocrPdfPreview").classList.add("hidden");
        status.textContent = "PDF hazır. OCR yapılacak sayfayı seç.";
      }
    } catch (error) {
      status.textContent = `Hata: ${error instanceof Error ? error.message : "Dosya açılamadı."}`;
    }
  });

  toolView.querySelector("#ocrRun").addEventListener("click", async () => {
    const file = input.files?.[0];
    if (!file) {
      status.textContent = tool.ocrMode === "pdf" ? "Önce bir PDF seç." : "Önce bir görsel seç.";
      return;
    }

    resetResult();
    progressWrap.classList.remove("hidden");
    updateProgress({ percent: 0, label: "OCR hazırlanıyor" });
    status.textContent = "İşleniyor...";

    try {
      let source = file;
      if (tool.ocrMode === "image") {
        validateOcrImage(file);
      } else {
        validateOcrPdf(file);
        const canvas = toolView.querySelector("#ocrPdfCanvas");
        const pageNumber = Number(toolView.querySelector("#ocrPage").value);
        const rendered = await renderOcrPdfPage(file, pageNumber, canvas);
        pageCount = rendered.pageCount;
        toolView.querySelector("#ocrPdfPreview").classList.remove("hidden");
        source = canvas;
        status.textContent = `Sayfa ${rendered.pageNumber}/${pageCount} render edildi; OCR çalışıyor...`;
      }

      const result = await recognizeOcrSource(source, {
        languages: toolView.querySelector("#ocrLanguage").value,
        onProgress: updateProgress
      });

      resultText.value = result.text;
      const summary = summarizeOcrText(result.text);
      const confidence = result.confidence === null ? "" : ` • güven %${result.confidence}`;
      resultMeta.textContent = `${summary.words} kelime • ${summary.characters} karakter${confidence}`;
      resultWrap.classList.remove("hidden");
      updateProgress({ percent: 100, label: "OCR tamamlandı" });
      status.textContent = result.text
        ? "Metin cihazında çıkarıldı. Sonucu düzenleyebilir, kopyalayabilir veya TXT indirebilirsin."
        : "OCR tamamlandı ancak okunabilir metin bulunamadı.";
    } catch (error) {
      progressWrap.classList.add("hidden");
      status.textContent = `Hata: ${error instanceof Error ? error.message : "OCR tamamlanamadı."}`;
    }
  });

  toolView.querySelector("#ocrCopy").addEventListener("click", async () => {
    if (resultText.value) await navigator.clipboard.writeText(resultText.value);
  });

  toolView.querySelector("#ocrDownload").addEventListener("click", () => {
    if (!resultText.value) return;
    const base = (input.files?.[0]?.name || "ocr").replace(/\.[^.]+$/, "");
    downloadText(resultText.value, `${base}-ocr.txt`);
  });
}
