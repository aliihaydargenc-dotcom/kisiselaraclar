import {
  columnReport,
  compareCsv,
  duplicateGroups,
  missingValueReport,
  parseDataCsv,
  profileCsv,
  qualityReport
} from "./data-lab.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shell(tool, integration, body) {
  return [
    '<button class="back-button" id="backToCatalog">← Araçlara dön</button>',
    '<div class="tool-panel p14-data-panel">',
    '<div class="tool-title-row"><div><span class="eyebrow">VERİ</span><h2>' + escapeHtml(tool.title) + '</h2><p>' + escapeHtml(tool.description) + '</p></div><span class="privacy-badge compact">● Tarayıcıda</span></div>',
    '<div class="integration-strip"><span><strong>Motor:</strong> ' + escapeHtml(integration.name) + ' ' + escapeHtml(integration.version) + '</span><span><strong>Lisans:</strong> ' + escapeHtml(integration.license) + '</span><span><strong>Veri cihazdan çıkar mı?</strong> Hayır</span></div>',
    body,
    '</div>'
  ].join("\n");
}

function filePicker(id, label) {
  return '<label class="file-drop p14-file-drop" for="' + id + '"><strong>' + label + '</strong><span>CSV dosyası yalnız bu cihazda okunur.</span><input id="' + id + '" type="file" accept=".csv,text/csv,text/plain" /></label>';
}

function singleBody(mode) {
  const extra = mode === "column"
    ? '<label class="p14-column-select">Kolon<select id="dataColumn" class="text-control" disabled><option>Önce CSV seç</option></select></label>'
    : "";
  return [
    '<div class="p14-data-input-grid">' + filePicker("dataFile", "CSV dosyasını seç veya bırak") + extra + '</div>',
    '<div id="dataSummary" class="p14-summary-grid"></div>',
    '<div id="dataOutput" class="p14-data-output" aria-live="polite"></div>',
    '<div id="dataStatus" class="design-status">CSV dosyanı seç.</div>'
  ].join("\n");
}

function compareBody() {
  return [
    '<div class="p14-compare-grid">' + filePicker("dataFileA", "1. CSV dosyası") + filePicker("dataFileB", "2. CSV dosyası") + '</div>',
    '<button class="primary-button" id="compareRun" type="button" disabled>Karşılaştır</button>',
    '<div id="dataSummary" class="p14-summary-grid"></div>',
    '<div id="dataOutput" class="p14-data-output" aria-live="polite"></div>',
    '<div id="dataStatus" class="design-status">İki CSV dosyası seç.</div>'
  ].join("\n");
}

function summaryMarkup(summary) {
  const cards = [
    ["Satır", summary.rows],
    ["Kolon", summary.columns],
    ["Eksik hücre", summary.missingCells],
    ["Duplicate", summary.duplicateRows],
    ["Doluluk", summary.completeness.toFixed(1) + "%"]
  ];
  return cards.map((item) => '<div class="p14-summary-card"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>').join("");
}

function table(headers, rows) {
  return '<div class="p14-table-wrap"><table class="p14-table"><thead><tr>' +
    headers.map((header) => '<th>' + escapeHtml(header) + '</th>').join("") +
    '</tr></thead><tbody>' +
    rows.map((row) => '<tr>' + row.map((value) => '<td>' + escapeHtml(value) + '</td>').join("") + '</tr>').join("") +
    '</tbody></table></div>';
}

async function readFile(input) {
  const file = input.files?.[0];
  if (!file) throw new Error("CSV dosyası seç.");
  return { file, text: await file.text() };
}

function renderProfile(output, profile) {
  output.innerHTML = '<h3>Kolon profili</h3>' + table(
    ["Kolon", "Tip", "Eksik", "Benzersiz", "Min", "Max", "Ortalama"],
    profile.profiles.map((item) => [
      item.column || "(boş)",
      item.type,
      item.missing + " (%" + item.missingPct.toFixed(1) + ")",
      item.unique + " (%" + item.uniquePct.toFixed(1) + ")",
      item.min ?? "—",
      item.max ?? "—",
      item.avg === null ? "—" : item.avg.toFixed(2)
    ])
  );
}

