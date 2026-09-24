import {
  ARCHIVE_FILE_LIMIT,
  ARCHIVE_TOTAL_INPUT_LIMIT,
  createZipArchive,
  extractZipArchive,
  gzipBuffer,
  gunzipBuffer,
  inspectGzipExpectedSize,
  inspectZipSafety
} from "./archive-tools.js";

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

function shell({ tool, integration, body }) {
  return `
    <button class="back-button" id="backToCatalog">← Araçlara dön</button>
    <div class="tool-panel archive-tool-panel">
      <div class="tool-title-row">
        <div>
          <span class="eyebrow">ARŞİV</span>
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
      <div id="archiveStatus" class="archive-status">Henüz işlem yapılmadı.</div>
    </div>
  `;
}

function createBody() {
  return `
    <label class="file-drop">
      <strong>ZIP'e eklenecek dosyaları seç</strong>
      <span>Dosya başına en fazla 100 MB • toplam 150 MB.</span>
      <input id="archiveFiles" type="file" multiple />
    </label>
    <div id="archiveSelection" class="archive-selection hidden"></div>
    <div class="archive-control-row">
      <label>Sıkıştırma seviyesi
        <select id="archiveLevel" class="text-control">
          <option value="3">Hızlı</option>
          <option value="6" selected>Dengeli</option>
          <option value="9">En yüksek</option>
        </select>
      </label>
      <button class="primary-button archive-run" id="archiveRun" type="button">ZIP oluştur</button>
    </div>
    <div id="archiveOutput" class="archive-output hidden"></div>
  `;
}

function extractBody() {
  return `
    <label class="file-drop">
      <strong>ZIP dosyası seç</strong>
      <span>İçerik açılmadan önce boyut ve giriş sayısı güvenlik kontrolünden geçer.</span>
      <input id="archiveFiles" type="file" accept=".zip,application/zip,application/x-zip-compressed" />
    </label>
    <div id="archiveInspection" class="archive-inspection hidden"></div>
    <div class="action-row"><button class="primary-button" id="archiveRun" type="button">ZIP'i aç</button></div>
    <div id="archiveExtracted" class="archive-extracted hidden"></div>
  `;
}

function gzipBody() {
  return `
    <label class="file-drop">
      <strong>Dosya seç</strong>
      <span>Normal dosyayı .gz yapabilir veya mevcut .gz dosyasını açabilirsin.</span>
      <input id="archiveFiles" type="file" />
    </label>
    <div id="gzipMeta" class="archive-inspection hidden"></div>
    <div class="action-row">
      <button class="primary-button" id="gzipCompress" type="button">GZIP sıkıştır</button>
      <button class="secondary-button" id="gzipDecompress" type="button">GZIP aç</button>
    </div>
    <div id="archiveOutput" class="archive-output hidden"></div>
  `;
}

async function fileEntry(file) {
  return {
    name: file.webkitRelativePath || file.name,
    bytes: new Uint8Array(await file.arrayBuffer())
  };
}

