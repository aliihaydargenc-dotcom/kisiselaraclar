export const categories = [
  { id: "kod", label: "QR & Barkod" },
  { id: "arsiv", label: "Arşiv" },
  { id: "gorsel", label: "Görsel" },
  { id: "pdf", label: "PDF" },
  { id: "metin", label: "Metin" },
  { id: "veri", label: "Veri" },
  { id: "gelistirici", label: "Geliştirici" },
  { id: "zaman", label: "Tarih & Saat" }
];

export const tools = [
  {
    id: "qr-generate",
    category: "kod",
    title: "QR Kod Oluştur",
    description: "Metin, bağlantı veya kısa bilgiden cihazında indirilebilir QR kod üret.",
    aliases: ["qr", "qrcode", "kod", "oluştur", "üret", "link", "bağlantı"],
    inputType: "code",
    codeMode: "generate",
    privacy: "browser",
    integration: "qrcode-generator"
  },
  {
    id: "barcode-scan",
    category: "kod",
    title: "QR / Barkod Oku",
    description: "Bir görseldeki QR, EAN, UPC, Code 128 ve diğer yaygın barkodları cihazında çöz.",
    aliases: ["qr", "barkod", "barcode", "ean", "upc", "code128", "tara", "oku", "scan"],
    inputType: "code",
    codeMode: "scan",
    privacy: "browser",
    integration: "zxing-browser"
  },
  {
    id: "zip-create",
    category: "arsiv",
    title: "ZIP Oluştur",
    description: "Birden fazla dosyayı tarayıcıda tek ZIP arşivine dönüştür.",
    aliases: ["zip", "arşiv", "arsiv", "sıkıştır", "paketle", "dosya"],
    inputType: "archive",
    archiveMode: "zip-create",
    privacy: "browser",
    integration: "fflate"
  },
  {
    id: "zip-extract",
    category: "arsiv",
    title: "ZIP Aç / Çıkart",
    description: "ZIP içeriğini cihazında incele ve içindeki dosyaları tek tek indir.",
    aliases: ["zip", "arşiv", "arsiv", "aç", "çıkar", "extract", "unzip"],
    inputType: "archive",
    archiveMode: "zip-extract",
    privacy: "browser",
    integration: "fflate"
  },
  {
    id: "gzip",
    category: "arsiv",
    title: "GZIP Sıkıştır / Aç",
    description: "Tek bir dosyayı .gz biçiminde sıkıştır veya GZIP dosyasını aç.",
    aliases: ["gzip", "gz", "sıkıştır", "aç", "gunzip", "compress", "decompress"],
    inputType: "archive",
    archiveMode: "gzip",
    privacy: "browser",
    integration: "fflate"
  },
  {
    id: "image-crop",
    category: "gorsel",
    title: "Görsel Kırp",
    description: "Fotoğrafı cihazında aç, kırpma alanını sürükleyip boyutlandır ve yeni görseli indir.",
    aliases: ["görsel", "resim", "fotoğraf", "kırp", "crop", "kes", "oran"],
    inputType: "image",
    imageMode: "crop",
    privacy: "browser",
    integration: "image-native"
  },
  {
    id: "image-resize",
    category: "gorsel",
    title: "Görsel Boyutlandır",
    description: "Görselin piksel ölçülerini en-boy oranını koruyarak veya serbestçe değiştir.",
    aliases: ["görsel", "resim", "fotoğraf", "boyut", "resize", "piksel", "genişlik", "yükseklik"],
    inputType: "image",
    imageMode: "resize",
    privacy: "browser",
    integration: "image-native"
  },
  {
    id: "image-compress",
    category: "gorsel",
    title: "Görsel Sıkıştır",
    description: "JPEG veya WebP kalite seviyesini ayarla; dosya boyutunu cihazında küçült.",
    aliases: ["görsel", "resim", "fotoğraf", "sıkıştır", "compress", "küçült", "kalite", "webp", "jpeg"],
    inputType: "image",
    imageMode: "compress",
    privacy: "browser",
    integration: "image-native"
  },
  {
    id: "image-convert",
    category: "gorsel",
    title: "Görsel Format Dönüştür",
    description: "JPEG, PNG ve WebP arasında tarayıcı içinde dönüşüm yap.",
    aliases: ["görsel", "resim", "fotoğraf", "dönüştür", "convert", "format", "webp", "jpeg", "png"],
    inputType: "image",
    imageMode: "convert",
    privacy: "browser",
    integration: "image-native"
  },
  {
    id: "image-metadata",
    category: "gorsel",
    title: "EXIF / Metadata",
    description: "Fotoğraf metadata alanlarını görüntüle; istersen metadata içermeyen yeni bir kopya üret.",
    aliases: ["görsel", "fotoğraf", "exif", "metadata", "gps", "konum", "temizle", "sil"],
    inputType: "image",
    imageMode: "metadata",
    privacy: "browser",
    integration: "exifreader"
  },
  {
    id: "pdf-preview",
    category: "pdf",
    title: "PDF Önizleme",
    description: "PDF dosyasını yükle, sayfa sayısını gör ve ilk sayfayı cihazında önizle.",
    aliases: ["pdf", "görüntüle", "önizle", "sayfa", "viewer"],
    inputType: "pdf",
    pdfMode: "preview",
    privacy: "browser",
    integration: "pdfjs"
  },
  {
    id: "pdf-merge",
    category: "pdf",
    title: "PDF Birleştir",
    description: "Birden fazla PDF dosyasını seçtiğin sırayla tek PDF haline getir.",
    aliases: ["pdf", "birleştir", "merge", "join", "dosya"],
    inputType: "pdf",
    pdfMode: "merge",
    privacy: "browser",
    integration: "pdflib"
  },
  {
    id: "pdf-extract",
    category: "pdf",
    title: "PDF Sayfa Çıkar",
    description: "PDF içinden istediğin sayfaları seçip yeni bir PDF olarak kaydet.",
    aliases: ["pdf", "böl", "split", "sayfa", "çıkar", "ayır"],
    inputType: "pdf",
    pdfMode: "extract",
    privacy: "browser",
    integration: "pdflib"
  },
  {
    id: "pdf-rotate",
    category: "pdf",
    title: "PDF Döndür",
    description: "PDF sayfalarını 90°, 180° veya 270° döndür ve yeni dosyayı indir.",
    aliases: ["pdf", "döndür", "rotate", "90", "180", "270"],
    inputType: "pdf",
    pdfMode: "rotate",
    privacy: "browser",
    integration: "pdflib"
  },
  {
    id: "base64",
    category: "gelistirici",
    title: "Base64 Dönüştürücü",
    description: "Metni Base64 biçimine çevir veya Base64 verisini çöz.",
    aliases: ["base64", "b64", "kodla", "çöz", "decode", "encode"],
    inputLabel: "Metin / Base64",
    actions: [
      { id: "encodeBase64", label: "Base64'e çevir" },
      { id: "decodeBase64", label: "Base64 çöz" }
    ],
    privacy: "browser",
    integration: "native"
  },
  {
    id: "url",
    category: "gelistirici",
    title: "URL Kodlayıcı",
    description: "URL içeriğini güvenli biçimde encode/decode et.",
    aliases: ["url", "uri", "encode", "decode", "adres"],
    inputLabel: "URL veya metin",
    actions: [
      { id: "encodeUrl", label: "URL kodla" },
      { id: "decodeUrl", label: "URL çöz" }
    ],
    privacy: "browser",
    integration: "native"
  },
  {
    id: "json",
    category: "veri",
    title: "JSON Düzenleyici",
    description: "JSON verisini doğrula, düzenle ve okunabilir hale getir.",
    aliases: ["json", "format", "pretty", "validate", "doğrula"],
    inputLabel: "JSON",
    actions: [
      { id: "formatJson", label: "Düzenle ve doğrula" },
      { id: "minifyJson", label: "Sıkıştır" }
    ],
    privacy: "browser",
    integration: "native"
  },
  {
    id: "csv-json",
    category: "veri",
    title: "CSV Görüntüle ve JSON'a Dönüştür",
    description: "CSV dosyasını cihazında aç, ayırıcıyı otomatik algıla, tabloyu önizle ve JSON çıktısı üret.",
    aliases: ["csv", "json", "excel", "virgül", "ayraç", "delimiter", "tablo", "dönüştür"],
    inputLabel: "CSV içeriği",
    inputType: "csv-file",
    actions: [
      { id: "previewCsv", label: "Tabloyu önizle" },
      { id: "csvToJson", label: "JSON'a dönüştür" }
    ],
    privacy: "browser",
    integration: "papaparse"
  },
  {
    id: "duplicates",
    category: "metin",
    title: "Tekrarlanan Satırları Sil",
    description: "Metindeki yinelenen satırları ilk sıralamayı koruyarak kaldır.",
    aliases: ["duplicate", "tekrar", "satır", "benzersiz", "unique"],
    inputLabel: "Satırlar",
    actions: [{ id: "removeDuplicateLines", label: "Tekrarları kaldır" }],
    privacy: "browser",
    integration: "native"
  },
  {
    id: "text-stats",
    category: "metin",
    title: "Metin İstatistikleri",
    description: "Karakter, kelime, satır ve yaklaşık okuma süresini hesapla.",
    aliases: ["kelime", "karakter", "istatistik", "word count", "say"],
    inputLabel: "Metin",
    actions: [{ id: "textStats", label: "Hesapla" }],
    privacy: "browser",
    integration: "native"
  },
  {
    id: "sha256",
    category: "gelistirici",
    title: "SHA-256 Özeti",
    description: "Metnin SHA-256 özetini tarayıcıda hesapla.",
    aliases: ["hash", "sha", "sha256", "özet", "checksum"],
    inputLabel: "Metin",
    actions: [{ id: "sha256", label: "SHA-256 hesapla" }],
    privacy: "browser",
    integration: "native"
  },
  {
    id: "unix-time",
    category: "zaman",
    title: "Unix Zaman Dönüştürücü",
    description: "Unix timestamp ile okunabilir tarih arasında dönüşüm yap.",
    aliases: ["unix", "timestamp", "epoch", "tarih", "saat"],
    inputLabel: "Unix timestamp veya tarih",
    actions: [
      { id: "unixToDate", label: "Unix → tarih" },
      { id: "dateToUnix", label: "Tarih → Unix" }
    ],
    privacy: "browser",
    integration: "native"
  }
];

export function normalizeSearch(value) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

export function searchTools(query, category = "all") {
  const q = normalizeSearch(query);
  return tools.filter((tool) => {
    if (category !== "all" && tool.category !== category) return false;
    if (!q) return true;
    const haystack = normalizeSearch(
      [tool.title, tool.description, ...(tool.aliases || [])].join(" ")
    );
    return q.split(/\s+/).every((token) => haystack.includes(token));
  });
}
