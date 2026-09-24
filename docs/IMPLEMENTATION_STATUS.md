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
- GitHub Actions kalite kapısı

## P1 — İlk gerçek dış entegrasyon

PapaParse 5.7.0 (MIT) seçildi.

Yeni yetenek:
- CSV dosyası seçme (20 MB ilk sürüm sınırı)
- dosyanın yalnız browser içinde okunması
- delimiter otomatik algılama
- başlık/kolon algılama
- ilk 200 satırlık tablo önizlemesi
- CSV → JSON çıktısı
- Türkçe CSV arama alias'ları
- araç ekranında motor / sürüm / lisans / veri dışarı çıkışı bilgisi
- entegrasyon manifesti
- Vite build
- JS/CSS bundle bütçesi

## Sıradaki anlamlı paket

**P2 — PDF çekirdeği teknik spike**

Öncelik:
1. pdf.js ile browser PDF önizleme
2. pdf-lib ile birleştirme / bölme / döndürme prototipi
3. ağır PDF parçalarını lazy-load ederek JS ana bundle bütçesini koruma
4. PDF motorları için lisans/veri manifesti
5. gerçek PDF fixture testleri

P2 doğrulanmadan Vercel deployment başlatılmayacak.

## Backlog'a eklenen araştırma adayları

- Faker: Türkçe sahte veri üretici
- Hoppscotch'tan ilhamla sade API istek test aracı
- public-apis: yeni ücretsiz veri kaynakları için keşif kataloğu
- Size Limit yaklaşımı: şu an custom bundle budget ile başlatıldı; ihtiyaç büyürse doğrudan araç değerlendirilecek

## Release

Henüz production release yok. Vercel son aşamadır.
