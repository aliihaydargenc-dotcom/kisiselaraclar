# P18 Figma Responsive Redesign

Figma file: https://www.figma.com/design/1joVZQtaK2ah8S3lXbnnu1

## Desktop
- 1440 tabanlı split hero: sol marka mesajı, sağ Bugün çalışma merkezi.
- Discovery alanında 390 px yardımcı kolon ve iki kolon araç kataloğu.
- 520 px arama alanı ve pill kategori rail.
- Ana görev akışını tekrar eden alt pazarlama bölümleri kaldırılır.

## Mobile
- 390 tabanlı bağımsız kompozisyon.
- 64 px header ve kompakt hero.
- Bugün merkezi hero sonrasında doğrudan görünür.
- 48 px arama, yatay kategori rail, kompakt recent rail.
- 84 px tek sütun araç satırları ve 56 px safe-area dock.

## Implementation
- Bugün markup'ı viewport'a göre tek bir root'a render edilir; duplicate ID oluşmaz.
- 901 px ve üstünde desktopHomeView kullanılır.
- 900 px ve altında homeView kullanılır.
- 620 px altında mobile-shell final kompozisyonu devralır.
