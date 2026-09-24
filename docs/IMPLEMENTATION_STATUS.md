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


## P6 — Akıllı Dosya Yönlendirici

Amaç katalogdan araç arama zorunluluğunu azaltmak ve ürünün local-first avantajını doğrudan ana kullanım akışına taşımaktır.

- ana sayfada tek/çoklu dosya seçme ve sürükle-bırak
- MIME/uzantı tabanlı tamamen local dosya sınıflandırma
- PDF, görsel, CSV, ZIP ve GZIP için bağlama uygun araç önerileri
- çoklu PDF için PDF Birleştir önceliği
- karışık çoklu seçimde ZIP Oluştur güvenli fallback'i
- önerilen araca dosyayı bellekte taşıma; destekleyen tarayıcılarda input'a otomatik aktarma
- dosya içeriğini öneri üretmek için okumama
- otomatik aktarımı desteklemeyen tarayıcılar için açık kullanıcı mesajı


## P7 — PDF ↔ Görsel Dönüşüm Köprüsü

Yeni araçlar:
- PDF Sayfalarını Görsele Dönüştür
- Görsellerden PDF Oluştur

Davranış:
- PDF → PNG/JPEG: seçili sayfalar, en fazla 40 sayfa, 1200/1600/2000 px hedef genişlik, ZIP çıktı
- Görsel → PDF: JPEG/PNG/WebP, en fazla 30 görsel ve 120 MB toplam giriş
- WebP ve EXIF yönlü görseller Canvas üzerinden normalize edilerek PDF'e gömülür
- A4 sayfa yönü görsel yönüne göre otomatik seçilir; en-boy oranı korunur
- Akıllı dosya yönlendirici tek PDF, tek görsel ve çoklu görsel seçimlerinde bu akışları önerir
- Yeni bağımlılık veya sunucu API'si eklenmez


## P8 — Yerel medya araçları

Motor:
- Mediabunny 1.59.1 — MPL-2.0
- WebCodecs destekli tarayıcı içi decode/encode; sunucu API'si yok

Yeni araçlar:
- Medya Bilgisi & Önizleme
- Ses / Video Kırp
- Medya Dönüştür

Davranış:
- MP4, MOV, WebM, MKV, MP3, WAV, M4A, AAC, FLAC, OGG/Opus gibi yaygın kapsayıcıları okuma
- süre, codec, track, çözünürlük, kanal, sample-rate ve temel metadata görüntüleme
- başlangıç/bitiş saniyesi ile kırpma
- MP4 / WebM / MP3 / WAV hedefleri
- MP3/WAV çıktısında video track'ini bilinçli atma
- video dönüşümünde orijinal / 1920 / 1280 / 854 px genişlik seçenekleri
- dönüştürme başlamadan önce tarayıcının decode/encode yeteneğini doğrulama
- conversion/kırpma için 100 MB giriş sınırı; metadata için 750 MB
- akıllı dosya yönlendiricide ses/video algılama

Mimari:
- `media-ui.js` yalnız medya aracı açıldığında lazy-load edilir.
- Mediabunny yalnız medya modülü gerektiğinde yüklenir.
- FFmpeg.wasm ana bağımlılık yapılmadı; daha ağır WASM fallback ileride yalnız gerçek codec açığı kanıtlanırsa değerlendirilecek.


## P9 — UX / tasarım yenilemesi

Amaç yeni araç eklemek değil, 29 araçlık ürünün görsel yükünü azaltmak ve kullanım hiyerarşisini sadeleştirmektir.

Ana kararlar:
- desktop araç kataloğu 3 sütundan 2 sütuna düşürüldü
- sidebar kart görünümünden çıkarılıp sade navigasyona dönüştürüldü
- hızlı erişim kompakt yatay şerit oldu
- akıllı dosya yönlendirici ana başlangıç noktası olarak daha belirgin, fakat daha az metinli hale geldi
- kartlardan motor/entegrasyon etiketi kaldırıldı; teknik ayrıntı araç içinde kaldı
- tool ekranının büyük beyaz panel kabuğu kaldırıldı
- border, shadow, badge ve bilgi kutusu yoğunluğu azaltıldı
- input, dropzone, sonuç ve durum yüzeyleri ortak token sistemiyle birleştirildi
- mobil kategori navigasyonu yatay pill yapısına dönüştürüldü
- reduced-motion korunarak çok hafif giriş animasyonu eklendi

Tasarım yönü:
- açık, sakin, düşük kontrastlı yüzey hiyerarşisi
- yalnız ana aksiyonlarda güçlü koyu kontrast
- teknik bilgiyi geri planda tutma
- araç işlevini ve dosya akışını ön plana çıkarma


