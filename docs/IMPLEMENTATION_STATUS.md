# Implementation Status

## Ürün hedefi

Türkçe-first, local-first, farklı açık kaynak motorların tek tasarım ve arama sistemi altında birleştiği kişisel araç platformu.

## Tamamlanan

- Açık kaynak araştırma kataloğu
- Entegrasyon/lisans politikası
- Türkçe varsayılan ürün yaklaşımı
- Çekirdek statik web kabuğu
- Türkçe kategori + alias tabanlı araç araması
- Araç manifesti
- Local-first gizlilik göstergesi
- 7 native tarayıcı aracı:
  - Base64 dönüştürücü
  - URL kodlayıcı
  - JSON düzenleyici/doğrulayıcı
  - Tekrarlanan satır temizleyici
  - Metin istatistikleri
  - SHA-256 özeti
  - Unix zaman dönüştürücü
- Node tabanlı unit testleri
- GitHub Actions kalite kapısı

## Sıradaki anlamlı paket

**P1 — İlk dış kaynak entegrasyon dalgası**

Amaç: entegrasyon politikasını gerçek bileşenlerle kanıtlamak.

Öncelik:
1. PapaParse (MIT) ile CSV görüntüle / CSV → JSON
2. pdf.js + pdf-lib ile PDF önizleme / birleştirme / bölme için teknik spike
3. Cropper.js ile görsel kırpma ve tarayıcı-native yeniden boyutlandırma
4. Her entegrasyon için kaynak/lisans/çalışma yeri/veri akışı manifesti

Bu paket tamamlanmadan Vercel deployment başlatılmayacak.

## Release

Henüz production release yok. Vercel son aşamadır.
