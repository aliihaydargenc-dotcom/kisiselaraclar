export const categories = [
  { id: "medya", label: "Medya" },
  { id: "ocr", label: "OCR" },
  { id: "kod", label: "QR & Barkod" },
  { id: "arsiv", label: "Arşiv" },
  { id: "gorsel", label: "Görsel" },
  { id: "tasarim", label: "Tasarım" },
  { id: "pdf", label: "PDF" },
  { id: "metin", label: "Metin" },
  { id: "veri", label: "Veri" },
  { id: "gelistirici", label: "Geliştirici" },
  { id: "zaman", label: "Tarih & Saat" }
];

export const tools = [
  {
    id: "media-info",
    category: "medya",
    title: "Medya Bilgisi & Önizleme",
    description: "Ses veya videonun süre, codec, çözünürlük, track ve metadata bilgilerini cihazında incele.",
    aliases: ["medya", "video", "ses", "audio", "codec", "süre", "çözünürlük", "metadata", "önizle"],
    inputType: "media",
    mediaMode: "info",
    privacy: "browser",
    integration: "mediabunny"
  },
  {
    id: "media-trim",
    category: "medya",
    title: "Ses / Video Kırp",
    description: "Ses veya videodan başlangıç ve bitiş saniyesini seç; cihazında yeni medya dosyası üret.",
    aliases: ["medya", "video", "ses", "kırp", "kes", "trim", "başlangıç", "bitiş", "mp4", "mp3"],
    inputType: "media",
    mediaMode: "trim",
    privacy: "browser",
    integration: "mediabunny"
  },
  {
    id: "media-convert",
    category: "medya",
    title: "Medya Dönüştür",
    description: "Ses/video dosyasını MP4, WebM, MP3 veya WAV biçimine dönüştür; videoyu istersen küçült.",
    aliases: ["medya", "video", "ses", "convert", "dönüştür", "mp4", "webm", "mp3", "wav", "küçült"],
    inputType: "media",
    mediaMode: "convert",
    privacy: "browser",
    integration: "mediabunny"
  },
  {
    id: "ocr-image",
    category: "ocr",
    title: "Görselden Metin Çıkar",
    description: "Fotoğraf, ekran görüntüsü veya taramadan Türkçe/İngilizce metni cihazında OCR ile çıkar.",
    aliases: ["ocr", "görsel", "fotoğraf", "ekran görüntüsü", "metin", "yazı", "tara", "scan"],
    inputType: "ocr",
    ocrMode: "image",
    privacy: "browser",
    integration: "tesseractjs"
  },
  {
    id: "ocr-pdf-page",
    category: "ocr",
    title: "PDF Sayfasından Metin Çıkar",
    description: "PDF içinden bir sayfayı cihazında render et ve o sayfadaki metni OCR ile çıkar.",
    aliases: ["ocr", "pdf", "sayfa", "metin", "yazı", "belge", "tara", "scan"],
    inputType: "ocr",
    ocrMode: "pdf",
    privacy: "browser",
    integration: "tesseractjs"
  },
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
    id: "pdf-to-images",
    category: "pdf",
    title: "PDF Sayfalarını Görsele Dönüştür",
    description: "PDF içindeki seçili sayfaları cihazında PNG veya JPEG'e dönüştür ve tek ZIP olarak indir.",
    aliases: ["pdf", "jpg", "jpeg", "png", "görsel", "resim", "sayfa", "dönüştür", "convert"],
    inputType: "pdf",
    pdfMode: "to-images",
    privacy: "browser",
    integration: "pdfjs"
  },
  {
    id: "images-to-pdf",
    category: "pdf",
    title: "Görsellerden PDF Oluştur",
    description: "JPEG, PNG veya WebP görselleri seçim sırasıyla A4 sayfalara yerleştirip tek PDF oluştur.",
    aliases: ["jpg", "jpeg", "png", "webp", "görsel", "resim", "fotoğraf", "pdf", "dönüştür"],
    inputType: "pdf",
    pdfMode: "from-images",
    privacy: "browser",
    integration: "pdflib"
  },
  {
    id: "color-harmony",
    category: "tasarim",
    title: "Renk Armonisi",
    description: "Bir başlangıç renginden analog, tamamlayıcı, üçlü, dörtlü veya monokrom palet üret.",
    aliases: ["renk", "palet", "uyum", "armoni", "analog", "tamamlayıcı", "triadic", "monokrom", "color palette"],
    inputType: "design",
    designMode: "palette",
    privacy: "browser",
    integration: "design-native"
  },
  {
    id: "site-color-system",
    category: "tasarim",
    title: "Site Renk Sistemi",
    description: "Tek vurgu renginden açık/koyu site teması, semantik tokenlar ve kontrast kontrolleri üret.",
    aliases: ["site", "tema", "renk", "token", "palette", "light", "dark", "kontrast", "css variables"],
    inputType: "design",
    designMode: "site-theme",
    privacy: "browser",
    integration: "design-native"
  },
  {
    id: "web-button-designer",
    category: "tasarim",
    title: "Web Buton Tasarımcısı",
    description: "Web için buton rengini, stilini, köşesini ve ölçülerini canlı önizleyip HTML/CSS üret.",
    aliases: ["buton", "button", "web", "css", "html", "cta", "hover", "radius"],
    inputType: "design",
    designMode: "web-button",
    privacy: "browser",
    integration: "design-native"
  },
  {
    id: "mobile-button-designer",
    category: "tasarim",
    title: "Mobil Buton Tasarımcısı",
    description: "Mobil dokunma hedeflerini denetleyen buton tasarla; telefon önizlemesi ve HTML/CSS çıktısı al.",
    aliases: ["mobil", "buton", "button", "touch", "48px", "wcag", "css", "cta"],
    inputType: "design",
    designMode: "mobile-button",
    privacy: "browser",
    integration: "design-native"
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
