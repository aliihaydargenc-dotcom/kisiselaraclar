# Implementation Status

## Ürün hedefi

Türkçe-first, local-first, farklı açık kaynak motorların tek tasarım ve arama sistemi altında birleştiği kişisel araç platformu.

## Tamamlanan

- Açık kaynak araştırma kataloğu
- Entegrasyon/lisans politikası
- Türkçe varsayılan ürün yaklaşımı
- Türkçe kategori + alias tabanlı araç araması
- Local-first gizlilik göstergesi
- 7 native tarayıcı aracı
- PapaParse tabanlı CSV aracı
- GitHub Actions kalite kapısı
- Ana bundle / lazy bundle boyut bütçesi
- P3 browser-native görsel işleme çekirdeği
- ExifReader tabanlı metadata okuma
- P4 QR üretme / çok formatlı barkod okuma
- P4 ZIP / GZIP arşiv araçları
- P5 Türkçe/İngilizce local OCR
- P5 görsel ve PDF sayfasından metin çıkarma

## P2 — PDF local toolkit

Motorlar:
- PDF.js / pdfjs-dist 6.3.289 — Apache-2.0
- pdf-lib 1.17.1 — MIT

Yeni araçlar:
- PDF önizleme: ilk sayfa render + sayfa sayısı
- PDF birleştirme
- sayfa seçip yeni PDF'e çıkarma
- tüm sayfaları 90/180/270 derece döndürme

Mimari:
- PDF UI ve motorlar dinamik import ile lazy-load edilir.
- PDF.js worker Vite asset olarak yerel paketlenir; CDN kullanılmaz.
- Dosyalar tarayıcıdan dışarı gönderilmez.
- İlk güvenlik/perf sınırı: dosya başına 25 MB.
- pdf-lib fonksiyonları bellek içinde üretilen gerçek PDF fixture'larıyla test edilir.

## P3 — Görsel araçları

Motorlar:
- Web Platform Canvas / createImageBitmap / Blob API — browser-native
- ExifReader 4.45.2 — MPL-2.0

Yeni araçlar:
- sürüklenebilir alanla görsel kırpma ve oran presetleri
- en-boy oranı korumalı yeniden boyutlandırma
- kalite kontrollü WebP/JPEG sıkıştırma
- JPEG / PNG / WebP format dönüşümü
- EXIF/IPTC/XMP metadata görüntüleme
- Canvas re-encode ile metadata temizlenmiş kopya üretme

Mimari:
- Görsel UI modülü yalnız ilgili araç açıldığında lazy-load edilir.
- ExifReader yalnız metadata aracı kullanıldığında dinamik import edilir.
- Görsel dosyaları sunucuya gönderilmez.
- Dosya sınırı 30 MB, decode sonrası güvenlik sınırı 50 megapikseldir.
- Cropper.js değerlendirildi; bu aşamada ek bağımlılık yerine browser-native crop overlay seçildi.
- JPEG, PNG ve WebP düzenleme çekirdeği desteklenir.

## P4 — QR / barkod + arşiv

Motorlar:
- qrcode-generator 2.0.4 — MIT
- @zxing/browser 0.2.1 + @zxing/library 0.23.0 — MIT / Apache-2.0
- fflate 0.8.3 — MIT

Yeni araçlar:
- metin/URL → SVG QR kod üretme
- JPEG/PNG/WebP görselden QR ve yaygın 1D/2D barkodları okuma
- çoklu dosyadan ZIP oluşturma
- ZIP merkez dizinini önce inceleyip güvenli biçimde çıkarma
- tek dosya için GZIP sıkıştırma / açma

