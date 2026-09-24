# Tasarım Araçları Araştırması — P13

Bu paket, Kişisel Araçlar'a yerel çalışan tasarım yardımcıları eklemek için hazırlanmıştır. Dış projeler doğrudan kopyalanmaz; işlev ve etkileşim fikirleri incelenip mevcut ürün mimarisine yeniden uygulanır.

## İncelenen kaynaklar

- **Radix Colors** — https://github.com/radix-ui/colors — MIT. Arka plan, component state, border, solid action ve text rollerini ayrı renk basamaklarıyla ele alma yaklaşımı.
- **Open Props** — https://github.com/argyleink/open-props — MIT. Renk, easing, spacing, shadow ve diğer tasarım değerlerini framework bağımsız CSS custom property/token sistemiyle yönetme yaklaşımı.
- **Uiverse Galaxy** — https://github.com/uiverse-io/galaxy — MIT. Çok sayıda CSS/Tailwind buton varyasyonunu incelemek için referans havuzu. Kod tabanı projeye topluca alınmadı.
- **Enterprise UI Palette Generator** — https://github.com/mgifford/ui-palette-generator — AGPL-3.0. Seed renk, semantik token, light/dark önizleme ve kontrast kontrolü yaklaşımı incelendi. AGPL kodu kopyalanmadı.
- **Universal Color Palette Generator** — https://github.com/Universal-Coding-Experiments/color-palette-generator — README armoni modları, canlı tema önizlemesi ve export akışını tarif ediyor. İşlevler sıfırdan yerel motorda uygulandı.
- **WCAG 2.2 Target Size (Minimum)** — 24×24 CSS px asgari hedef. Mobil buton tasarımcısı ayrıca Android/Material'ın 48dp önerisini kalite hedefi olarak gösterir.

## Ürüne alınan araçlar

1. **Renk Armonisi** — Analog, tamamlayıcı, üçlü, ayrık tamamlayıcı, dörtlü ve monokrom paletler; HEX tıklayarak kopyalama; CSS/JSON çıktı.
2. **Site Renk Sistemi** — Tek vurgu renginden açık/koyu tema için semantik `bg/surface/text/muted/border/primary/focus` tokenları; canlı site maketi; kontrast oranları; CSS/JSON çıktı.
3. **Web Buton Tasarımcısı** — Dolu/çerçeveli/yumuşak/ghost varyantları, renk, radius, yükseklik, padding ve genişlik kontrolü; canlı önizleme; HTML/CSS çıktı.
4. **Mobil Buton Tasarımcısı** — Telefon çerçevesinde önizleme; 48px dokunma hedefi ve WCAG 24px asgari denetimi; HTML/CSS çıktı.

## Mimari karar

Yeni bir framework veya uzak servis eklenmedi. Renk dönüşümü, kontrast hesabı, armoni ve buton CSS üretimi `src/design-tools.js` içinde sıfır bağımlılıkla çalışır. UI `src/design-ui.js` tarafından lazy-load edilir. Böylece tasarım araçları kullanılmadığında başlangıç yüküne yalnızca kategori metadatası eklenir.
