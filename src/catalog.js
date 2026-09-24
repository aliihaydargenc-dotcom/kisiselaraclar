export const categories = [
  { id: "gorsel", label: "Görsel" },
  { id: "tasarim", label: "Tasarım" },
  { id: "ofis", label: "Ofis" },
  { id: "gelistirici", label: "Geliştirici" },
  { id: "veri", label: "Veri" },
  { id: "pdf", label: "PDF" },
  { id: "medya", label: "Medya" },
  { id: "ocr", label: "OCR" },
  { id: "kod", label: "QR & Barkod" },
  { id: "arsiv", label: "Arşiv" },
  { id: "metin", label: "Metin" },
  { id: "zaman", label: "Tarih & Saat" }
];

export const tools = [
  {
    id: "quick-note",
    category: "ofis",
    title: "Hızlı Not",
    description: "Başlık veya klasör zorunluluğu olmadan not al; otomatik kaydet, sabitle, kopyala veya Markdown indir.",
    aliases: ["not", "notes", "hızlı not", "memo", "checklist", "yaz"],
    inputType: "p16-office",
    officeMode: "quick-note",
    privacy: "browser",
    integration: "native"
  },
  {
    id: "meeting-notes",
    category: "ofis",
    title: "Toplantı Notu",
    description: "Notları, kararları ve aksiyonları aynı ekranda tut; aksiyonları göreve çevir ve temiz özet indir.",
    aliases: ["toplantı", "meeting", "karar", "aksiyon", "minutes", "not"],
    inputType: "p16-office",
    officeMode: "meeting-notes",
    privacy: "browser",
    integration: "native"
  },
  {
    id: "tasks-calendar",
    category: "ofis",
    title: "Görev & Takvim",
    description: "Basit görevleri tarih ve saatle tut; aylık görünümde izle ve açık tarihli işleri .ics olarak takvimine aktar.",
    aliases: ["görev", "takvim", "calendar", "todo", "ics", "hatırlatma", "plan"],
    inputType: "p16-office",
    officeMode: "tasks-calendar",
    privacy: "browser",
    integration: "native"
  },
  {
    id: "voice-note",
    category: "ofis",
    title: "Sesli Not",
    description: "Destekleyen tarayıcılarda konuşmayı metne çevir; sonucu düzenle, kopyala veya Hızlı Not'a kaydet.",
    aliases: ["ses", "dikte", "speech to text", "voice", "mikrofon", "transkript"],
    inputType: "p16-office",
    officeMode: "voice-note",
    privacy: "browser-dependent",
    integration: "native"
  },
  {
    id: "document-scan",
    category: "ofis",
    title: "Belge Tara & Temizle",
    description: "Telefon kamerası veya fotoğraftan belgeyi kırp, döndür, kontrastını düzelt; temiz PNG veya PDF çıkar.",
    aliases: ["belge tara", "scan", "kamera", "tarayıcı", "document scanner", "pdf"],
    inputType: "p16-office",
    officeMode: "document-scan",
    privacy: "browser",
    integration: "native"
  },
  {
    id: "pdf-fill-sign",
    category: "ofis",
    title: "PDF Doldur & İmzala",
    description: "PDF üzerine kısa metin, tarih ve çizdiğin imzayı yerleştir; yeni dosyayı cihazında üret.",
    aliases: ["pdf imzala", "imza", "signature", "doldur", "form", "paraf"],
    inputType: "p16-office",
    officeMode: "pdf-fill-sign",
    privacy: "browser",
    integration: "pdflib"
  },
  {
    id: "image-annotate",
    category: "ofis",
    title: "Gizle & İşaretle",
    description: "Ekran görüntüsünde hassas alanları karart veya pikselle; kutu ve ok ekleyip paylaşılabilir PNG hazırla.",
    aliases: ["ekran görüntüsü", "blur", "redact", "karart", "ok", "kutu", "annotate"],
    inputType: "p16-office",
    officeMode: "image-annotate",
    privacy: "browser",
    integration: "image-native"
  },
  {
    id: "document-compare",
    category: "ofis",
    title: "Belge Karşılaştır",
    description: "İki metin veya metin katmanlı PDF'deki ekleme ve silmeleri yan yana yükleyip hızlıca bul.",
    aliases: ["belge karşılaştır", "document diff", "metin farkı", "pdf karşılaştır", "sürüm farkı"],
    inputType: "p16-office",
    officeMode: "document-compare",
    privacy: "browser",
    integration: "pdfjs"
  },
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
    id: "gradient-generator",
    category: "tasarim",
    title: "CSS Gradient Oluşturucu",
    description: "Linear veya radial gradient tasarla; canlı önizlemeden doğrudan CSS çıktısı al.",
    aliases: ["gradient", "gradyan", "css", "arka plan", "linear", "radial"],
    inputType: "design",
    designMode: "gradient",
    privacy: "browser",
    integration: "design-native"
  },
  {
    id: "shadow-generator",
    category: "tasarim",
    title: "Shadow Tasarımcısı",
    description: "Box-shadow değerlerini görsel olarak ayarla; blur, spread, yön, opaklık ve inset CSS üret.",
    aliases: ["shadow", "gölge", "box shadow", "css", "blur", "spread"],
    inputType: "design",
    designMode: "shadow",
    privacy: "browser",
    integration: "design-native"
  },
  {
    id: "contrast-checker",
    category: "tasarim",
    title: "Kontrast Kontrolü",
    description: "Metin ve arka plan renklerinin WCAG AA/AAA kontrast eşiklerini anında kontrol et.",
    aliases: ["kontrast", "wcag", "erişilebilirlik", "accessibility", "aa", "aaa", "renk"],
    inputType: "design",
    designMode: "contrast",
    privacy: "browser",
    integration: "design-native"
  },
  {
    id: "typography-scale",
    category: "tasarim",
    title: "Tipografi Ölçeği",
    description: "Temel font boyutu ve oran seç; uyumlu başlık/metin ölçülerini CSS tokenları olarak üret.",
    aliases: ["tipografi", "font", "type scale", "başlık", "rem", "css"],
    inputType: "design",
    designMode: "typography",
    privacy: "browser",
    integration: "design-native"
  },
  {
    id: "spacing-scale",
    category: "tasarim",
    title: "Spacing Sistemi",
    description: "Tek temel birimden tutarlı boşluk ölçeği ve CSS değişkenleri oluştur.",
    aliases: ["spacing", "boşluk", "padding", "margin", "grid", "token", "css"],
    inputType: "design",
    designMode: "spacing",
    privacy: "browser",
    integration: "design-native"
  },
  {
    id: "radius-scale",
    category: "tasarim",
    title: "Radius Sistemi",
    description: "Kart, buton ve yüzeyler için tutarlı border-radius token seti üret.",
    aliases: ["radius", "köşe", "border radius", "yuvarlak", "token", "css"],
    inputType: "design",
    designMode: "radius",
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
    id: "csv-profiler",
    category: "veri",
    title: "CSV Profil Analizi",
    description: "CSV dosyasının kolon tiplerini, eksikleri, benzersiz değerleri ve sayısal özetlerini çıkar.",
    aliases: ["csv", "profil", "profile", "kolon", "istatistik", "veri analizi"],
    inputType: "data-lab",
    dataMode: "profile",
    privacy: "browser",
    integration: "data-lab-native"
  },
  {
    id: "data-quality-check",
    category: "veri",
    title: "Veri Kalitesi Kontrolü",
    description: "Eksik değer, duplicate satır, karışık tip ve sabit kolon gibi temel kalite sorunlarını tara.",
    aliases: ["veri kalite", "data quality", "eksik", "duplicate", "tip", "kontrol"],
    inputType: "data-lab",
    dataMode: "quality",
    privacy: "browser",
    integration: "data-lab-native"
  },
  {
    id: "missing-values",
    category: "veri",
    title: "Eksik Değer Analizi",
    description: "Hangi kolonlarda ne kadar boş değer olduğunu adet ve oranla sırala.",
    aliases: ["eksik değer", "missing", "null", "boş", "csv", "kolon"],
    inputType: "data-lab",
    dataMode: "missing",
    privacy: "browser",
    integration: "data-lab-native"
  },
  {
    id: "duplicate-rows",
    category: "veri",
    title: "Duplicate Satır Bulucu",
    description: "Tamamen aynı CSV satırlarını grupla; tekrar sayılarını ve satır numaralarını göster.",
    aliases: ["duplicate", "tekrar", "csv", "satır", "aynı kayıt", "duplicates"],
    inputType: "data-lab",
    dataMode: "duplicates",
    privacy: "browser",
    integration: "data-lab-native"
  },
  {
    id: "csv-column-explorer",
    category: "veri",
    title: "CSV Kolon Analizi",
    description: "Tek bir kolonu seç; veri tipi, benzersiz değer, eksik oranı ve en sık değerleri incele.",
    aliases: ["csv", "kolon", "column", "frequency", "dağılım", "benzersiz"],
    inputType: "data-lab",
    dataMode: "column",
    privacy: "browser",
    integration: "data-lab-native"
  },
  {
    id: "csv-compare",
    category: "veri",
    title: "İki CSV Karşılaştır",
    description: "İki CSV'nin satır/kolon boyutlarını, eklenen-kaldırılan kolonları ve ortak satırlarını karşılaştır.",
    aliases: ["csv", "karşılaştır", "compare", "diff", "kolon farkı", "satır farkı"],
    inputType: "data-lab",
    dataMode: "compare",
    privacy: "browser",
    integration: "data-lab-native"
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
    "id": "image-palette",
    "category": "gorsel",
    "title": "Görselden Renk Paleti",
    "description": "Bir görselin baskın renklerini cihazında çıkar; HEX değerlerini kopyala veya renk sistemine aktar.",
    "aliases": [
      "görsel palet",
      "renk paleti",
      "dominant color",
      "image palette",
      "hex"
    ],
    "inputType": "p15",
    "p15Mode": "image-palette",
    "privacy": "browser",
    "integration": "native",
    "related": [
      {
        "id": "site-color-system",
        "label": "Site Renk Sistemi"
      },
      {
        "id": "color-harmony",
        "label": "Renk Armonisi"
      }
    ]
  },
  {
    "id": "image-color-picker",
    "category": "gorsel",
    "title": "Görsel Renk Seçici",
    "description": "Görsel üzerinde bir noktaya dokun; o pikselin HEX, RGB ve alfa değerini al.",
    "aliases": [
      "color picker",
      "damlalık",
      "piksel renk",
      "hex",
      "rgb"
    ],
    "inputType": "p15",
    "p15Mode": "image-color-picker",
    "privacy": "browser",
    "integration": "native",
    "related": [
      {
        "id": "color-harmony",
        "label": "Renk Armonisi"
      }
    ]
  },
  {
    "id": "svg-inspector",
    "category": "gorsel",
    "title": "SVG İncele & Temizle",
    "description": "SVG kaynak kodunu incele, riskli aktif içerikleri temizle, ölçü ve öğe özetini gör.",
    "aliases": [
      "svg",
      "svg temizle",
      "svg inspect",
      "vektör",
      "sanitize"
    ],
    "inputType": "p15",
    "p15Mode": "svg-inspector",
    "privacy": "browser",
    "integration": "native",
    "related": [
      {
        "id": "svg-to-png",
        "label": "SVG → PNG"
      }
    ]
  },
  {
    "id": "svg-to-png",
    "category": "gorsel",
    "title": "SVG → PNG",
    "description": "SVG kaynağını seçtiğin genişlikte şeffaf veya renkli arka planlı PNG'ye dönüştür.",
    "aliases": [
      "svg png",
      "svg dönüştür",
      "vector png",
      "rasterize"
    ],
    "inputType": "p15",
    "p15Mode": "svg-png",
    "privacy": "browser",
    "integration": "native",
    "related": [
      {
        "id": "favicon-pack",
        "label": "Favicon / App Icon Paketi"
      }
    ]
  },
  {
    "id": "favicon-pack",
    "category": "gorsel",
    "title": "Favicon / App Icon Paketi",
    "description": "Tek logodan 16, 32, 48, 180, 192 ve 512 px ikonları ve web manifestini ZIP olarak üret.",
    "aliases": [
      "favicon",
      "app icon",
      "ikon",
      "manifest",
      "pwa",
      "logo",
      "zip"
    ],
    "inputType": "p15",
    "p15Mode": "favicon-pack",
    "privacy": "browser",
    "integration": "fflate",
    "related": [
      {
        "id": "image-resize",
        "label": "Görsel Boyutlandır"
      }
    ]
  },
  {
    "id": "aspect-ratio",
    "category": "gorsel",
    "title": "En-Boy Oranı Hesaplayıcı",
    "description": "Genişlik ve yükseklikten sadeleştirilmiş oranı, ondalık oranı ve yönü hesapla.",
    "aliases": [
      "aspect ratio",
      "en boy",
      "oran",
      "16:9",
      "9:16",
      "4:5"
    ],
    "inputType": "p15",
    "p15Mode": "aspect-ratio",
    "privacy": "browser",
    "integration": "native",
    "related": [
      {
        "id": "image-crop",
        "label": "Görsel Kırp"
      },
      {
        "id": "image-resize",
        "label": "Görsel Boyutlandır"
      }
    ]
  },
  {
    "id": "transparency-check",
    "category": "gorsel",
    "title": "Şeffaflık Analizi",
    "description": "PNG veya WebP görselde tam şeffaf, yarı şeffaf ve opak piksellerin oranını ölç.",
    "aliases": [
      "şeffaf",
      "alpha",
      "transparency",
      "png",
      "webp",
      "opak"
    ],
    "inputType": "p15",
    "p15Mode": "transparency-check",
    "privacy": "browser",
    "integration": "native",
    "related": [
      {
        "id": "image-convert",
        "label": "Görsel Dönüştür"
      }
    ]
  },
  {
    "id": "json-diff",
    "category": "gelistirici",
    "title": "JSON Diff",
    "description": "İki JSON'u path bazında karşılaştır; eklenen, silinen ve değişen değerleri ayrı göster.",
    "aliases": [
      "json diff",
      "json karşılaştır",
      "compare json",
      "path",
      "fark"
    ],
    "inputType": "p15",
    "p15Mode": "json-diff",
    "privacy": "browser",
    "integration": "native",
    "related": [
      {
        "id": "json",
        "label": "JSON Düzenleyici"
      }
    ]
  },
  {
    "id": "regex-playground",
    "category": "gelistirici",
    "title": "Regex Playground",
    "description": "Regex pattern ve flag'leri canlı test et; eşleşmeleri ve capture group'ları gör.",
    "aliases": [
      "regex",
      "regexp",
      "regular expression",
      "pattern",
      "capture group"
    ],
    "inputType": "p15",
    "p15Mode": "regex-playground",
    "privacy": "browser",
    "integration": "native"
  },
  {
    "id": "uuid-generator",
    "category": "gelistirici",
    "title": "UUID v4 Üretici",
    "description": "Tek seferde 1-100 adet kriptografik rastgele UUID v4 üret ve kopyala.",
    "aliases": [
      "uuid",
      "guid",
      "v4",
      "random id"
    ],
    "inputType": "p15",
    "p15Mode": "uuid-generator",
    "privacy": "browser",
    "integration": "native"
  },
  {
    "id": "jwt-reader",
    "category": "gelistirici",
    "title": "JWT Payload Okuyucu",
    "description": "JWT header ve payload alanlarını cihazında aç; imza doğrulaması yapmadan içeriği incele.",
    "aliases": [
      "jwt",
      "token",
      "payload",
      "header",
      "base64url",
      "decode"
    ],
    "inputType": "p15",
    "p15Mode": "jwt-reader",
    "privacy": "browser",
    "integration": "native"
  },
  {
    "id": "markdown-html",
    "category": "gelistirici",
    "title": "Markdown → HTML",
    "description": "Markdown metnini canlı önizlemeyle güvenli temel HTML çıktısına dönüştür.",
    "aliases": [
      "markdown",
      "md",
      "html",
      "preview",
      "dönüştür"
    ],
    "inputType": "p15",
    "p15Mode": "markdown-html",
    "privacy": "browser",
    "integration": "native",
    "related": [
      {
        "id": "html-minify",
        "label": "HTML Minify"
      }
    ]
  },
  {
    "id": "html-minify",
    "category": "gelistirici",
    "title": "HTML Temizle / Minify",
    "description": "HTML yorumlarını ve gereksiz boşlukları kaldırarak daha küçük çıktı üret.",
    "aliases": [
      "html minify",
      "html küçült",
      "html temizle",
      "sıkıştır"
    ],
    "inputType": "p15",
    "p15Mode": "html-minify",
    "privacy": "browser",
    "integration": "native"
  },
  {
    "id": "css-minify",
    "category": "gelistirici",
    "title": "CSS Minify",
    "description": "CSS yorumlarını ve gereksiz boşlukları kaldırarak sıkıştırılmış CSS üret.",
    "aliases": [
      "css minify",
      "css küçült",
      "css sıkıştır",
      "minifier"
    ],
    "inputType": "p15",
    "p15Mode": "css-minify",
    "privacy": "browser",
    "integration": "native",
    "related": [
      {
        "id": "gradient-generator",
        "label": "CSS Gradient"
      },
      {
        "id": "shadow-generator",
        "label": "Shadow Tasarımcısı"
      }
    ]
  },
  {
    "id": "html-entities",
    "category": "gelistirici",
    "title": "HTML Entity Encode / Decode",
    "description": "HTML özel karakterlerini entity biçimine dönüştür veya entity değerlerini tekrar metne çevir.",
    "aliases": [
      "html entity",
      "encode html",
      "decode html",
      "escape",
      "amp",
      "lt",
      "gt"
    ],
    "inputType": "p15",
    "p15Mode": "html-entities",
    "privacy": "browser",
    "integration": "native"
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
