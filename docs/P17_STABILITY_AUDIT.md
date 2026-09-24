# P17.2 Stabilizasyon Denetimi

Bu tur yeni araç eklemek yerine mevcut ürünün hata riski, veri güvenilirliği, local-first iddiası ve günlük kullanım sürtünmesi incelendi.

## Düzeltilen somut sorunlar

1. **Event listener birikimi**
   - `homeView` her render edildiğinde yeni delegasyon listener'ı ekleniyordu.
   - Listener artık yalnız bir kez kuruluyor; güncel navigation callback'i root üzerinde yenileniyor.

2. **Yanlış hızlı eylem semantiği**
   - “Yeni not” yalnız Notlar aracını açıyordu.
   - “Görev ekle” yalnız görev ekranını açıyordu.
   - P17 kısayolları artık `new-note`, `new-task` ve `meeting-focus` eylemleriyle doğru alanı oluşturuyor/odaklıyor.

3. **Sessiz veri kaybı riski**
   - `putJson` localStorage hatalarını yutuyordu ve UI “Kaydedildi” diyebiliyordu.
   - Yazma işlemi artık boolean sonuç döndürüyor; not, görev, toplantı ve sesli not akışları başarısız kaydı bildiriyor.

4. **Toplantı aksiyonlarında duplicate görev**
   - Aynı aksiyon düğmesine tekrar basıldığında aynı başlık+tarih görevi yeniden eklenebiliyordu.
   - Aynı görev anahtarı tekrar eklenmiyor.

5. **Takvim kullanım sürtünmesi**
   - Takvimden gün seçmek yalnız tarihi değiştiriyordu.
   - Seçim artık görev oluşturma alanını görünür hale getirip başlık girişine odaklıyor.

6. **Yedek geri yükleme güvenliği**
   - Dosya ve kayıt boyutu sınırsızdı.
   - 8 MB dosya, 100 kayıt grubu ve 2 MB tek kayıt sınırı eklendi; restore yazma hatasında geri alma deneniyor.

7. **SVG local-first açığı**
   - Script ve event handler temizlenmesine rağmen harici `href`, CSS `@import` ve dış `url(...)` referansları kalabiliyordu.
   - Ağ referansları kaldırılıyor; yalnız yerel fragmentler ve gömülü raster data image referansları korunuyor.
   - Favicon akışındaki SVG yüklemeleri de aynı sanitizer'dan geçiyor.

## Ayrı milestone gerektiren teknik borç

- `src/styles.css` geçmiş tasarım katmanlarını üst üste taşıdığı için büyük. Görsel regresyon riski nedeniyle CSS konsolidasyonu ayrı paket olmalı.
- Repository'de lockfile yok. Transitif bağımlılık çözümü tam deterministik değil; lockfile + `npm ci` ayrı release-engineering paketinde yapılmalı.
- Gerçek tarayıcı E2E smoke testi henüz yok. Kritik akışlar için browser smoke test ayrı kalite paketinde eklenmeli.
