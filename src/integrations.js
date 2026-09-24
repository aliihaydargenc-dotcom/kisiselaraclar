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
  "image-native": {
    id: "image-native",
    name: "Web Platform Image API",
    source: "Canvas, createImageBitmap ve Blob API",
    sourceUrl: "https://developer.mozilla.org/",
    version: "tarayıcı",
    license: "Web standardı",
    execution: "browser",
    networkRequired: false,
    dataLeavesDevice: false,
    purpose: "Görsel kırpma, yeniden boyutlandırma, sıkıştırma, format dönüşümü ve metadata temizleme"
  },
  exifreader: {
    id: "exifreader",
    name: "ExifReader",
    source: "mattiasw/ExifReader",
    sourceUrl: "https://github.com/mattiasw/ExifReader",
    version: "4.45.2",
    license: "MPL-2.0",
    execution: "browser",
    networkRequired: false,
    dataLeavesDevice: false,
    purpose: "Görsel EXIF/IPTC/XMP metadata alanlarını yerel olarak okuma"
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
  },
  pdfjs: {
    id: "pdfjs",
    name: "PDF.js",
    source: "mozilla/pdf.js",
    sourceUrl: "https://github.com/mozilla/pdf.js",
    version: "6.3.289",
    license: "Apache-2.0",
    execution: "browser-worker",
    networkRequired: false,
    dataLeavesDevice: false,
    purpose: "PDF sayfalarını tarayıcıda görüntüleme"
  },
  pdflib: {
    id: "pdflib",
    name: "pdf-lib",
    source: "Hopding/pdf-lib",
    sourceUrl: "https://github.com/Hopding/pdf-lib",
    version: "1.17.1",
    license: "MIT",
    execution: "browser",
    networkRequired: false,
    dataLeavesDevice: false,
    purpose: "PDF birleştirme, sayfa çıkarma ve döndürme"
  }
};

export function getIntegration(id = "native") {
  return integrations[id] || integrations.native;
}