function downloadBytes(bytes, filename, type = "application/octet-stream") {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function outputCard(host, { title, meta, onDownload }) {
  host.innerHTML = `
    <div>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(meta)}</span>
    </div>
    <button class="primary-button" type="button">İndir</button>
  `;
  host.classList.remove("hidden");
  host.querySelector("button").addEventListener("click", onDownload);
}

export function renderArchiveTool({ tool, toolView, integration, onBack }) {
  const body =
    tool.archiveMode === "zip-create" ? createBody() :
    tool.archiveMode === "zip-extract" ? extractBody() :
    gzipBody();

  toolView.innerHTML = shell({ tool, integration, body });
  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);

  const status = toolView.querySelector("#archiveStatus");
  const input = toolView.querySelector("#archiveFiles");

  if (tool.archiveMode === "zip-create") {
    const selection = toolView.querySelector("#archiveSelection");
    const output = toolView.querySelector("#archiveOutput");

    input.addEventListener("change", () => {
      const files = [...(input.files || [])];
      output.classList.add("hidden");
      if (!files.length) {
        selection.classList.add("hidden");
        return;
      }
      const total = files.reduce((sum, file) => sum + file.size, 0);
      selection.textContent = `${files.length} dosya • ${formatBytes(total)}`;
      selection.classList.remove("hidden");
      status.textContent = total > ARCHIVE_TOTAL_INPUT_LIMIT
        ? "Toplam seçim 150 MB sınırını aşıyor."
        : "Dosyalar hazır.";
    });

    toolView.querySelector("#archiveRun").addEventListener("click", async () => {
      const files = [...(input.files || [])];
      if (!files.length) {
        status.textContent = "Önce dosya seç.";
        return;
      }
      status.textContent = "ZIP oluşturuluyor...";
      output.classList.add("hidden");
      try {
        const entries = await Promise.all(files.map(fileEntry));
        const result = await createZipArchive(entries, {
          level: Number(toolView.querySelector("#archiveLevel").value)
        });
        outputCard(output, {
          title: "arsiv.zip",
          meta: `${result.entryCount} dosya • ${formatBytes(result.inputBytes)} → ${formatBytes(result.outputBytes)}`,
          onDownload: () => downloadBytes(result.bytes, "arsiv.zip", "application/zip")
        });
        status.textContent = "ZIP tarayıcıda oluşturuldu.";
      } catch (error) {
        status.textContent = `Hata: ${error instanceof Error ? error.message : "ZIP oluşturulamadı."}`;
      }
    });
    return;
  }

  if (tool.archiveMode === "zip-extract") {
    const inspectionHost = toolView.querySelector("#archiveInspection");
    const extractedHost = toolView.querySelector("#archiveExtracted");
    let inspection = null;

    input.addEventListener("change", async () => {
      extractedHost.classList.add("hidden");
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > ARCHIVE_FILE_LIMIT) {
        inspectionHost.classList.add("hidden");
        status.textContent = "Hata: ZIP dosyası 100 MB sınırını aşıyor.";
        return;
      }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        inspection = inspectZipSafety(bytes);
        inspectionHost.innerHTML = `
          <strong>${inspection.entryCount} giriş</strong>
          <span>${formatBytes(inspection.compressedBytes)} sıkıştırılmış • ${formatBytes(inspection.uncompressedBytes)} açılmış boyut</span>
        `;
        inspectionHost.classList.remove("hidden");
        status.textContent = "ZIP güvenlik kontrolünden geçti.";
      } catch (error) {
        inspection = null;
        inspectionHost.classList.add("hidden");
        status.textContent = `Hata: ${error instanceof Error ? error.message : "ZIP incelenemedi."}`;
      }
    });

    toolView.querySelector("#archiveRun").addEventListener("click", async () => {
      const file = input.files?.[0];
      if (!file) {
        status.textContent = "Önce ZIP dosyası seç.";
        return;
      }
      status.textContent = "ZIP açılıyor...";
      extractedHost.classList.add("hidden");
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        inspection ||= inspectZipSafety(bytes);
        const result = await extractZipArchive(bytes);
        extractedHost.innerHTML = result.entries.length
          ? result.entries.map((entry, index) => `
              <div class="archive-entry" data-entry="${index}">
                <div><strong>${escapeHtml(entry.name)}</strong><span>${formatBytes(entry.bytes.byteLength)}</span></div>
                <button class="secondary-button" type="button">İndir</button>
              </div>
            `).join("")
          : '<div class="empty-state">ZIP içinde indirilebilir dosya bulunamadı.</div>';

        extractedHost.querySelectorAll("[data-entry]").forEach((row) => {
          row.querySelector("button").addEventListener("click", () => {
            const entry = result.entries[Number(row.dataset.entry)];
            downloadBytes(entry.bytes, entry.name);
          });
        });

        extractedHost.classList.remove("hidden");
        status.textContent = `${result.entries.length} dosya açıldı. Dosyalar cihazında tutuluyor.`;
      } catch (error) {
        status.textContent = `Hata: ${error instanceof Error ? error.message : "ZIP açılamadı."}`;
      }
    });
    return;
  }

  const meta = toolView.querySelector("#gzipMeta");
  const output = toolView.querySelector("#archiveOutput");

  input.addEventListener("change", async () => {
    output.classList.add("hidden");
    const file = input.files?.[0];
    if (!file) return;
    meta.textContent = `${file.name} • ${formatBytes(file.size)}`;
    meta.classList.remove("hidden");
    if (file.name.toLowerCase().endsWith(".gz")) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const expected = inspectGzipExpectedSize(bytes);
        meta.textContent += ` • beklenen çıktı ${formatBytes(expected)}`;
      } catch {
        // Kullanıcı yine de işlemi deneyebilir; ayrıntılı hata düğmede gösterilir.
      }
    }
    status.textContent = "Dosya hazır.";
  });

  toolView.querySelector("#gzipCompress").addEventListener("click", async () => {
    const file = input.files?.[0];
    if (!file) {
      status.textContent = "Önce dosya seç.";
      return;
    }
    status.textContent = "GZIP sıkıştırılıyor...";
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const compressed = await gzipBuffer(bytes, { level: 6 });
      outputCard(output, {
        title: `${file.name}.gz`,
        meta: `${formatBytes(file.size)} → ${formatBytes(compressed.byteLength)}`,
        onDownload: () => downloadBytes(compressed, `${file.name}.gz`, "application/gzip")
      });
      status.textContent = "GZIP oluşturuldu.";
    } catch (error) {
      status.textContent = `Hata: ${error instanceof Error ? error.message : "GZIP oluşturulamadı."}`;
    }
  });

  toolView.querySelector("#gzipDecompress").addEventListener("click", async () => {
    const file = input.files?.[0];
    if (!file) {
      status.textContent = "Önce .gz dosyası seç.";
      return;
    }
    status.textContent = "GZIP açılıyor...";
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const decompressed = await gunzipBuffer(bytes);
      const filename = file.name.toLowerCase().endsWith(".gz")
        ? file.name.slice(0, -3) || "dosya"
        : `${file.name}.acilmis`;
      outputCard(output, {
        title: filename,
        meta: `${formatBytes(file.size)} → ${formatBytes(decompressed.byteLength)}`,
        onDownload: () => downloadBytes(decompressed, filename)
      });
      status.textContent = "GZIP açıldı.";
    } catch (error) {
      status.textContent = `Hata: ${error instanceof Error ? error.message : "GZIP açılamadı."}`;
    }
  });
}
