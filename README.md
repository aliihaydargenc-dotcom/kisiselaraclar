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
