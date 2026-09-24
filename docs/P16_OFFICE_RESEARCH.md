# P16 Ofis Çalışma Alanı Araştırması

P16'nın amacı yeni bir Word/Excel kopyası üretmek değildir. Ürün, ofiste sık karşılaşılan küçük ve tekrarlı işleri tek local-first çalışma alanında tamamlamaya odaklanır.

## Ürün kararı

P14 veri laboratuvarında CSV/veri analizi zaten ayrı bir hat olarak bulunuyor. P16 "Ofis" kategorisi bu hattı büyütmez; günlük belge, iletişim, not ve planlama işlerini kapsar.

P16 çekirdeği:

1. Belge Tara & Temizle
2. PDF Doldur & İmzala
3. Gizle & İşaretle
4. Belge Karşılaştır
5. Hızlı Not
6. Toplantı Notu
7. Sesli Not
8. Görev & Takvim

## Araştırma referansları

- Stirling PDF — PDF düzenleme, imza, OCR ve belge iş akışlarının tek araç setinde toplanması.
  https://github.com/Stirling-Tools/Stirling-PDF
- Signet — PDF üzerinde yerel imza ve metin ekleme yaklaşımı.
  https://github.com/matt-shearing/signet
- Nitidoc — tarayıcı içinde belge tarama, temizleme ve PDF üretme yaklaşımı.
  https://github.com/santiagoisra/nitidoc
- Memos — hızlı yakalama, düşük sürtünmeli not ve local/self-hosted düşüncesi.
  https://github.com/usememos/memos
- Super Productivity — görev, zamanlama ve günlük çalışma akışının birbirine bağlanması.
  https://github.com/super-productivity/super-productivity
- doff — farklı içerik türlerinde karşılaştırma deneyimi.
  https://github.com/franklioxygen/doff

Bu projelerden uygulama kodu kopyalanmadı. P16 UI ve iş mantığı mevcut Kişisel Araçlar mimarisine özel yazıldı; mevcut pdf-lib, PDF.js ve Web Platform API altyapısı yeniden kullanıldı.

## Sınırlar

- Tam kelime işlemci yok.
- Spreadsheet/pivot/Excel çalışma alanı yok; veri araçları P14 kategorisinde kalır.
- Mail istemcisi yok.
- Ekip/proje yönetimi yok.
- Cloud hesap/senkronizasyon yok.
- Sesli not için ilk sürüm tarayıcı SpeechRecognition desteğini kullanır. Tarayıcı desteklemiyorsa özellik kendisini desteklenmiyor olarak gösterir; sahte fallback yok.
- Belge taramada P16 ilk sürümü fotoğraf/kamera alma, kırpma, döndürme, kontrast ve siyah-beyaz temizleme sağlar. Otomatik dört köşe perspektif çözümü ileride ayrı kalite artışı olarak değerlendirilebilir.

## Veri ilkesi

Notlar, görevler ve toplantı taslağı localStorage üzerinde cihazda tutulur. PDF/görsel/metin işlemleri sunucuya gönderilmeden tarayıcıda gerçekleştirilir. Harici ücretli API eklenmez.
