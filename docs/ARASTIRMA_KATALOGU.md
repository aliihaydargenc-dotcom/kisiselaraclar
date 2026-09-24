# Araştırma Kataloğu

Tarih: 24 Eylül 2026

Amaç: Kişisel Araçlar ürününe sıfırdan yeniden yazmak yerine güvenilir açık kaynak bileşenlerden yetenek kazandırmak. Bu belge lisans hukuku danışmanlığı değildir; entegrasyon öncesi teknik/lisans kontrol kaydıdır.

## Değerlendirme ölçütleri

1. Güncel bakım ve proje canlılığı
2. Lisansın bütünleşik ürün için uygunluğu
3. Tarayıcıda/client-side çalışabilme
4. Dosyanın cihazdan çıkmaması
5. Mobil tarayıcı uyumluluğu
6. Bundle/WASM boyutu ve lazy-load imkânı
7. Türkçeleştirme maliyeti
8. Mevcut araçlarla çakışma
9. Harici hesap/API/marka bağımlılığı
10. Test edilebilirlik

## A — Doğrudan entegrasyon için güçlü adaylar

| Kaynak | Alan | Lisans | Güncellik / sinyal | Karar |
|---|---|---|---|---|
| [iib0011/omni-tools](https://github.com/iib0011/omni-tools) | Genel araç mimarisi | MIT | Aktif, 10k+ yıldız | **Ana referans / seçici donor.** React+TS, modüler araç tanımı, i18next, Vitest+Playwright. Yaklaşık 128 araç klasörü. Türkçe locale yok; eklenebilir. Tüm bağımlılıklar ayrıca denetlenmeli. |
| [Vanilagy/mediabunny](https://github.com/Vanilagy/mediabunny) | Video / ses | MPL-2.0 | Çok aktif, 7k+ yıldız | **Yüksek öncelik.** Saf TypeScript, zero-dependency, tree-shakable, WebCodecs tabanlı. FFmpeg WASM'a göre birçok işte daha hafif başlangıç noktası. |
| [mozilla/pdf.js](https://github.com/mozilla/pdf.js) | PDF görüntüleme | Apache-2.0 | Çok aktif, 50k+ yıldız | **PDF render çekirdeği için güçlü aday.** PDF düzenleme değil, görüntüleme/önizleme için. |
| [Hopding/pdf-lib](https://github.com/Hopding/pdf-lib) | PDF oluşturma/değiştirme | MIT | Yaygın; son kod hareketi daha eski | **Koşullu güçlü aday.** Birleştirme, bölme, döndürme vb. için uygun; bakım temposu ayrıca izlenmeli. |
| [mholt/PapaParse](https://github.com/mholt/PapaParse) | CSV | MIT | Aktif, 13k+ yıldız | **Doğrudan uygun.** Büyük/bozuk CSV'lerde olgun parser. |
| [josdejong/jsoneditor](https://github.com/josdejong/jsoneditor) | JSON | Apache-2.0 | Aktif, 12k+ yıldız | **JSON düzenleme/görselleştirme için güçlü aday.** |
| [ajv-validator/ajv](https://github.com/ajv-validator/ajv) | JSON Schema | MIT | Aktif, 14k+ yıldız | **JSON doğrulama için güçlü aday.** |
| [josdejong/mathjs](https://github.com/josdejong/mathjs) | Matematik | Apache-2.0 | Aktif, 15k+ yıldız | **Hesaplayıcı/dönüştürücü altyapısı için uygun.** |
| [fengyuanchen/cropperjs](https://github.com/fengyuanchen/cropperjs) | Görsel kırpma | MIT | Aktif, 13k+ yıldız | **Görsel araçları için uygun.** |
| [naptha/tesseract.js](https://github.com/naptha/tesseract.js) | OCR | Apache-2.0 | Aktif, 38k+ yıldız | **OCR için güçlü aday.** Dil modeli yükleme/boyut stratejisi ayrıca tasarlanmalı; Türkçe OCR desteği ürün testi gerektirir. |
| [gildas-lormeau/zip.js](https://github.com/gildas-lormeau/zip.js) | ZIP/arşiv | BSD-3-Clause | Çok aktif | **Gelişmiş ZIP için uygun.** Streams, zip64, şifreleme gibi yetenekleri var. |
| [101arrowz/fflate](https://github.com/101arrowz/fflate) | Sıkıştırma | MIT | Aktif | **Küçük ve hızlı alternatif.** Basit ZIP/deflate işleri için zip.js'den daha hafif olabilir. |
| [mattiasw/ExifReader](https://github.com/mattiasw/ExifReader) | EXIF metadata | MPL-2.0 | Aktif | **Metadata görüntüleme için uygun.** |
| [zxing-js/browser](https://github.com/zxing-js/browser) | QR/barkod okuma | MIT | Aktif | **Kamera/dosya üzerinden barkod-QR okuma için uygun.** |
| [soldair/node-qrcode](https://github.com/soldair/node-qrcode) | QR üretme | MIT | Olgun | **QR üretiminde uygun; bakım temposu izlenecek.** |
| [duckdb/duckdb-wasm](https://github.com/duckdb/duckdb-wasm) | Yerel veri sorgulama | MIT | Aktif | **İleri seviye veri araçları için aday.** Basit kullanıcı araçlarında gereksiz ağır olabilir; yalnız gerektiğinde lazy-load. |
| [catamphetamine/libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) | Telefon numarası | MIT | Aktif | **Telefon biçimlendirme/doğrulama araçları için uygun.** |
| [validatorjs/validator.js](https://github.com/validatorjs/validator.js) | Metin doğrulama | MIT | Aktif | **E-posta/URL/IP vb. yardımcı araçlar için uygun.** |
| [Evercoder/culori](https://github.com/Evercoder/culori) | Renk | MIT | Aktif | **Renk dönüştürme/kontrast araçları için uygun.** |
| [ai/nanoid](https://github.com/ai/nanoid) | Kimlik üretimi | MIT | Aktif | **UUID-benzeri üreticiler için küçük yardımcı.** |

## B — Koşullu / dikkatli kullanılacak adaylar

| Kaynak | Neden dikkat? |
|---|---|
| [ffmpegwasm/ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) | MIT ve güçlü; ancak WASM çekirdeği ağır, ilk yük/bellek maliyeti yüksek. Mediabunny'nin yapamadığı codec/işler için fallback olarak düşünülmeli. |
| [Donaldcwl/browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) | MIT ve kullanışlı; son kaynak hareketi daha eski. Basit sıkıştırmada Canvas/WebCodecs ile native çözüm de değerlendirilmeli. |
| [SheetJS/sheetjs](https://github.com/SheetJS/sheetjs) | GitHub aynası eski; aktif geliştirme başka hosta taşınmış. Sürüm/lisans/dağıtım kaynağı entegrasyon anında ayrıca doğrulanmalı. |
| [markdown-it/markdown-it](https://github.com/markdown-it/markdown-it) | MIT, aktif ve iyi; yalnız gerçekten Markdown araçları eklenirse alınmalı. |
| [sql-js/sql.js](https://github.com/sql-js/sql.js) | Tarayıcı SQLite için güçlü; genel kullanıcı araçlarında maliyet/fayda düşük olabilir. |
| [mebjas/html5-qrcode](https://github.com/mebjas/html5-qrcode) | Apache-2.0 ve olgun; ZXing browser ile işlev çakışıyor. İkisini birden taşımamak gerekir. |
| [heic-to](https://github.com/hoppergee/heic-to) ve benzeri libheif WASM çözümleri | HEIC çok değerli bir araç; fakat WASM/CSP/boyut ve libheif lisans zinciri entegrasyon sırasında ayrı denetlenmeli. |

## C — Özellik/UX referansı olarak tutulacak; doğrudan çekirdek donor değil

| Kaynak | Lisans / durum | Neden |
|---|---|---|
| [CorentinTh/it-tools](https://github.com/CorentinTh/it-tools) | GPL-3.0 | Çok güçlü UX ve araç kataloğu referansı. Kod karıştırmak ürünün lisans yükünü değiştirebilir; özellik fikri ve UX incelemesi için tut. |
| [PDFCraftTool/pdfcraft](https://github.com/PDFCraftTool/pdfcraft) | AGPL-3.0 | 90+ PDF aracı ve tamamen browser yaklaşımı çok değerli referans. AGPL nedeniyle doğrudan kod alımı ancak bilinçli lisans kararıyla. |
| [gchq/CyberChef](https://github.com/gchq/CyberChef) | Apache-2.0 | Lisans uygun fakat uygulama çok büyük ve güvenlik/veri dönüşümü odaklı. Tam uygulamayı gömmek yerine seçili operasyonlar/UX fikirleri incelenmeli. |
| [Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) | Repo API lisansı net sınıflandıramadı; büyük Java uygulaması | 90k+ yıldızlı zengin PDF özellik havuzu; mimari olarak bizim statik/local-first kabuğa doğrudan uygun değil. Özellik kataloğu referansı. |
| [SimplePDF/simplepdf-embed](https://github.com/SimplePDF/simplepdf-embed) | MIT wrapper + harici hizmet | Ücretsiz mod client-side olsa da harici iframe ve “Powered by” markası var; beyaz etiket ücretli. Çekirdek bağımsızlık ilkesine ters. |
| [imgly/background-removal-js](https://github.com/imgly/background-removal-js) | AGPL-3.0 | Kaliteli browser background removal; lisans yükü nedeniyle doğrudan çekirdeğe alınmayacak. |
| [freezer71/omne](https://github.com/freezer71/omne) | Lisans GitHub metadata'da belirsiz, çok yeni/küçük | Privacy-first yaklaşım ve 90 araç fikri ilginç; olgunluk ve lisans doğrulanmadan kod alınmaz. |

## OmniTools incelemesinden çıkan somut veri

OmniTools şu kategorilerde yaklaşık 128 araç klasörü barındırıyor:

- Görsel / PNG
- PDF
- Video
- Ses
- Metin
- Liste
- JSON
- CSV
- XML
- Sayı / hesap
- Tarih / saat
- Dönüştürücüler

Teknoloji: React + TypeScript + Vite + Material UI + i18next + Vitest + Playwright.

Önemli: OmniTools'un ana lisansı MIT olsa da package bağımlılıklarının tamamı MIT değildir. Örneğin background-removal tarafında AGPL bileşen bulunuyor; SimplePDF ise harici hizmet/marka modeli kullanıyor. Bu nedenle “repo MIT, tamamını kopyala” yaklaşımı uygulanmayacak.

Türkçe locale mevcut değil. Ancak namespace tabanlı i18next yapısı Türkçeyi ilk sınıf dil olarak eklemeye uygun.

## İlk ürün dalgası önerisi

İlk sürümde yüzlerce aracı birden taşımak yerine şu 6 dikeyle başlanmalı:

1. **PDF:** birleştir, böl, döndür, sayfa çıkar, görsele çevir
2. **Görsel:** sıkıştır, boyutlandır, kırp, format dönüştür, metadata görüntüle/sil
3. **Medya:** video/ses metadata, kırpma, basit format dönüştürme
4. **Veri:** CSV görüntüle/dönüştür, JSON düzenle/doğrula, JSON↔CSV
5. **Metin & geliştirici:** Base64, URL encode/decode, hash, UUID/NanoID, diff, regex yardımcıları
6. **QR/barkod:** üret, oku

İkinci dalga: OCR, HEIC, arşiv, renk araçları, tarih/saat, gelişmiş veri sorgulama.

## Türkçe ürün kuralı

- Varsayılan dil `tr`.
- Araç adları yalnız çevrilmiş başlık değil, Türk kullanıcının aradığı kelimeleri de içermeli: ör. “PDF birleştir”, “resim küçült”, “fotoğraf sıkıştır”, “JSON düzenle”.
- Teknik terimin yerleşik Türkçesi yoksa Türkçe açıklama + teknik terim birlikte kullanılmalı.
- Hata/izin/işlem durumları Türkçe olacak.
- Kaynak kütüphanenin İngilizce UI'si doğrudan iframe ile gösterilmeyecek; mümkün olduğunca kendi Türkçe kabuğumuz kullanılacak.
- İleride İngilizce eklenebilir; Türkçe ikincil dil olmayacak.

## Henüz yapılmayanlar

- Vercel projesi oluşturulmadı.
- Production deploy yapılmadı.
- Üçüncü taraf repo topluca kopyalanmadı.
- Lisansı belirsiz kod alınmadı.
- Tasarım sistemi ve uygulama framework'ü nihai olarak seçilmedi.
