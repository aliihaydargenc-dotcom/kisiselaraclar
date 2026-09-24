# Entegrasyon Politikası

Her yeni açık kaynak repo/bileşen bu kontrolden geçmeden ürüne alınmaz.

## Zorunlu kayıt

Her entegrasyon için aşağıdaki alanlar tutulur:

- kaynak repo
- kullanılan sürüm/commit
- lisans
- upstream son güncelleme
- bizim kullandığımız özellik
- çalışma yeri: browser / worker / WASM / server
- dosya/veri cihazdan çıkıyor mu?
- harici ağ isteği var mı?
- ücretsiz/ücretli servis bağımlılığı var mı?
- yaklaşık bundle/WASM maliyeti
- mobil uyumluluk
- Türkçeleştirme yöntemi
- attribution gereksinimi
- test kapsamı
- kaldırma/fallback planı

## Lisans sınıfları

### Yeşil
MIT, Apache-2.0, BSD türleri ve kullanımımıza uygun doğrulanmış permissive lisanslar.

### Sarı
MPL-2.0 gibi file-level yükümlülük getiren lisanslar; GPL/AGPL olmayan fakat değişiklik/dağıtım koşulları bulunan bileşenler. Kullanılan dosyalar ve değişiklikler takip edilir.

### Kırmızı / bilinçli karar gerektirir
GPL/AGPL veya lisansı belirsiz projeler. Varsayılan olarak kod alınmaz. Özellik/UX referansı olarak incelenebilir.

## Mimari kurallar

- Büyük motorlar lazy-load edilir.
- Ağır işler Web Worker'da çalıştırılır.
- Aynı işi yapan iki ağır kütüphane birlikte taşınmaz.
- Native browser API yeterliyse dependency eklenmez.
- Kullanıcı dosyası varsayılan olarak sunucuya gönderilmez.
- Harici iframe yalnız zorunlu ve açıkça etiketli özel durumda düşünülebilir; ana araç deneyimi iframe tabanlı olmayacak.
- CDN'den rastgele runtime kod çekmek yerine sürümler paket yöneticisiyle kilitlenir.
- Her araç bağımsız route/modül olarak yüklenebilir olmalı.
- Hatalı bir araç bütün uygulamayı çökertmemeli.

## Türkçe-first kuralları

- `tr` varsayılan locale.
- UI metinleri kaynak kod içine dağınık yazılmaz; i18n anahtarları kullanılır.
- Türkçe arama alias'ları ayrı tutulur.
- Sayı, tarih, saat ve dosya boyutu gösterimleri `tr-TR` uyumlu olur.
- Teknik isim gerekiyorsa Türkçesiyle beraber gösterilir.
- Üçüncü taraf İngilizce arayüz doğrudan kullanıcıya yansıtılmaz.

## Release kuralı

Deployment ürün geliştirmesinin son aşamasıdır.

Sıra:
`araştırma -> seçici entegrasyon -> unit test -> browser test -> mobil kontrol -> katalog doğrulama -> release hazırlığı -> en son Vercel`

Vercel bağlandığında diğer projelerdeki gibi feature branch preview deployment'ları kapalı tutulmalı; yalnız `main` production deploy üretmelidir.
