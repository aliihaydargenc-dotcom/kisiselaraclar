export const integrations = {
  native: {
    id: "native",
    name: "Web Platform API",
    source: "Tarayıcı yerleşik API'leri",
    sourceUrl: "https://developer.mozilla.org/",
    version: "tarayıcı",
    license: "Web standardı",
    execution: "browser",
    networkRequired: false,
    dataLeavesDevice: false
  },
  papaparse: {
    id: "papaparse",
    name: "PapaParse",
    source: "mholt/PapaParse",
    sourceUrl: "https://github.com/mholt/PapaParse",
    version: "5.7.0",
    license: "MIT",
    execution: "browser",
    networkRequired: false,
    dataLeavesDevice: false,
    purpose: "CSV ayrıştırma, delimiter algılama ve CSV → JSON dönüşümü"
  }
};

export function getIntegration(id = "native") {
  return integrations[id] || integrations.native;
}
