import {
  decodeBarcodeFromImageElement,
  generateQrSvg,
  validateCodeImage
} from "./code-tools.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shell({ tool, integration, body }) {
  return `
    <button class="back-button" id="backToCatalog">← Araçlara dön</button>
    <div class="tool-panel code-tool-panel">
      <div class="tool-title-row">
        <div>
          <span class="eyebrow">QR & BARKOD</span>
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
      <div id="codeStatus" class="code-status">Henüz işlem yapılmadı.</div>
    </div>
  `;
}

function generateBody() {
  return `
    <label for="qrInput">QR içeriği</label>
    <textarea id="qrInput" class="code-textarea" spellcheck="false" placeholder="Metin veya https://..."></textarea>
    <div class="code-control-grid">
      <label>Hata düzeltme
        <select id="qrCorrection" class="text-control">
          <option value="M">M — dengeli</option>
          <option value="L">L — daha küçük</option>
          <option value="Q">Q — yüksek</option>
          <option value="H">H — en yüksek</option>
        </select>
      </label>
      <label>Modül boyutu
        <select id="qrCellSize" class="text-control">
          <option value="6">Küçük</option>
          <option value="8" selected>Orta</option>
          <option value="10">Büyük</option>
          <option value="12">Çok büyük</option>
        </select>
      </label>
    </div>
    <div class="action-row">
      <button class="primary-button" id="codeRun" type="button">QR oluştur</button>
      <button class="secondary-button" id="qrClear" type="button">Temizle</button>
    </div>
    <div id="qrOutput" class="qr-output hidden">
      <div id="qrSvg" class="qr-svg"></div>
      <div class="qr-output-actions">
        <button class="primary-button" id="qrDownload" type="button">SVG indir</button>
        <button class="secondary-button" id="qrCopy" type="button">İçeriği kopyala</button>
      </div>
    </div>
  `;
}

function scanBody() {
  return `
    <label class="file-drop">
      <strong>QR / barkod görseli seç</strong>
      <span>JPEG, PNG veya WebP • en fazla 20 MB • yalnız cihazında çözülür.</span>
      <input id="codeImageFile" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" />
    </label>
    <div id="codeImagePreview" class="code-image-preview hidden">
      <img id="codePreviewImage" alt="QR veya barkod önizlemesi" />
    </div>
    <div class="action-row">
      <button class="primary-button" id="codeRun" type="button">Kodu oku</button>
    </div>
    <div id="scanResult" class="scan-result hidden">
      <span id="scanFormat"></span>
      <strong id="scanText"></strong>
      <div class="action-row">
        <button class="secondary-button" id="scanCopy" type="button">Sonucu kopyala</button>
      </div>
    </div>
  `;
}

export function renderCodeTool({ tool, toolView, integration, onBack }) {
  const body = tool.codeMode === "generate" ? generateBody() : scanBody();
  toolView.innerHTML = shell({ tool, integration, body });
  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);

  const status = toolView.querySelector("#codeStatus");

  if (tool.codeMode === "generate") {
    const input = toolView.querySelector("#qrInput");
    const output = toolView.querySelector("#qrOutput");
    const svgHost = toolView.querySelector("#qrSvg");

    toolView.querySelector("#codeRun").addEventListener("click", () => {
      try {
        const svg = generateQrSvg(input.value, {
          correction: toolView.querySelector("#qrCorrection").value,
          cellSize: Number(toolView.querySelector("#qrCellSize").value),
          margin: 4
        });
        svgHost.innerHTML = svg;
        output.classList.remove("hidden");
        status.textContent = "QR kod oluşturuldu. SVG olarak indirebilir veya içeriği kopyalayabilirsin.";
      } catch (error) {
        output.classList.add("hidden");
        status.textContent = `Hata: ${error instanceof Error ? error.message : "QR oluşturulamadı."}`;
      }
    });

    toolView.querySelector("#qrClear").addEventListener("click", () => {
      input.value = "";
      svgHost.innerHTML = "";
      output.classList.add("hidden");
      status.textContent = "Henüz işlem yapılmadı.";
      input.focus();
    });

    toolView.querySelector("#qrDownload").addEventListener("click", () => {
      const svg = svgHost.innerHTML;
      if (!svg) return;
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qr-kod.svg";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    toolView.querySelector("#qrCopy").addEventListener("click", async () => {
      if (input.value.trim()) await navigator.clipboard.writeText(input.value.trim());
    });
    return;
  }

  const fileInput = toolView.querySelector("#codeImageFile");
  const previewWrap = toolView.querySelector("#codeImagePreview");
  const preview = toolView.querySelector("#codePreviewImage");
  const resultWrap = toolView.querySelector("#scanResult");
  let objectUrl = null;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    resultWrap.classList.add("hidden");
    if (!file) return;
    try {
      validateCodeImage(file);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);
      preview.src = objectUrl;
      previewWrap.classList.remove("hidden");
      status.textContent = "Görsel hazır. Kodu okumak için düğmeye bas.";
    } catch (error) {
      previewWrap.classList.add("hidden");
      status.textContent = `Hata: ${error instanceof Error ? error.message : "Görsel kullanılamadı."}`;
    }
  });

  toolView.querySelector("#codeRun").addEventListener("click", async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      status.textContent = "Önce bir görsel seç.";
      return;
    }
    status.textContent = "QR / barkod aranıyor...";
    resultWrap.classList.add("hidden");
    try {
      validateCodeImage(file);
      if (!preview.complete || !preview.naturalWidth) {
        await new Promise((resolve, reject) => {
          preview.onload = resolve;
          preview.onerror = () => reject(new Error("Görsel açılamadı."));
        });
      }
      const decoded = await decodeBarcodeFromImageElement(preview);
      toolView.querySelector("#scanFormat").textContent = decoded.format;
      toolView.querySelector("#scanText").textContent = decoded.text;
      resultWrap.classList.remove("hidden");
      status.textContent = "Kod çözüldü.";
    } catch (error) {
      status.textContent = `Hata: ${error instanceof Error ? error.message : "Kod bulunamadı veya okunamadı."}`;
    }
  });

  toolView.querySelector("#scanCopy").addEventListener("click", async () => {
    const value = toolView.querySelector("#scanText").textContent;
    if (value) await navigator.clipboard.writeText(value);
  });
}
