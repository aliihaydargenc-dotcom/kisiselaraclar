# Kişisel Araçlar

Türkçe öncelikli, tarayıcıda mümkün olduğunca yerel çalışan (local-first) günlük araçlar platformu.

Bu repo **GitHub Pages üzerinde production olarak yayınlanır**. PDF, görsel, ofis, QR/barkod, arşiv, OCR ve diğer desteklenen işlemler mümkün olduğunca tarayıcı içinde çalışır.

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


## P15 görsel + geliştirici laboratuvarı

Katalog 60 araca çıktı. Görsel alanına palet çıkarma, piksel renk seçici, SVG inceleme/dönüşüm, favicon paketi, en-boy oranı ve şeffaflık analizi; geliştirici alanına JSON diff, regex playground, UUID, JWT okuyucu, Markdown → HTML, HTML/CSS minify ve entity araçları eklendi.

## P16 ofis çalışma alanı

Katalog 68 araca çıktı. Yeni **Ofis** kategorisi; Hızlı Not, Toplantı Notu, Görev & Takvim, Sesli Not, Belge Tara & Temizle, PDF Doldur & İmzala, Gizle & İşaretle ve Belge Karşılaştır araçlarını içerir.

P16'nın sınırı Word/Excel veya proje yönetimi uygulaması kopyalamak değildir. Küçük günlük ofis işlerini hızlı ve mümkün olduğunca local-first biçimde tamamlar. Not/görev/toplantı verileri cihazda tutulur; belge/görsel/PDF işlemleri tarayıcıda yapılır. Sesli not, tarayıcının SpeechRecognition desteğine bağlıdır ve ses işleme davranışı tarayıcıya göre değişebilir.


## P17 çalışma merkezi

P17 araç sayısını büyütmek yerine kullanım kolaylığını merkez alır. Ana akış artık Bugün merkeziyle başlar; bugünkü/gecikmiş görevlar, son not veya toplantı taslağı ve en sık ihtiyaç duyulan işler tek ekranda görünür. Araç araması aynı zamanda yerel not, görev ve toplantı içeriğinde de arama yapar.

Tüm `kisiselaraclar:` yerel verileri tek JSON yedeği olarak dışa aktarılabilir ve kontrollü biçimde geri yüklenebilir. Yeni P17 katmanı mevcut P16 verisini yeniden kullanır; hesap, sunucu veya ücretli API eklemez. Mobilde pazarlama yüzeyi küçültülerek ilk yapılabilir eylemler daha yukarı taşınmıştır.


### P17.1 mobil çalışma alanı düzeltmesi

Bugün çalışma merkezindeki Hızlı Başla, görev ve Devam Et kartları doğrudan araç yönlendirmesine bağlandı. Mobil çalışma alanı ağır siyah panel/kutu görünümünden çıkarılarak daha açık, kompakt ve dokunma odaklı bento düzene geçirildi; boş görev durumu doğrudan görev ekleme eylemine dönüştürüldü ve mobil dock daha hafif hale getirildi.


### P17.2 stabilizasyon ve geliştirici denetimi

P17 çalışma merkezi geliştirici gözüyle yeniden tarandı. Tekrarlanan event listener birikimi kaldırıldı; Hızlı Başla kartları gerçek işlem niyetine bağlandı; localStorage yazma hataları artık kullanıcıya gösteriliyor; toplantı aksiyonlarının aynı görevi tekrar tekrar üretmesi engellendi; takvim günü seçimi görev başlığına odaklanıyor; yedek geri yükleme boyut ve kayıt sınırlarıyla doğrulanıyor; SVG araçları harici ağ referanslarını temizliyor.


### P17.4 mobil görsel bütünlük

Mobil ana akış ekran görüntüsü üzerinden yeniden düzenlendi. Hero yüksekliği azaltıldı; araç bulma başlığı ve arama alanı uygulama ölçeğine çekildi; boş Smart Router mobilde tekrar gösterilmiyor çünkü dosya seçimi çalışma merkezi ve dock içinde zaten mevcut. Dosya seçildiğinde Smart Router önerileri yeniden görünür. Son kullanılanlar karanlık afiş görünümünden açık, kompakt şeride taşındı; kategori şeridi pill yapıya geçti; araç listesi, footer ve mobil dock daha sakin bir tek ürün dili altında birleştirildi.


## P18 Figma responsive redesign

Canlı site Figma üzerinden ayrı masaüstü ve mobil yönlere ayrıldı. Masaüstünde Bugün çalışma merkezi hero'nun sağ kolonuna taşındı; araç keşfi iki sütunlu bir çalışma düzenine dönüştü. Mobilde hero, Bugün merkezi, arama/kategori rail'i, son kullanılanlar ve tek sütun araç listesi bağımsız bir mobil kompozisyon olarak ele alındı.

Figma dosyası: https://www.figma.com/design/1joVZQtaK2ah8S3lXbnnu1

Kodda desktop-shell.css ve mobile-shell.css final responsive katmanlar olarak ayrıdır. Playwright hem desktop hem Pixel 7 akışında hangi çalışma merkezinin render edildiğini ve kritik kısayolları doğrular.
