# P36 — Design System & Motion Foundation

## Amaç

Kişisel Araçlar'ın farklı milestone'larda biriken görsel katmanlarını tek bir ürün dili altında toplamak; tasarım değişikliklerini yeni `!important` ve rastgele override ekleyerek değil, ortak tokenlar ve sahipliği belirli bir son katman üzerinden yönetmek.

## Yeni temel

- `src/p36-design-system.css`
  - renk, tipografi, radius, shadow, easing ve duration tokenları
  - P35 tarafından kullanılan `--app-*` değişkenlerine merkezi uyumluluk alias'ları
  - header, ortak yüzeyler, ana çalışma alanı, katalog, desktop rail ve mobile shell için ortak görsel dil
  - `prefers-reduced-motion` fallback'i
  - `!important` kullanmaz

- `src/p36-motion.js`
  - Motion 13.4.4'ü sabit jsDelivr ESM URL'sinden yalnız enhancement olarak yükler
  - CDN erişilemezse uygulamayı kırmaz
  - `prefers-reduced-motion` ve `saveData` tercihlerine saygı gösterir
  - `kisiselaraclar:ui-rendered` olayında yeni render edilen yüzeyleri yumuşak stagger ile açar
  - buton/kartlarda kısa press feedback uygular

## CSS sahipliği

Yükleme sırası:

`p17-workspace.css -> desktop-shell.css -> mobile-shell.css -> p36-design-system.css`

`check-css-ownership.mjs` bu sırayı ve P36'nın `!important` içermemesini doğrular.

## Tasarım yönü

- açık, ferah ve uygulama hissi veren yüzeyler
- mor/mavi ana vurgu; cyan yalnız ikincil atmosfer rengi
- ağır border/override yerine hafif yüzey ayrımı ve kontrollü gölge
- glass etkisi yalnız shell/navigation gibi bağlamsal yüzeylerde
- hover/press/reveal hareketleri kısa ve işlevsel
- mobilde hover bağımlılığı yok

## Bilinçli sınır

P36 tek tek tüm araç ekranlarını yeniden tasarlamaz. Önce ortak ürün temelini sabitler. Sonraki ekran dönüşümleri bu token ve motion katmanına dayanmalıdır; yeni bağımsız görsel sistem üretmemelidir.
