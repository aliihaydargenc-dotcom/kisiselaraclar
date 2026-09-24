import {
  calculateResizeDimensions,
  formatBytes,
  processImageFile,
  readImageMetadata,
  resolveOutputType,
  validateImageDescriptor
} from "./image-tools.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fileStem(name) {
  return String(name || "gorsel").replace(/\.[^.]+$/, "");
}

function shell({ tool, integration, body }) {
  return `
    <button class="back-button" id="backToCatalog">← Araçlara dön</button>
    <div class="tool-panel image-tool-panel">
      <div class="tool-title-row">
        <div>
          <span class="eyebrow">GÖRSEL</span>
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
      <label class="file-drop">
        <strong>Görsel seç</strong>
        <span>JPEG, PNG veya WebP • en fazla 30 MB • dosya cihazından çıkmaz.</span>
        <input id="imageFile" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" />
      </label>
      <div id="imageSourceMeta" class="image-source-meta">Henüz görsel seçilmedi.</div>
      ${body}
      <div id="imageOutput" class="image-output hidden">
        <img id="imageOutputPreview" alt="İşlenmiş görsel önizlemesi" />
        <div class="image-output-info">
          <strong id="imageOutputMeta"></strong>
          <button class="primary-button" id="imageDownload" type="button">İndir</button>
        </div>
      </div>
      <div id="imageStatus" class="image-status">Henüz işlem yapılmadı.</div>
    </div>
  `;
}

function bodyFor(mode) {
  if (mode === "crop") {
    return `
      <div id="imageCropHost" class="image-crop-host hidden">
        <div id="imageCropStage" class="image-crop-stage">
          <img id="imagePreview" alt="Kırpılacak görsel" />
          <div id="imageCropBox" class="image-crop-box" aria-label="Kırpma alanı">
            <span class="image-crop-grid"></span>
            <button type="button" class="image-crop-handle" data-crop-resize aria-label="Kırpma alanını boyutlandır"></button>
          </div>
        </div>
      </div>
      <div class="image-control-grid">
        <label>Kırpma oranı
          <select class="text-control" id="cropAspect">
            <option value="free">Serbest</option>
            <option value="1">1:1</option>
            <option value="1.333333">4:3</option>
            <option value="1.777778">16:9</option>
            <option value="0.8">4:5</option>
          </select>
        </label>
        <label>Çıktı formatı
          <select class="text-control" id="cropFormat">
            <option value="preserve">Kaynak formatı</option>
            <option value="image/webp">WebP</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
          </select>
        </label>
      </div>
      <div class="action-row">
        <button class="secondary-button" id="cropReset" type="button">Alanı sıfırla</button>
        <button class="primary-button" id="imageRun" type="button">Kırpılmış kopyayı oluştur</button>
      </div>
    `;
  }

  if (mode === "resize") {
    return `
      <div id="imageSimplePreview" class="image-simple-preview hidden"><img id="imagePreview" alt="Kaynak görsel" /></div>
      <div class="image-control-grid">
        <label>Genişlik (px)<input class="text-control" id="resizeWidth" type="number" min="1" step="1" /></label>
        <label>Yükseklik (px)<input class="text-control" id="resizeHeight" type="number" min="1" step="1" /></label>
      </div>
      <label class="image-check"><input id="keepAspect" type="checkbox" checked /> En-boy oranını koru</label>
      <label class="image-check"><input id="allowUpscale" type="checkbox" /> Kaynak ölçüsünden daha büyük çıktıya izin ver</label>
      <div class="action-row"><button class="primary-button" id="imageRun" type="button">Yeni boyutu oluştur</button></div>
    `;
  }

  if (mode === "compress") {
    return `
      <div id="imageSimplePreview" class="image-simple-preview hidden"><img id="imagePreview" alt="Kaynak görsel" /></div>
      <div class="image-control-grid">
        <label>Çıktı formatı
          <select class="text-control" id="compressFormat">
            <option value="image/webp">WebP — önerilen</option>
            <option value="image/jpeg">JPEG</option>
            <option value="preserve">Kaynak formatı</option>
          </select>
        </label>
        <label>Kalite <strong id="qualityValue">80%</strong>
          <input class="image-range" id="imageQuality" type="range" min="20" max="100" value="80" />
        </label>
      </div>
      <div class="action-row"><button class="primary-button" id="imageRun" type="button">Sıkıştırılmış kopyayı oluştur</button></div>
    `;
  }

  if (mode === "convert") {
    return `
      <div id="imageSimplePreview" class="image-simple-preview hidden"><img id="imagePreview" alt="Kaynak görsel" /></div>
      <div class="image-control-grid">
        <label>Hedef format
          <select class="text-control" id="convertFormat">
            <option value="image/webp">WebP</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
          </select>
        </label>
        <label>JPEG / WebP kalitesi <strong id="qualityValue">90%</strong>
          <input class="image-range" id="imageQuality" type="range" min="30" max="100" value="90" />
        </label>
      </div>
      <div class="action-row"><button class="primary-button" id="imageRun" type="button">Dönüştürülmüş kopyayı oluştur</button></div>
    `;
  }

  return `
    <div id="imageSimplePreview" class="image-simple-preview hidden"><img id="imagePreview" alt="Kaynak görsel" /></div>
    <div id="metadataSummary" class="metadata-summary hidden"></div>
    <div id="metadataTable" class="metadata-table-wrap hidden"></div>
    <div class="metadata-note">Metadata temizleme, görseli Canvas üzerinden yeniden encode eder. Piksel içeriği cihazında kalır.</div>
    <div class="action-row"><button class="primary-button" id="imageRun" type="button">Metadata temizlenmiş kopya oluştur</button></div>
  `;
}

