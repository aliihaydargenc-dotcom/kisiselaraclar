# Kişisel Araçlar

Türkçe öncelikli, tarayıcıda mümkün olduğunca yerel çalışan (local-first) günlük araçlar platformu.

Bu repo şu anda **yerel araç çekirdeğinin geliştirme aşamasındadır**. CSV, PDF, görsel, QR/barkod, arşiv ve OCR araçları tarayıcı içinde çalışır; Vercel/deployment bilinçli olarak son aşamaya bırakılmıştır.

## Ürün ilkeleri

- **Türkçe varsayılan:** Türkçeleştirilebilen tüm kullanıcı arayüzü, araç adları, açıklamalar, hata mesajları ve yardım metinleri Türkçe olacak.
- **Local-first:** Dosya ve veriler mümkün olduğunca kullanıcının tarayıcısında işlenecek; gereksiz sunucu yüklemesi yapılmayacak.
- **Açık kaynak seçici entegrasyon:** Bir aracı sırf popüler olduğu için kopyalamak yerine lisans, bakım durumu, performans, mobil uyumluluk ve veri akışı incelenecek.
- **Tek ürün hissi:** Farklı repolardan alınan yetenekler aynı tasarım, arama, kategori ve etkileşim modeli altında bütünleşecek.
- **Kaynak şeffaflığı:** Her dış bileşenin kaynak reposu, lisansı ve kullanım biçimi kayıt altına alınacak.
- **Vercel en son:** Önce ürün kataloğu, mimari, entegrasyon ve test altyapısı; deployment daha sonra.
- **API bağımlılığı minimum:** Ücretli API zorunluluğu oluşturulmayacak. Ücretsiz/açık kaynak/local-first çözümler öncelikli.

## Şu anki çalışma

Mevcut çekirdek; metin/veri/geliştirici araçları, CSV, PDF, görsel işleme, QR/barkod, ZIP/GZIP ve Türkçe/İngilizce local OCR araçlarını içeriyor. Medya araçları sonraki pakette değerlendirilecek.

Araştırma sonuçları `docs/` altında tutulacak. Henüz üçüncü taraf uygulama kodu körlemesine kopyalanmamıştır.