Güvenlik ve mimari:
- Kod ve arşiv UI modülleri ilgili araç açılana kadar lazy-load edilir.
- QR/barkod görselleri ve arşiv dosyaları sunucuya gönderilmez.
- ZIP oluşturma: dosya başına 100 MB, toplam 150 MB, en fazla 1000 giriş.
- ZIP çıkarma: merkez dizininden açılmış boyut ön kontrolü; toplam 300 MB üstü reddedilir.
- ZIP64 bu sürümde bilinçli olarak reddedilir.
- Arşiv yollarında ../ ve mutlak yol parçaları temizlenir.
- GZIP trailer ISIZE alanı açmadan önce kontrol edilir.
- ZXing yalnız tarama aracı çalıştırıldığında yüklenir.

## P5 — OCR + belge/görsel metin

Motorlar:
- Tesseract.js 7.0.0 — Apache-2.0
- tesseract.js-core 7.0.0 — Apache-2.0
- @tesseract.js-data/tur 1.0.0 — MIT
- @tesseract.js-data/eng 1.0.0 — MIT
- PDF.js 6.3.289 — PDF sayfasını OCR öncesi Canvas'a render etmek için

Yeni araçlar:
- JPEG/PNG/WebP görselden Türkçe, İngilizce veya Türkçe+İngilizce metin çıkarma
- PDF içinden seçili tek sayfayı render edip OCR ile metin çıkarma
- OCR ilerleme yüzdesi
- OCR güven skoru, kelime/karakter sayısı
- düzenlenebilir sonuç, kopyalama ve TXT indirme

Local-first mimari:
- Tesseract worker, tüm WASM core varyantları ve tur/eng traineddata build sırasında `public/ocr` altına kopyalanır.
- Tesseract.js hiçbir üçüncü taraf CDN'e ihtiyaç duymaz.
- Görsel/PDF verisi hiçbir sunucu API'sine gönderilmez.
- OCR yalnız kullanıcı araç ekranında işlemi başlattığında yüklenir.
- Görsel sınırı 20 MB, PDF sınırı 25 MB, PDF render üst sınırı 18 megapikseldir.
- OCR runtime varlıkları ana uygulama JS bütçesinden ayrı, açıkça izlenen 40 MB runtime bütçesine tabidir.

## Release readiness — ürünleştirme paketi

Amaç yeni araç eklemek değil, P1-P5 çekirdeğinin gerçek ürün olarak kullanılabilirliğini doğrulamak.

Eklenenler:
- URL hash ile doğrudan araç linkleme (`#tool=<id>`)
- son kullanılanlara göre kişiselleşen hızlı erişim
- tüm mevcut `.file-drop` alanlarına ortak drag & drop davranışı
- `/` arama kısayolu ve Escape ile araçtan çıkış
- lazy tool açılışında loading/error state
- mobil kategori satırını yatay kaydırılabilir kompakt yapıya çevirme
- focus-visible ve reduced-motion erişilebilirlik desteği
- Vercel production build ve güvenlik header yapılandırması
- release smoke test checklist'i

## Sıradaki anlamlı paket

**P6 — GitHub Pages production release + gerçek dosya smoke testleri**

Medya araçları production doğrulamasından sonraya ertelendi.

## Backlog

- Faker: Türkçe sahte veri üretici
- Hoppscotch'tan ilhamla sade API istek test aracı
- public-apis: yeni ücretsiz veri kaynakları için keşif kataloğu
- medya: Mediabunny, gerektiğinde FFmpeg WASM fallback

## Release

Kod tabanı release-readiness aşamasındadır. `docs/RELEASE_CHECKLIST.md` kritik kullanıcı akışlarını tanımlar. GitHub Pages deploy workflow'u production hattıdır; ilk Pages etkinleştirmesinden sonra main push'ları otomatik yayınlanır.


## Hosting stratejisi

- Birincil ücretsiz static hosting: GitHub Pages
- Build/deploy: GitHub Actions
- Pages base path: `/kisiselaraclar/`
- Root-domain hosting uyumluluğu korunur: varsayılan Vite base `/`
- Vercel ve Railway zorunlu değildir; yalnız ikincil/fallback seçeneklerdir.
