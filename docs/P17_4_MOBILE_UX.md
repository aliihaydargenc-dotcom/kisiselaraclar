# P17.4 Mobile UX Consolidation

Ekran görüntüsü denetiminde mobil ana sayfada üç ayrı görsel sistemin arka arkaya geldiği görüldü: siyah editorial hero, açık P17 bento alanı ve tekrar brutalist araç/router/son kullanılanlar bölümleri.

## Uygulanan kararlar

- Hero korunur fakat tam ekran afiş davranışı kaldırılır.
- “Ne yapıyoruz?” başlığı “Aracını bul.” olarak sadeleştirilir.
- Araç araması normal mobil input ölçeğine çekilir.
- Kategoriler tam genişlik kutular yerine yatay pill rail olur.
- Boş Smart Router mobilde gizlenir; dosya seçildikten sonra öneriler görünür.
- Son kullanılanlar açık ve yatay kompakt şerit olur.
- Araç kataloğu kartları tek sütun, düşük yükseklikli mobil listeye dönüşür.
- Mobil pazarlama/fayda bölümü gizlenir; görev tamamlamaya hizmet etmeyen scroll azaltılır.
- Yedekleme yardımcı kontrol seviyesine indirilir.
- Dock 56 px shell olarak sabitlenir ve sayfa alt padding'i içerik örtüşmesini engeller.

Playwright mobile smoke testi; boş Smart Router'ın görünmediğini, araç başlığının kompakt kaldığını, dosya seçimi sonrası öneri router'ının göründüğünü ve Bugün dock aksiyonunu doğrular.
