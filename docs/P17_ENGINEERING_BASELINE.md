# P17.3 Engineering Baseline

Bu paket üç teknik borcu kapatır:

- **Dependency determinism:** package-lock.json üretilir; CI ve Pages daha sonra npm ci kullanır.
- **Browser smoke tests:** Chromium desktop + Pixel 7 emülasyonu ile kritik ana akışlar gerçek tarayıcıda doğrulanır.
- **CSS ownership:** P17 çalışma alanı mobil dock stilini artık taşımıyor. Final dock katmanı src/mobile-shell.css dosyasına ayrıldı ve CSS audit bunu koruyor.

İlk branch push'u package-lock.json dosyasını gerçek npm çözümünden üretmek için geçici lockfile workflow'unu çalıştırır. Lockfile oluştuktan sonra CI npm ci + Playwright smoke test hattına geçirilir ve geçici workflow kaldırılır.