## Site shell redesign

P9 sonrasında ürünün hâlâ dashboard hissi vermesi nedeniyle ana bilgi mimarisi yeniden kuruldu.

- desktop sidebar tamamen kaldırıldı
- sticky marka/navigasyon header eklendi
- gerçek landing hero ve ürün showcase alanı eklendi
- araç arama + kategori filtresi ana katalog üst çubuğuna taşındı
- smart router iki kolonlu ana CTA yüzeyine dönüştürüldü
- desktop araç kataloğu site düzeninde 3 sütunlu keşif gridine geçti
- "Nasıl çalışır?" / güven anlatısı için editorial alt bölüm eklendi
- footer eklendi
- araç açıldığında landing, katalog toolbar ve tanıtım blokları gizlenerek odaklı tool-page modu kullanılır
- mobilde aynı yapı tek sütunda, sabit marka header ile çalışır


## P10 — Mobil UX

Mobil görünüm masaüstü layout'un küçültülmüş hali olmaktan çıkarıldı.

- safe-area uyumlu sabit alt hızlı işlem dock'u: Dosya seç / Ara
- hero mobilde daha kısa, tek aksiyonlu ve daha kompakt showcase yapısında
- arama 48 px dokunma alanına çıkarıldı
- kategori filtreleri yatay scroll-snap chip yapısına geçirildi
- smart router mobilde daha kısa ve dokunma odaklı hale getirildi
- hızlı erişim tam yatay swipe şeridine dönüştürüldü
- araç kataloğu mobilde kart grid yerine sınırlarla ayrılmış liste düzenine geçti
- tool sayfalarında başlık, metadata, dosya seçici, input ve sonuç alanları mobil için sıkılaştırıldı
- aksiyon butonları 48 px dokunma hedefi ve iki kolon/tek kolon davranışı aldı
- native file picker butonu mobil tasarım diliyle eşlendi
- 390 px altı ekranlar için ek yoğunluk düzenlemesi yapıldı
- tool açıkken mobil dock gizlenir; çalışma ekranı tam odağa geçer


## P11 — Visual Identity Reset

P11, önceki nötr/minimal SaaS görünümünü tamamen terk eden art-direction paketidir.

- siyah sahne + krem içerik alanı
- acid lime, elektrik mavi, mercan, mor ve cyan vurgu paleti
- büyük serif display tipografisi + sans-serif ürün tipografisi
- hareketli hero renk kartları ve glow orb
- tam genişlik hareketli neon ticker
- smart router elektrik mavi ana sahne + acid dropzone
- kategoriye göre renklenen tool kartları
- hızlı erişimde karanlık, renkli hover yüzeyleri
- üç kısa, renkli fayda bloğu; uzun açıklama metinleri kaldırıldı
- dev tipografili footer
- tool ekranları da gri SaaS panelinden çıkarılıp krem/ink/blue workshop diline taşındı
- scroll progress ve düşük yoğunluklu noise eklendi
- mobil kimlik de aynı renk ve tipografi sistemiyle yeniden işlendi


## P12 — Mobil görsel kimlik entegrasyonu

P11 art-direction mobilde yalnız responsive override olarak bırakılmadı; mobil akış baştan P11 kimliğine göre birleştirildi.

- tam ekran siyah mobil hero, acid büyük tipografi ve daha güçlü renk sahnesi
- mobil hero kartlarının oran/konumları yeniden kuruldu
- 3 aksiyonlu alt dock: Dosya seç / Araçlar / Ara
- kategori rail'inde kategoriye özgü vurgu rengi
- smart router mobilde tam genişlik elektrik mavi sahneye dönüştürüldü
- hızlı kestirmeler karanlık yatay renk şeridi olarak bütünleştirildi
- tool listeleri kategori rengini sol şerit ve dokunma state'i olarak kullanır
- fayda blokları mobilde yatay swipe renk sahnelerine dönüştürüldü
- açılan aracın kategorisi body data attribute üzerinden tüm tool sayfasının vurgu rengini belirler
- motor/lisans/veri bilgileri mobilde sürekli görünmez; Teknik bilgi disclosure içine taşındı
- araç aksiyonları mobilde sticky alt çalışma barı olarak erişilebilir kalır
- dosya seçici, durum, preview, sonuç ve output yüzeyleri kategori rengiyle eşleşir
- 390 px altı için ayrıca tipografi, kart ve action bar yoğunluğu ayarlandı
