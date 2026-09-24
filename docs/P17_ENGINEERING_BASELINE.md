# P17.3 Engineering Baseline

Bu paket üç teknik borcu kapatır:

- **Dependency determinism:** package-lock.json üretilir; CI ve Pages daha sonra npm ci kullanır.
- **Browser smoke tests:** Chromium desktop + Pixel 7 emülasyonu ile kritik ana akışlar gerçek tarayıcıda doğrulanır.
- **CSS ownership:** P17 çalışma alanı mobil dock stilini artık taşımıyor. Final dock katmanı src/mobile-shell.css dosyasına ayrıldı ve CSS audit bunu koruyor.

package-lock.json gerçek npm çözümünden üretildi. CI ve GitHub Pages artık npm ci kullanır. CI kalite job'ı sonrasında Chromium tabanlı desktop + Pixel 7 smoke test job'ı çalışır. Geçici lockfile üretim workflow'u kaldırılmıştır.
