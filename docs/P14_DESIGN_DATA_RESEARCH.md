# P14 Tasarım + Veri Araştırması

P14 iki mevcut kategoriyi derinleştirir: Tasarım ve Veri. Amaç yeni bir framework katmanı eklemek değil, tarayıcıda hızlı çalışan küçük uzman araçlar oluşturmaktır.

## Referanslar

- Open Props: CSS tasarım tokenları ve ölçek yaklaşımı için referans. MIT. https://github.com/argyleink/open-props
- Radix Colors: semantik ve erişilebilir renk sistemi yaklaşımı için referans. MIT. https://github.com/radix-ui/colors
- Uiverse Galaxy: açık kaynak buton/arayüz varyasyonlarını incelemek için referans. MIT. https://github.com/uiverse-io/galaxy
- WCAG 2.2: kontrast değerlendirmesi ve erişilebilirlik eşikleri için standart referansı. https://www.w3.org/TR/WCAG22/
- PapaParse: mevcut CSV ayrıştırma motoru. MIT. https://github.com/mholt/PapaParse

## P14 araçları

Tasarım:
1. CSS Gradient Oluşturucu
2. Shadow Tasarımcısı
3. Kontrast Kontrolü
4. Tipografi Ölçeği
5. Spacing Sistemi
6. Radius Sistemi

Veri:
1. CSV Profil Analizi
2. Veri Kalitesi Kontrolü
3. Eksik Değer Analizi
4. Duplicate Satır Bulucu
5. CSV Kolon Analizi
6. İki CSV Karşılaştır

## Mimari kararlar

- Yeni React/Tailwind/UI framework bağımlılığı eklenmedi.
- Tasarım hesapları sıfır dış bağımlılıkla design-tools.js içinde çalışır.
- Veri laboratuvarı mevcut PapaParse bağımlılığını kullanır.
- data-lab-ui.js yalnız veri laboratuvarı aracı açıldığında lazy-load edilir.
- CSV içeriği tarayıcıdan dışarı gönderilmez.
- Analiz tabloları ve listeler mobilde kontrollü kaydırma kullanır.