function wireSingle(toolView, mode) {
  const input = toolView.querySelector("#dataFile");
  const summary = toolView.querySelector("#dataSummary");
  const output = toolView.querySelector("#dataOutput");
  const status = toolView.querySelector("#dataStatus");
  const columnSelect = toolView.querySelector("#dataColumn");
  let parsed = null;

  const renderColumn = () => {
    if (!parsed || !columnSelect?.value) return;
    const report = columnReport(parsed, columnSelect.value);
    output.innerHTML =
      '<div class="p14-column-hero"><span>' + escapeHtml(report.column) + '</span><strong>' + report.type + '</strong><small>' +
      report.unique + ' benzersiz · ' + report.missing + ' eksik</small></div>' +
      (report.topValues.length
        ? table(["Değer", "Adet", "Pay"], report.topValues.map((item) => [item.value, item.count, item.pct.toFixed(1) + "%"]))
        : '<p class="p14-empty">Dolu değer bulunamadı.</p>');
  };

  input.addEventListener("change", async () => {
    try {
      status.textContent = "CSV analiz ediliyor…";
      const loaded = await readFile(input);
      parsed = parseDataCsv(loaded.text);
      const profile = profileCsv(parsed);
      summary.innerHTML = summaryMarkup(profile.summary);
      status.textContent = loaded.file.name + " · " + profile.summary.rows + " satır analiz edildi.";

      if (mode === "profile") renderProfile(output, profile);

      if (mode === "quality") {
        const report = qualityReport(parsed);
        output.innerHTML = report.issues.length
          ? '<div class="p14-issue-list">' + report.issues.map((issue) =>
              '<article class="p14-issue ' + issue.severity + '"><strong>' + escapeHtml(issue.column || "Genel") + '</strong><span>' + escapeHtml(issue.message) + '</span></article>'
            ).join("") + '</div>'
          : '<div class="p14-good-state"><strong>Belirgin kalite sorunu bulunmadı.</strong><span>CSV temel kontrolleri geçti.</span></div>';
      }

      if (mode === "missing") {
        const missing = missingValueReport(parsed);
        output.innerHTML = missing.length
          ? table(["Kolon", "Eksik", "Oran"], missing.map((item) => [item.column, item.missing, item.missingPct.toFixed(1) + "%"]))
          : '<div class="p14-good-state"><strong>Eksik değer yok.</strong><span>Tüm hücreler dolu görünüyor.</span></div>';
      }

      if (mode === "duplicates") {
        const groups = duplicateGroups(parsed);
        output.innerHTML = groups.length
          ? table(["Tekrar sayısı", "CSV satırları", "Örnek"], groups.slice(0, 50).map((item) => [item.count, item.rows.join(", "), Object.values(item.sample).slice(0, 4).join(" · ")]))
          : '<div class="p14-good-state"><strong>Duplicate satır yok.</strong><span>Tam satır eşleşmesi bulunmadı.</span></div>';
      }

      if (mode === "column") {
        columnSelect.innerHTML = parsed.columns.map((column) => '<option value="' + escapeHtml(column) + '">' + escapeHtml(column) + '</option>').join("");
        columnSelect.disabled = false;
        renderColumn();
      }
    } catch (error) {
      summary.innerHTML = "";
      output.innerHTML = "";
      status.textContent = "Hata: " + (error instanceof Error ? error.message : "CSV analiz edilemedi.");
    }
  });

  columnSelect?.addEventListener("change", renderColumn);
}

function wireCompare(toolView) {
  const first = toolView.querySelector("#dataFileA");
  const second = toolView.querySelector("#dataFileB");
  const button = toolView.querySelector("#compareRun");
  const summary = toolView.querySelector("#dataSummary");
  const output = toolView.querySelector("#dataOutput");
  const status = toolView.querySelector("#dataStatus");

  const update = () => {
    button.disabled = !(first.files?.[0] && second.files?.[0]);
  };

  first.addEventListener("change", update);
  second.addEventListener("change", update);

  button.addEventListener("click", async () => {
    try {
      status.textContent = "İki CSV karşılaştırılıyor…";
      const [a, b] = await Promise.all([readFile(first), readFile(second)]);
      const result = compareCsv(a.text, b.text);

      summary.innerHTML = [
        '<div class="p14-summary-card"><span>1. CSV</span><strong>' + result.first.rows + ' × ' + result.first.columns + '</strong></div>',
        '<div class="p14-summary-card"><span>2. CSV</span><strong>' + result.second.rows + ' × ' + result.second.columns + '</strong></div>',
        '<div class="p14-summary-card"><span>Ortak kolon</span><strong>' + result.commonColumns.length + '</strong></div>',
        '<div class="p14-summary-card"><span>Ortak satır</span><strong>' + result.commonRows + '</strong></div>'
      ].join("");

      output.innerHTML = [
        '<div class="p14-compare-result"><article><span>Eklenen kolonlar</span><strong>' + (result.addedColumns.map(escapeHtml).join(", ") || "Yok") + '</strong></article>',
        '<article><span>Kaldırılan kolonlar</span><strong>' + (result.removedColumns.map(escapeHtml).join(", ") || "Yok") + '</strong></article>',
        '<article><span>Ortak kolonlar</span><strong>' + (result.commonColumns.map(escapeHtml).join(", ") || "Yok") + '</strong></article></div>'
      ].join("");

      status.textContent = a.file.name + " ↔ " + b.file.name + " karşılaştırıldı.";
    } catch (error) {
      status.textContent = "Hata: " + (error instanceof Error ? error.message : "CSV karşılaştırılamadı.");
    }
  });
}

export function renderDataLabTool({ tool, toolView, integration, onBack }) {
  const mode = tool.dataMode || "profile";
  toolView.innerHTML = shell(tool, integration, mode === "compare" ? compareBody() : singleBody(mode));
  toolView.querySelector("#backToCatalog").addEventListener("click", onBack);
  if (mode === "compare") wireCompare(toolView);
  else wireSingle(toolView, mode);
}
