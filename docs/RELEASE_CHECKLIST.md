# Release Readiness Checklist

Bu kontrol listesi ilk production yayını öncesindeki gerçek kullanıcı doğrulamasıdır.

## Otomatik kalite kapıları

- `npm run check`
- tüm Node testleri
- production Vite build
- ana JS / lazy JS / OCR runtime / CSS boyut bütçeleri
- GitHub branch + PR + main CI

## Masaüstü kullanıcı akışları

1. Ana sayfada arama ve kategori seçimi.
2. Hızlı erişimden araç açma; son kullanılan aracın listenin başına gelmesi.
3. Bir dosyayı file-drop alanına sürükleyip bırakma.
4. URL'deki `#tool=<id>` adresini yeni sekmede açıp aynı araca ulaşma.
5. `/` ile arama alanına geçme; araç ekranında `Esc` ile kataloğa dönme.

## Gerçek dosya smoke testleri

- PDF: iki PDF birleştir, indirilen dosyayı aç.
- Görsel: JPEG/WebP sıkıştır, çıktı görselini aç.
- OCR: Türkçe bir ekran görüntüsünden metin çıkar.
- QR: bir URL için QR üret; QR/barkod okuyucuyla geri çöz.
- ZIP: iki dosyayı ZIP yap; ZIP'i tekrar aç ve dosyalardan birini indir.
- CSV: CSV önizle ve JSON çıktısını kontrol et.

## Mobil

- kategori satırını yatay kaydır
- araç kartlarının tek sütunda okunabilirliğini kontrol et
- dosya seçici ile fotoğraf/PDF seç
- OCR ilerleme ve sonuç alanının taşmadığını kontrol et
- geri navigasyonunu kontrol et

## Release kriteri

Yukarıdaki smoke testlerde kritik akış hatası yoksa ilk production release yapılabilir. Yeni araç ailesi ancak bundan sonra değerlendirilir.
