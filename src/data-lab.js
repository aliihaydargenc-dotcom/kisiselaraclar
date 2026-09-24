import Papa from "papaparse";

function clean(value) {
  return String(value ?? "").trim();
}

function parseNumber(value) {
  const raw = clean(value);
  if (!raw) return null;
  let normalized = raw.replace(/\s/g, "");
  if (/^-?\d{1,3}(\.\d{3})*,\d+$/.test(normalized)) normalized = normalized.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d+,\d+$/.test(normalized) && !normalized.includes(".")) normalized = normalized.replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function detectValueType(value) {
  const raw = clean(value);
  if (!raw) return "empty";
  if (/^(true|false|evet|hayır|hayir)$/i.test(raw)) return "boolean";
  if (parseNumber(raw) !== null) return "number";
  const normalizedDate = raw.replace(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/, "$3-$2-$1");
  if (/^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[./-]\d{1,2}[./-]\d{4})([ T].*)?$/.test(raw) && !Number.isNaN(Date.parse(normalizedDate))) return "date";
  return "text";
}

function rowKey(row, columns) {
  return columns.map((column) => clean(row[column])).join("\u241F");
}

export function parseDataCsv(input) {
  const source = String(input ?? "");
  if (!source.trim()) throw new Error("CSV içeriği boş.");

  const result = Papa.parse(source, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (header) => header.trim()
  });

  const fatal = (result.errors || []).find((error) => error.code !== "UndetectableDelimiter");
  if (fatal) throw new Error("CSV ayrıştırılamadı: " + fatal.message);

  const columns = result.meta.fields || [];
  if (!columns.length) throw new Error("CSV başlık satırı bulunamadı.");

  return {
    columns,
    rows: result.data,
    delimiter: result.meta.delimiter || ",",
    errors: result.errors || []
  };
}

function inferColumn(values) {
  const nonEmpty = values.map(clean).filter(Boolean);
  if (!nonEmpty.length) return "empty";
  const counts = { number: 0, date: 0, boolean: 0, text: 0 };
  for (const value of nonEmpty) counts[detectValueType(value)] += 1;
  const [type, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return count / nonEmpty.length >= 0.8 ? type : "mixed";
}

export function duplicateGroups(input) {
  const parsed = typeof input === "string" ? parseDataCsv(input) : input;
  const groups = new Map();

  parsed.rows.forEach((row, index) => {
    const key = rowKey(row, parsed.columns);
    const item = groups.get(key) || { count: 0, rows: [], sample: row };
    item.count += 1;
    item.rows.push(index + 2);
    groups.set(key, item);
  });

  return [...groups.values()]
    .filter((item) => item.count > 1)
    .sort((a, b) => b.count - a.count);
}

export function profileCsv(input) {
  const parsed = typeof input === "string" ? parseDataCsv(input) : input;
  const profiles = parsed.columns.map((column) => {
    const values = parsed.rows.map((row) => row[column]);
    const nonEmpty = values.map(clean).filter(Boolean);
    const unique = new Set(nonEmpty);
    const type = inferColumn(values);
    const numbers = type === "number" ? nonEmpty.map(parseNumber).filter((value) => value !== null) : [];
    const missing = values.length - nonEmpty.length;

    return {
      column,
      type,
      rows: values.length,
      missing,
      missingPct: values.length ? (missing / values.length) * 100 : 0,
      unique: unique.size,
      uniquePct: nonEmpty.length ? (unique.size / nonEmpty.length) * 100 : 0,
      min: numbers.length ? Math.min(...numbers) : null,
      max: numbers.length ? Math.max(...numbers) : null,
      avg: numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null,
      sample: nonEmpty.slice(0, 3)
    };
  });

  const missingCells = profiles.reduce((sum, item) => sum + item.missing, 0);
  const duplicateRows = duplicateGroups(parsed).reduce((sum, item) => sum + item.count - 1, 0);
  const cellCount = parsed.rows.length * parsed.columns.length;

  return {
    ...parsed,
    profiles,
    summary: {
      rows: parsed.rows.length,
      columns: parsed.columns.length,
      missingCells,
      duplicateRows,
      completeness: cellCount ? (1 - missingCells / cellCount) * 100 : 100
    }
  };
}

export function qualityReport(input) {
  const profile = profileCsv(input);
  const issues = [];

  for (const item of profile.profiles) {
    if (!item.column) issues.push({ severity: "high", message: "Boş kolon başlığı bulundu." });
    if (item.missing > 0) {
      issues.push({
        severity: item.missingPct >= 25 ? "high" : "medium",
        column: item.column,
        message: item.missing + " eksik değer (%" + item.missingPct.toFixed(1) + ")."
      });
    }
    if (item.type === "mixed") issues.push({ severity: "medium", column: item.column, message: "Birden fazla veri tipi birlikte kullanılıyor." });
    if (item.unique === 1 && profile.summary.rows > 1) issues.push({ severity: "low", column: item.column, message: "Kolondaki dolu değerler sabit." });
  }

  if (profile.summary.duplicateRows > 0) {
    issues.push({ severity: "medium", message: profile.summary.duplicateRows + " tekrar eden satır bulundu." });
  }

  return { profile, issues };
}

export function missingValueReport(input) {
  const profile = profileCsv(input);
  return profile.profiles
    .filter((item) => item.missing > 0)
    .sort((a, b) => b.missingPct - a.missingPct)
    .map((item) => ({ column: item.column, missing: item.missing, missingPct: item.missingPct }));
}

export function columnReport(input, column) {
  const parsed = typeof input === "string" ? parseDataCsv(input) : input;
  if (!parsed.columns.includes(column)) throw new Error("Kolon bulunamadı.");

  const values = parsed.rows.map((row) => clean(row[column]));
  const nonEmpty = values.filter(Boolean);
  const counts = new Map();
  nonEmpty.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));

  const topValues = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([value, count]) => ({ value, count, pct: nonEmpty.length ? (count / nonEmpty.length) * 100 : 0 }));

  return {
    column,
    type: inferColumn(values),
    rows: values.length,
    missing: values.length - nonEmpty.length,
    unique: counts.size,
    topValues
  };
}

export function compareCsv(firstInput, secondInput) {
  const first = typeof firstInput === "string" ? parseDataCsv(firstInput) : firstInput;
  const second = typeof secondInput === "string" ? parseDataCsv(secondInput) : secondInput;

  const firstColumns = new Set(first.columns);
  const secondColumns = new Set(second.columns);
  const commonColumns = first.columns.filter((column) => secondColumns.has(column));
  const firstKeys = new Set(first.rows.map((row) => rowKey(row, commonColumns)));
  const secondKeys = new Set(second.rows.map((row) => rowKey(row, commonColumns)));

  let commonRows = 0;
  if (commonColumns.length) {
    firstKeys.forEach((key) => {
      if (secondKeys.has(key)) commonRows += 1;
    });
  }

  return {
    first: { rows: first.rows.length, columns: first.columns.length },
    second: { rows: second.rows.length, columns: second.columns.length },
    commonColumns,
    addedColumns: second.columns.filter((column) => !firstColumns.has(column)),
    removedColumns: first.columns.filter((column) => !secondColumns.has(column)),
    commonRows
  };
}
