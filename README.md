# Kişisel Araçlar

Türkçe öncelikli, tarayıcıda mümkün olduğunca yerel çalışan (local-first) günlük araçlar platformu.

Bu repo şu anda **GitHub Pages production release hazırlığı aşamasındadır**. CSV, PDF, görsel, QR/barkod, arşiv ve OCR araçları tarayıcı içinde çalışır; Vercel/deployment bilinçli olarak son aşamaya bırakılmıştır.

## Ürün ilkeleri

- **Türkçe varsayılan:** Türkçeleştirilebilen tüm kullanıcı arayüzü, araç adları, açıklamalar, hata mesajları ve yardım metinleri Türkçe olacak.
- **Local-first:** Dosya ve veriler mümkün olduğunca kullanıcının tarayıcısında işlenecek; gereksiz sunucu yüklemesi yapılmayacak.
- **Açık kaynak seçici entegrasyon:** Bir aracı sırf popüler olduğu için kopyalamak yerine lisans, bakım durumu, performans, mobil uyumluluk ve veri akışı incelenecek.
- **Tek ürün hissi:** Farklı repolardan alınan yetenekler aynı tasarım, arama, kategori ve etkileşim modeli altında bütünleşecek.
- **Kaynak şeffaflığı:** Her dış bileşenin kaynak reposu, lisansı ve kullanım biçimi kayıt altına alınacak.
- **Release kontrollü:** Production deployment otomatik kalite kapıları ve gerçek dosya smoke testlerinden sonra yapılır.
- **API bağımlılığı minimum:** Ücretli API zorunluluğu oluşturulmayacak. Ücretsiz/açık kaynak/local-first çözümler öncelikli.

## Şu anki çalışma

Mevcut çekirdek; metin/veri/geliştirici araçları, CSV, PDF, görsel işleme, QR/barkod, ZIP/GZIP ve Türkçe/İngilizce local OCR araçlarını içeriyor. Medya araçları sonraki pakette değerlendirilecek.

Araştırma sonuçları `docs/` altında tutulacak. Henüz üçüncü taraf uygulama kodu körlemesine kopyalanmamıştır.


## Kullanım deneyimi

- Araçlar URL üzerinden doğrudan açılabilir: `#tool=image-compress` gibi.
- Son kullanılan araçlar ana sayfadaki hızlı erişimde öne çıkar.
- Masaüstünde dosyalar seçim alanlarına sürüklenip bırakılabilir.
- `/` arama kutusuna odaklanır.
- Release doğrulaması: `docs/RELEASE_CHECKLIST.md`.


## Hosting

Ana ücretsiz production hattı GitHub Pages + GitHub Actions'tır. Vite build'i Pages için `BASE_PATH=/kisiselaraclar/` ile üretilir; normal root-domain build'lerinde varsayılan `/` kullanılmaya devam eder.

İlk kurulumda repository Pages kaynağı bir kez **GitHub Actions** olarak seçilmelidir. Sonrasında `main` push'ları otomatik quality + build + deploy hattını tetikler.


## Akıllı dosya yönlendirme

Ana ekranda dosya seçildiğinde veya bırakıldığında dosyanın MIME türü/uzantısı yalnız tarayıcı içinde değerlendirilir. Uygun araçlar otomatik önerilir; önerilen araca geçildiğinde destekleyen tarayıcılarda dosya seçimi bellekte araca aktarılır. Dosya içeriği bu yönlendirme için okunmaz ve sunucuya gönderilmez.


## PDF ↔ görsel dönüşüm köprüsü

- PDF içindeki seçili sayfalar PNG/JPEG'e dönüştürülüp ZIP olarak indirilebilir.
- JPEG/PNG/WebP görseller seçim sırasıyla tek PDF'e dönüştürülebilir.
- Dönüşümler mevcut PDF.js, pdf-lib, Canvas ve fflate altyapısıyla cihaz içinde yapılır; yeni dış servis veya ücretli API eklenmez.


## P8 medya araçları

