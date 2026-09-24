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

## Tesseract.js OCR

- Kaynak: https://github.com/naptha/tesseract.js
- npm paketi: **tesseract.js 7.0.0**
- Core: **tesseract.js-core 7.0.0**
- Dil paketleri: **@tesseract.js-data/tur 1.0.0**, **@tesseract.js-data/eng 1.0.0**
- Lisans: Tesseract.js/Core **Apache-2.0**; dil paketleri **MIT**
- Kullanım: görsel ve render edilmiş PDF sayfasından OCR metni çıkarma
- Çalışma yeri: **browser + Web Worker + WASM**
- Harici ağ gereksinimi: **yok**
- Kullanıcı verisi cihazdan çıkar mı?: **hayır**
- Build: `scripts/sync-ocr-assets.mjs` worker, WASM core ve tur/eng traineddata varlıklarını `public/ocr` altına kopyalar.
- Runtime: OCR modülü ve Tesseract ana API'si yalnız OCR işlemi başladığında yüklenir.
- PDF desteği: Tesseract.js doğrudan PDF okumaz; mevcut PDF.js seçilen sayfayı Canvas'a render eder, OCR Canvas üzerinde çalışır.
- Güvenlik/perf sınırları: görsel 20 MB, PDF 25 MB, PDF render 18 megapiksel.
- Runtime bütçesi: OCR statik varlıkları için maksimum **40 MB**; ana uygulama JS bütçesine dahil edilmez fakat ayrıca kalite kapısında ölçülür.

## qrcode-generator

- Kaynak: https://github.com/kazuhikoarase/qrcode-generator
- npm paketi: **qrcode-generator 2.0.4**
- Lisans: **MIT**
- Kullanım: metin ve URL'den SVG QR kod üretme
- Çalışma yeri: **browser**
- Ağ gereksinimi: **yok**
- Kullanıcı verisi cihazdan çıkar mı?: **hayır**
- Entegrasyon: QR oluşturma aracı açıldığında lazy-load edilen kod modülünde.

## ZXing Browser / ZXing Library

- Kaynaklar: https://github.com/zxing-js/browser ve https://github.com/zxing-js/library
- npm paketleri: **@zxing/browser 0.2.1**, **@zxing/library 0.23.0**
- Lisans: **MIT / Apache-2.0**
- Kullanım: JPEG/PNG/WebP görselinden QR, EAN, UPC, Code 39/93/128, Data Matrix, Aztec, PDF417 ve diğer desteklenen formatları okuma
- Çalışma yeri: **browser**
- Ağ gereksinimi: **yok**
- Kullanıcı verisi cihazdan çıkar mı?: **hayır**
- Entegrasyon: yalnız barkod okuma işlemi başladığında dinamik import.
- Not: @zxing/library bakım modundadır; entegrasyon yüzeyi dar tutulur ve sürüm sabitlenir.

## fflate

- Kaynak: https://github.com/101arrowz/fflate
- npm paketi: **fflate 0.8.3**
- Lisans: **MIT**
- Kullanım: ZIP oluşturma/çıkarma ve GZIP sıkıştırma/açma
- Çalışma yeri: **browser**
- Ağ gereksinimi: **yok**
- Kullanıcı verisi cihazdan çıkar mı?: **hayır**
- Güvenlik sınırları: dosya başına 100 MB, ZIP oluştururken toplam 150 MB, açılmış çıktı toplamı 300 MB, en fazla 1000 giriş.
- ZIP çıkarma öncesinde central directory okunur; ZIP64, aşırı çıkış boyutu ve bozuk merkez dizini reddedilir.
- Arşiv dosya yolları download öncesinde traversal parçalarından temizlenir.

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
- Tüm uygulama lazy JS/MJS toplamı: maksimum **3.5 MB**
- OCR worker/WASM/traineddata runtime varlıkları: maksimum **40 MB**
- CSS: maksimum **140 KB**

Ana ürün kabuğu küçük kalmalı; ağır OCR runtime varlıkları aynı origin üzerinde tutulur ve yalnız OCR gerektiğinde yüklenir.
