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

## Sıradaki anlamlı paket

**P3 — Görsel araçları**

Öncelik:
1. Cropper.js veya browser-native yaklaşım ile kırpma
2. yeniden boyutlandırma
3. kalite kontrollü sıkıştırma
4. WebP/JPEG/PNG dönüşümü
5. EXIF görüntüleme/silme için ExifReader değerlendirmesi
6. yine lazy-load + entegrasyon manifesti

P3 doğrulanmadan Vercel deployment başlatılmayacak.

## Backlog

- Faker: Türkçe sahte veri üretici
- Hoppscotch'tan ilhamla sade API istek test aracı
- public-apis: yeni ücretsiz veri kaynakları için keşif kataloğu
- OCR: Tesseract.js
- medya: Mediabunny, gerektiğinde FFmpeg WASM fallback

## Release

Henüz production release yok. Vercel son aşamadır.
