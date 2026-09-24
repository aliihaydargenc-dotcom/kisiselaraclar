import {
  MEDIA_CONVERT_LIMIT,
  convertMediaFile,
  formatMediaBytes,
  formatMediaDuration,
  inspectMediaFile,
  validateMediaDescriptor
} from "./media-tools.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fileStem(name = "medya") {
  return String(name || "medya").replace(/\.[^.]+$/, "");
}

function shell({ tool, integration, body }) {
  return `
    <button class="back-button" id="backToCatalog">← Araçlara dön</button>
    <div class="tool-panel media-tool-panel">
      <div class="tool-title-row">
        <div>
          <span class="eyebrow">MEDYA</span>
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
        <strong>Ses veya video seç / buraya bırak</strong>
        <span>MP4, MOV, WebM, MKV, MP3, WAV, M4A, FLAC, OGG ve benzeri medya kapsayıcıları.</span>
        <input id="mediaFile" type="file" accept="video/*,audio/*,.mp4,.m4v,.mov,.webm,.mkv,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus" />
      </label>
      <div id="mediaSourceMeta" class="media-source-meta">Henüz medya seçilmedi.</div>
      <div id="mediaPreview" class="media-preview hidden"></div>
      <div id="mediaInfo" class="media-info hidden"></div>
      ${body}
      <div id="mediaProgress" class="media-progress hidden">
        <div><span>İşleniyor</span><strong id="mediaProgressValue">0%</strong></div>
        <i><b id="mediaProgressBar"></b></i>
      </div>
      <div id="mediaOutput" class="media-output hidden"></div>
      <div id="mediaStatus" class="media-status">Henüz işlem yapılmadı.</div>
    </div>
  `;
}

function bodyFor(mode) {
  if (mode === "trim") {
    return `
      <div class="media-control-grid">
        <label>Başlangıç (sn)
          <input id="mediaStart" class="text-control" type="number" min="0" step="0.1" value="0" />
        </label>
        <label>Bitiş (sn)
          <input id="mediaEnd" class="text-control" type="number" min="0.1" step="0.1" />
        </label>
        <label>Çıktı formatı
          <select id="mediaFormat" class="text-control">
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
            <option value="mp3">MP3 — yalnız ses</option>
            <option value="wav">WAV — yalnız ses</option>
          </select>
        </label>
      </div>
      <div class="media-note">Kırpma sırasında mümkünse track doğrudan kopyalanır; gerektiğinde tarayıcı codec desteğine göre yeniden encode edilir.</div>
      <div class="action-row"><button id="mediaRun" class="primary-button" type="button">Seçili aralığı çıkar</button></div>
    `;
  }

  if (mode === "convert") {
    return `
      <div class="media-control-grid">
        <label>Hedef format
          <select id="mediaFormat" class="text-control">
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
            <option value="mp3">MP3 — yalnız ses</option>
            <option value="wav">WAV — yalnız ses</option>
          </select>
        </label>
        <label>Video genişliği
          <select id="mediaWidth" class="text-control">
            <option value="">Orijinal</option>
            <option value="1920">1920 px</option>
            <option value="1280">1280 px</option>
            <option value="854">854 px</option>
          </select>
        </label>
      </div>
      <div class="media-note">MP3/WAV seçildiğinde video track'i atılır. Video yeniden boyutlandırma encode gerektirir ve tarayıcı codec desteğine bağlıdır.</div>
      <div class="action-row"><button id="mediaRun" class="primary-button" type="button">Dönüştür</button></div>
    `;
  }

  return '<div class="media-note">Dosyanın kapsayıcı, süre, codec, çözünürlük ve ses bilgileri yerel olarak okunur.</div>';
}