function loadPreview(file, image) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    image.onload = () => resolve({ url, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel önizlenemedi."));
    };
    image.src = url;
  });
}

function createCropController(stage, box, aspectSelect) {
  let state = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  let drag = null;

  function ratio() {
    const value = Number(aspectSelect.value);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function render() {
    box.style.left = `${state.x * 100}%`;
    box.style.top = `${state.y * 100}%`;
    box.style.width = `${state.width * 100}%`;
    box.style.height = `${state.height * 100}%`;
  }

  function applyAspect() {
    const target = ratio();
    if (!target) return render();
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    let width = state.width;
    let height = (width * bounds.width) / (target * bounds.height);
    if (state.y + height > 1) {
      height = 1 - state.y;
      width = (height * target * bounds.height) / bounds.width;
    }
    state.width = Math.max(0.08, Math.min(width, 1 - state.x));
    state.height = Math.max(0.08, Math.min(height, 1 - state.y));
    render();
  }

  function reset() {
    state = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
    applyAspect();
  }

  box.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const resizing = Boolean(event.target.closest("[data-crop-resize]"));
    drag = {
      mode: resizing ? "resize" : "move",
      startX: event.clientX,
      startY: event.clientY,
      state: { ...state }
    };
    box.setPointerCapture?.(event.pointerId);
  });

  box.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dx = (event.clientX - drag.startX) / bounds.width;
    const dy = (event.clientY - drag.startY) / bounds.height;

    if (drag.mode === "move") {
      state.x = Math.max(0, Math.min(1 - state.width, drag.state.x + dx));
      state.y = Math.max(0, Math.min(1 - state.height, drag.state.y + dy));
      render();
      return;
    }

    let width = Math.max(0.08, Math.min(1 - drag.state.x, drag.state.width + dx));
    let height = Math.max(0.08, Math.min(1 - drag.state.y, drag.state.height + dy));
    const target = ratio();
    if (target) {
      height = (width * bounds.width) / (target * bounds.height);
      if (drag.state.y + height > 1) {
        height = 1 - drag.state.y;
        width = (height * target * bounds.height) / bounds.width;
      }
    }
    state.width = Math.max(0.08, width);
    state.height = Math.max(0.08, height);
    render();
  });

  const finish = () => { drag = null; };
  box.addEventListener("pointerup", finish);
  box.addEventListener("pointercancel", finish);
  aspectSelect.addEventListener("change", applyAspect);

  render();
  return {
    reset,
    getRect(sourceWidth, sourceHeight) {
      return {
        x: Math.round(state.x * sourceWidth),
        y: Math.round(state.y * sourceHeight),
        width: Math.max(1, Math.round(state.width * sourceWidth)),
        height: Math.max(1, Math.round(state.height * sourceHeight))
      };
    }
  };
}

