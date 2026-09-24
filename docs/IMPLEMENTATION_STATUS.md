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

## Sıradaki anlamlı paket

**P4 — QR / barkod + arşiv araçları araştırması**

P4 öncesi P3 kalite kapıları ve gerçek tarayıcı testi korunacak.

## Backlog

- Faker: Türkçe sahte veri üretici
- Hoppscotch'tan ilhamla sade API istek test aracı
- public-apis: yeni ücretsiz veri kaynakları için keşif kataloğu
- OCR: Tesseract.js
- medya: Mediabunny, gerektiğinde FFmpeg WASM fallback

## Release

Henüz production release yok. Vercel son aşamadır.