function infoMarkup(info) {
  const rows = [
    ["Kapsayıcı", info.format],
    ["MIME", info.mimeType || "Bilinmiyor"],
    ["Süre", info.duration === null ? "Bilinmiyor" : formatMediaDuration(info.duration)],
    ["Boyut", formatMediaBytes(info.size)]
  ];
  for (const track of info.tracks) {
    if (track.type === "video") {
      rows.push([
        `Video #${track.number}`,
        `${track.codec || "codec ?"} • ${track.width}×${track.height}${track.rotation ? ` • ${track.rotation}°` : ""}`
      ]);
    } else if (track.type === "audio") {
      rows.push([
        `Ses #${track.number}`,
        `${track.codec || "codec ?"} • ${track.channels} kanal • ${Math.round((track.sampleRate || 0) / 1000)} kHz`
      ]);
    }
  }
  for (const [key, value] of Object.entries(info.metadata || {})) {
    rows.push([key, value]);
  }
  return `
    <div class="media-info-grid">
      ${rows.map(([key, value]) => `<div><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
    </div>
  `;
}

function previewMarkup(file, url) {
  const type = String(file.type || "").toLowerCase();
  const video = type.startsWith("video/") || /\.(mp4|m4v|mov|webm|mkv)$/i.test(file.name);
  const audio = type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|flac|ogg|opus)$/i.test(file.name);
  if (video) return `<video controls preload="metadata" src="${url}"></video>`;
  if (audio) return `<audio controls preload="metadata" src="${url}"></audio>`;
  return '<span>Tarayıcı yerleşik önizleme sunmuyor; teknik bilgiler yine okunabilir.</span>';
}

function outputCard(file, result, url) {
  const filename = `${fileStem(file.name)}-islenmis.${result.extension}`;
  return `
    <div>
      <strong>${escapeHtml(filename)}</strong>
      <span>${escapeHtml(result.mimeType)} • ${formatMediaBytes(result.size)}</span>
    </div>
    <a class="primary-button media-download" href="${url}" download="${escapeHtml(filename)}">İndir</a>
  `;
}

export function renderMediaTool({ tool, toolView, integration, onBack }) {
  toolView.innerHTML = shell({ tool, integration, body: bodyFor(tool.mediaMode) });
  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);

  const input = toolView.querySelector("#mediaFile");
  const sourceMeta = toolView.querySelector("#mediaSourceMeta");
  const preview = toolView.querySelector("#mediaPreview");
  const infoHost = toolView.querySelector("#mediaInfo");
  const status = toolView.querySelector("#mediaStatus");
  const progress = toolView.querySelector("#mediaProgress");
  const progressValue = toolView.querySelector("#mediaProgressValue");
  const progressBar = toolView.querySelector("#mediaProgressBar");
  const output = toolView.querySelector("#mediaOutput");
  let file = null;
  let info = null;
  let previewUrl = null;
  let outputUrl = null;

  function clearUrls() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    previewUrl = null;
    outputUrl = null;
  }

  input.addEventListener("change", async () => {
    output.classList.add("hidden");
    progress.classList.add("hidden");
    file = input.files?.[0] || null;
    if (!file) return;
    try {
      validateMediaDescriptor(file, { conversion: tool.mediaMode !== "info" });
      status.textContent = "Medya bilgileri okunuyor...";
      info = await inspectMediaFile(file);
      sourceMeta.textContent = `${file.name} • ${formatMediaBytes(file.size)}`;
      infoHost.innerHTML = infoMarkup(info);
      infoHost.classList.remove("hidden");

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      preview.innerHTML = previewMarkup(file, previewUrl);
      preview.classList.remove("hidden");

      if (tool.mediaMode === "trim" && Number.isFinite(info.duration)) {
        toolView.querySelector("#mediaEnd").value = Number(info.duration.toFixed(2));
      }
      status.textContent = tool.mediaMode === "info"
        ? "Medya bilgileri cihazında okundu."
        : `Hazır. İşlem çıktısı en fazla ${Math.round(MEDIA_CONVERT_LIMIT / (1024 * 1024))} MB giriş sınırıyla bellekte üretilecek.`;
    } catch (error) {
      info = null;
      infoHost.classList.add("hidden");
      preview.classList.add("hidden");
      status.textContent = `Hata: ${error instanceof Error ? error.message : "Medya okunamadı."}`;
    }
  });

  toolView.querySelector("#mediaRun")?.addEventListener("click", async () => {
    if (!file) {
      status.textContent = "Önce bir medya dosyası seç.";
      return;
    }

    const run = toolView.querySelector("#mediaRun");
    run.disabled = true;
    progress.classList.remove("hidden");
    output.classList.add("hidden");
    progressBar.style.width = "0%";
    progressValue.textContent = "0%";
    status.textContent = "Medya işleniyor...";

    try {
      const format = toolView.querySelector("#mediaFormat").value;
      const options = {
        format,
        onProgress(value) {
          const percent = Math.round(value * 100);
          progressBar.style.width = `${percent}%`;
          progressValue.textContent = `${percent}%`;
        }
      };
      if (tool.mediaMode === "trim") {
        options.start = toolView.querySelector("#mediaStart").value;
        options.end = toolView.querySelector("#mediaEnd").value;
      }
      if (tool.mediaMode === "convert") {
        options.width = toolView.querySelector("#mediaWidth").value || null;
      }

      const result = await convertMediaFile(file, options);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      outputUrl = URL.createObjectURL(result.blob);
      output.innerHTML = outputCard(file, result, outputUrl);
      output.classList.remove("hidden");
      progressBar.style.width = "100%";
      progressValue.textContent = "100%";
      status.textContent = "Tamamlandı. Çıktı cihazında üretildi.";
    } catch (error) {
      status.textContent = `Hata: ${error instanceof Error ? error.message : "Medya işlemi tamamlanamadı."}`;
    } finally {
      run.disabled = false;
    }
  });

  window.addEventListener("pagehide", clearUrls, { once: true });
}