Ses/video dosyaları için yerel metadata inceleme, zaman aralığı kırpma ve MP4/WebM/MP3/WAV dönüşümü eklendi. Medya motoru lazy-load edilir ve dosya sunucuya gönderilmez. Dönüştürme desteği tarayıcının mevcut codec/WebCodecs yeteneklerine göre işlem öncesinde doğrulanır.


## P9 UX yenilemesi

Arayüz 29 araçlık katalog büyüdükten sonra yeniden düzenlendi. Üç sütunlu yoğun katalog iki sütuna düşürüldü; sidebar ve tool panel kabukları sadeleştirildi; hızlı erişim yatay şerit oldu; teknik motor bilgileri geri plana alındı. Tasarım artık daha az border/shadow kullanır ve dosya bırakma akışını ana odak olarak öne çıkarır.


## Site shell redesign

Ürün arayüzü dashboard görünümünden çıkarılarak landing-first bir web sitesi yapısına taşındı. Sticky üst navigasyon, editorial hero, ürün görseli, yatay araç keşfi ve açıklayıcı alt bölüm eklendi. Desktop sidebar kaldırıldı; arama ve kategori filtresi araç kataloğunun doğal bir parçası oldu. Bir araç açıldığında landing katmanları geri çekilerek odaklı çalışma ekranı korunur.


## P10 mobil UX

Mobil deneyim ayrı bir etkileşim katmanı olarak ele alındı. Alt hızlı işlem dock'u, swipe kategori/hızlı erişim şeritleri, liste tipi araç kataloğu, 48 px dokunma hedefleri, safe-area desteği ve sıkılaştırılmış tool ekranları eklendi.


## P11 görsel kimlik

Nötr SaaS görünümü bırakıldı. Ürün artık yüksek kontrastlı siyah/krem temel, acid lime, elektrik mavi, mercan ve mor vurgu renkleri; büyük serif başlıklar; hareketli hero kartları; neon ticker ve kategori bazlı renklenen araç kartları kullanır. Ana sayfadaki açıklama yükü azaltıldı.


## P12 mobil görsel entegrasyon

P11'in renkli art-direction dili mobilde ayrı bir sistem olarak tamamlandı. Tam ekran mobil hero, kategori renkli filtre/araç satırları, üçlü hızlı dock, full-bleed smart router, swipe fayda kartları ve kategoriye göre renklenen tool çalışma ekranları eklendi. Teknik motor/lisans bilgisi mobilde disclosure içine alındı; tool aksiyonları sticky çalışma barına dönüştürüldü.


## P13 tasarım araçları

Tasarım kategorisine dört local-first araç eklendi: Renk Armonisi, Site Renk Sistemi, Web Buton Tasarımcısı ve Mobil Buton Tasarımcısı. Renk motoru, WCAG kontrast hesabı ve CSS üretimi sıfır dış bağımlılıkla tarayıcıda çalışır; tasarım arayüzü yalnız araç açıldığında lazy-load edilir.

Araştırma ve lisans kararları `docs/DESIGN_TOOL_RESEARCH.md` içinde kayıtlıdır. MIT kaynaklardan etkileşim/tasarım fikirleri referans alındı; AGPL kaynak kodu projeye kopyalanmadı.

## P14 tasarım + veri laboratuvarı

Katalog 45 araca çıktı. Tasarım alanına CSS Gradient, Shadow, WCAG Kontrast, Tipografi Ölçeği, Spacing Sistemi ve Radius Sistemi eklendi. Veri alanına CSV Profil Analizi, Veri Kalitesi Kontrolü, Eksik Değer Analizi, Duplicate Satır Bulucu, CSV Kolon Analizi ve İki CSV Karşılaştır aracı eklendi.

Yeni araçlar local-first çalışır. Tasarım motoru dış servise ihtiyaç duymaz; CSV araçları mevcut PapaParse altyapısını kullanır ve dosyaları sunucuya göndermez. Veri laboratuvarı yalnız ihtiyaç olduğunda lazy-load edilir. Araştırma ve ürün kararları docs/P14_DESIGN_DATA_RESEARCH.md dosyasında kayıtlıdır.