function metadataTable(rows) {
  if (!rows.length) return '<div class="empty-state">Okunabilir metadata bulunamadı.</div>';
  return `
    <table class="metadata-table">
      <thead><tr><th>Alan</th><th>Değer</th></tr></thead>
      <tbody>${rows
        .map((row) => `<tr><td>${escapeHtml(row.key)}</td><td>${escapeHtml(row.value)}</td></tr>`)
        .join("")}</tbody>
    </table>
  `;
}

export function renderImageTool({ tool, toolView, integration, onBack }) {
  toolView.innerHTML = shell({ tool, integration, body: bodyFor(tool.imageMode) });
  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);

  const fileInput = toolView.querySelector("#imageFile");
  const preview = toolView.querySelector("#imagePreview");
  const sourceMeta = toolView.querySelector("#imageSourceMeta");
  const status = toolView.querySelector("#imageStatus");
  const outputWrap = toolView.querySelector("#imageOutput");
  const outputPreview = toolView.querySelector("#imageOutputPreview");
  const outputMeta = toolView.querySelector("#imageOutputMeta");
  const downloadButton = toolView.querySelector("#imageDownload");
  let file = null;
  let previewUrl = null;
  let outputUrl = null;
  let sourceWidth = 0;
  let sourceHeight = 0;
  let cropController = null;

  function clearOutput() {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = null;
    outputPreview.removeAttribute("src");
    outputWrap.classList.add("hidden");
  }

  function showOutput(result, suffix) {
    clearOutput();
    outputUrl = URL.createObjectURL(result.blob);
    outputPreview.src = outputUrl;
    outputWrap.classList.remove("hidden");
    const delta = result.savedPercent;
    const sizeText = delta > 0 ? ` • %${delta} daha küçük` : delta < 0 ? ` • %${Math.abs(delta)} daha büyük` : "";
    outputMeta.textContent = `${result.width}×${result.height} • ${formatBytes(result.outputBytes)}${sizeText}`;
    const outputFilename = `${fileStem(file.name)}-${suffix}.${result.extension}`;
    downloadButton.onclick = () => {
      const link = document.createElement("a");
      link.href = outputUrl;
      link.download = outputFilename;
      link.click();
    };
  }

  async function selectedFile() {
    const next = fileInput.files?.[0];
    if (!next) return;
    validateImageDescriptor(next);
    file = next;
    clearOutput();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const info = await loadPreview(file, preview);
    previewUrl = info.url;
    sourceWidth = info.width;
    sourceHeight = info.height;
    sourceMeta.textContent = `${file.name} • ${sourceWidth}×${sourceHeight} • ${formatBytes(file.size)}`;
    status.textContent = "Görsel hazır. Ayarları seçip işlemi başlat.";

    if (tool.imageMode === "crop") {
      toolView.querySelector("#imageCropHost").classList.remove("hidden");
      cropController ||= createCropController(
        toolView.querySelector("#imageCropStage"),
        toolView.querySelector("#imageCropBox"),
        toolView.querySelector("#cropAspect")
      );
      cropController.reset();
    } else {
      toolView.querySelector("#imageSimplePreview")?.classList.remove("hidden");
    }

    if (tool.imageMode === "resize") {
      toolView.querySelector("#resizeWidth").value = sourceWidth;
      toolView.querySelector("#resizeHeight").value = sourceHeight;
    }

    if (tool.imageMode === "metadata") {
      const summary = toolView.querySelector("#metadataSummary");
      const table = toolView.querySelector("#metadataTable");
      summary.classList.remove("hidden");
      table.classList.remove("hidden");
      summary.textContent = "Metadata okunuyor...";
      table.innerHTML = "";
      try {
        const metadata = await readImageMetadata(file);
        summary.textContent = metadata.sensitive
          ? `${metadata.rows.length} alan bulundu • GPS/konum benzeri hassas metadata tespit edildi.`
          : `${metadata.rows.length} okunabilir metadata alanı bulundu.`;
        summary.dataset.sensitive = metadata.sensitive ? "true" : "false";
        table.innerHTML = metadataTable(metadata.rows);
      } catch (error) {
        summary.textContent = `Metadata okunamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`;
        table.innerHTML = "";
      }
    }
  }

  fileInput.addEventListener("change", () => {
    selectedFile().catch((error) => {
      status.textContent = `Hata: ${error instanceof Error ? error.message : "Görsel açılamadı."}`;
    });
  });

  const quality = toolView.querySelector("#imageQuality");
  const qualityValue = toolView.querySelector("#qualityValue");
  quality?.addEventListener("input", () => {
    qualityValue.textContent = `${quality.value}%`;
  });

  if (tool.imageMode === "resize") {
    const widthInput = toolView.querySelector("#resizeWidth");
    const heightInput = toolView.querySelector("#resizeHeight");
    const keep = toolView.querySelector("#keepAspect");
    widthInput.addEventListener("input", () => {
      if (!keep.checked || !sourceWidth || !sourceHeight) return;
      const width = Number(widthInput.value);
      if (Number.isFinite(width) && width > 0) {
        heightInput.value = Math.max(1, Math.round(width * sourceHeight / sourceWidth));
      }
    });
    heightInput.addEventListener("input", () => {
      if (!keep.checked || !sourceWidth || !sourceHeight) return;
      const height = Number(heightInput.value);
      if (Number.isFinite(height) && height > 0) {
        widthInput.value = Math.max(1, Math.round(height * sourceWidth / sourceHeight));
      }
    });
  }

  toolView.querySelector("#cropReset")?.addEventListener("click", () => cropController?.reset());

  toolView.querySelector("#imageRun").addEventListener("click", async () => {
    if (!file) {
      status.textContent = "Önce bir görsel seç.";
      return;
    }
    status.textContent = "İşleniyor...";

    try {
      let result;
      let suffix = tool.imageMode;

      if (tool.imageMode === "crop") {
        result = await processImageFile(file, {
          cropRect: cropController.getRect(sourceWidth, sourceHeight),
          outputType: toolView.querySelector("#cropFormat").value,
          quality: 0.92
        });
        suffix = "kirpilmis";
      }

      if (tool.imageMode === "resize") {
        const target = calculateResizeDimensions(
          sourceWidth,
          sourceHeight,
          Number(toolView.querySelector("#resizeWidth").value),
          Number(toolView.querySelector("#resizeHeight").value),
          {
            keepAspect: toolView.querySelector("#keepAspect").checked,
            allowUpscale: toolView.querySelector("#allowUpscale").checked
          }
        );
        result = await processImageFile(file, {
          targetWidth: target.width,
          targetHeight: target.height,
          keepAspect: false,
          allowUpscale: true,
          outputType: "preserve",
          quality: 0.92
        });
        suffix = `${target.width}x${target.height}`;
      }

      if (tool.imageMode === "compress") {
        result = await processImageFile(file, {
          outputType: toolView.querySelector("#compressFormat").value,
          quality: Number(quality.value) / 100
        });
        suffix = "sikistirilmis";
      }

      if (tool.imageMode === "convert") {
        result = await processImageFile(file, {
          outputType: toolView.querySelector("#convertFormat").value,
          quality: Number(quality.value) / 100
        });
        suffix = "donusturulmus";
      }

      if (tool.imageMode === "metadata") {
        const sourceType = validateImageDescriptor(file).mime;
        const output = resolveOutputType("preserve", sourceType);
        result = await processImageFile(file, { outputType: output.mime, quality: 0.95 });
        suffix = "metadata-temiz";
      }

      showOutput(result, suffix);
      status.textContent = "Tamamlandı. Çıktıyı önizleyebilir ve indirebilirsin.";
    } catch (error) {
      status.textContent = `Hata: ${error instanceof Error ? error.message : "Görsel işlemi tamamlanamadı."}`;
    }
  });
}
