# Entegrasyon Manifesti

Bu dosya ürün içinde kullanılan dış motorların kaynak, lisans ve veri davranışını kayıt altında tutar.

## PapaParse

- Kaynak: https://github.com/mholt/PapaParse
- Kullanılan sürüm: **5.7.0**
- Lisans: **MIT**
- Kullanım: CSV ayrıştırma, delimiter algılama, CSV → JSON
- Çalışma yeri: **browser**
- Ağ gereksinimi: **yok**
- Kullanıcı verisi cihazdan çıkar mı?: **hayır**
- Entegrasyon biçimi: npm dependency, sürüm sabit
- Neden seçildi?: Olgun CSV parser; quoting/escaping/delimiter edge-case'lerini yeniden yazmamak için.
- Testler: delimiter algılama, Türkçe kolon adı, CSV→JSON, manifest kontrolü.

## PDF.js

- Kaynak: https://github.com/mozilla/pdf.js
- npm paketi: **pdfjs-dist 6.3.289**
- Lisans: **Apache-2.0**
- Kullanım: PDF önizleme/render
- Çalışma yeri: **browser + Web Worker**
- Ağ gereksinimi: **yok**
- Kullanıcı verisi cihazdan çıkar mı?: **hayır**
- Entegrasyon: PDF aracı açıldığında lazy-load; ana bundle'a dahil edilmez.
- Not: Worker da build asset'i olarak yerel paketlenir; harici CDN kullanılmaz.

## pdf-lib

- Kaynak: https://github.com/Hopding/pdf-lib
- Kullanılan sürüm: **1.17.1**
- Lisans: **MIT**
- Kullanım: PDF birleştirme, seçili sayfaları çıkarma, döndürme
- Çalışma yeri: **browser**
- Ağ gereksinimi: **yok**
- Kullanıcı verisi cihazdan çıkar mı?: **hayır**
- Entegrasyon: PDF UI modülü ile lazy-load.
- Bakım notu: Kütüphane olgun fakat upstream kod hareketi PDF.js kadar hızlı değil; API yüzeyi dar tutulur ve fixture testleriyle korunur.

## Görsel İşleme — Native Web Platform

- Motorlar: Canvas 2D, createImageBitmap, Blob/Object URL
- Harici dependency: **yok**
- Kullanım: kırpma, yeniden boyutlandırma, JPEG/WebP kalite kontrollü encode, JPEG/PNG/WebP dönüşümü, metadata temizleme
- Çalışma yeri: **browser**
- Ağ gereksinimi: **yok**
- Kullanıcı verisi cihazdan çıkar mı?: **hayır**
- Dosya sınırı: **30 MB**
- Decode güvenlik sınırı: **50 megapiksel**
- Cropper.js 2.2.0 değerlendirildi; P3 için ek runtime bağımlılığı yerine küçük browser-native crop overlay tercih edildi.
- Metadata temizleme: görsel yeni bir dosyaya re-encode edilir; eski EXIF/IPTC/XMP blokları çıktıya taşınmaz.

## ExifReader

- Kaynak: https://github.com/mattiasw/ExifReader
- npm paketi: **exifreader 4.45.2**
- Lisans: **MPL-2.0**
- Kullanım: EXIF/IPTC/XMP ve yaygın görsel metadata alanlarını okuma
- Çalışma yeri: **browser**
- Ağ gereksinimi: **yok**
- Kullanıcı verisi cihazdan çıkar mı?: **hayır**
- Entegrasyon: yalnız EXIF / Metadata aracı seçildiğinde dinamik import.
- Gizlilik: GPS/konum benzeri metadata bulunduğunda kullanıcı arayüzünde ayrıca işaretlenir.

## Native Web Platform

Base64, URL, JSON, metin, SHA-256 ve tarih araçlarında tarayıcının yerleşik API'leri kullanılır.

- Harici dependency: yok
- Ağ: yok
- Veri dışarı çıkışı: yok

## Bundle bütçesi

Ağır PDF motorları nedeniyle bütçe artık iki katmana ayrılır:

- Ana/entry JS: maksimum **100 KB**
- Tüm lazy JS/MJS toplamı: maksimum **3.5 MB**
- CSS: maksimum **120 KB**

Ana ürün kabuğu küçük kalmalı; PDF ve gelecekte medya/OCR motorları yalnız ihtiyaç halinde yüklenmelidir.
