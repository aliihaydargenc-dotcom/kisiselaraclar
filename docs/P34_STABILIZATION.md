# P34 — Stabilizasyon, Mimari Temizlik ve Ürün Bütünlüğü

## Amaç

P34'ün amacı araç sayısını artırmak değil, mevcut 68 araç ve kişisel çalışma alanının altında güvenilir bir platform katmanı oluşturmaktır. Değişiklikler milestone halinde toplanır; küçük kozmetik commit zinciri oluşturulmaz.

## P0 kararları

1. **Bulut senkronu kısmi başarı sayılmaz.** Appwrite longtext bütçesi aşıldığında bazı localStorage anahtarlarını sessizce düşürüp kalanları yazmak yasaktır. P34 ilk paketi bu durumda cloud write'ı durdurur, yerel veriyi korur ve açık hata durumu üretir.
2. **Sync v2 entity tabanlı olacaktır.** Not, görev ve toplantı kayıtları sonraki P34 dalgasında tek JSON blob yerine kayıt seviyesinde Appwrite tablolara taşınacaktır. Her kayıt `id`, `updatedAt`, `deletedAt`/tombstone ve sürüm bilgisi taşıyacaktır.
3. **Sesli yazma event-result tabanlıdır.** Aynı SpeechRecognition result index'i append edilmez; güncellenir. Tarayıcı otomatik restart yaptığında oturum segmenti commit edilir ve kuyruk overlap'i ile birleştirilir.
4. **Mobil platform DOM'u sürekli izlemeyecek.** Global subtree MutationObserver kaldırılır. UI değişimleri `kisiselaraclar:ui-rendered` olayıyla bildirilir.
5. **Appwrite canonical production'dır.** GitHub Pages yalnız fallback/mirror olarak kalır.

## İlk paket kapsamı

- Speech transcript buffer ve unit testleri.
- Sync payload limit fail-safe ve kullanıcıya sync state olayı.
- Mobil bağlantı/senkron durumunun doğru ayrıştırılması.
- Global mobil MutationObserver'ın kaldırılması.
- Service Worker cache stratejisinin P34'e yükseltilmesi.
- WebKit/iPhone smoke projesi.
- CSS `!important` borcunun büyümesini engelleyen CI guard.
- Hosting dokümantasyonunun gerçek production hattıyla eşleştirilmesi.

## Sonraki dalgalar

### Sync v2
Appwrite'ta entity tabloları, cihazlar arası kayıt seviyesinde merge, silme tombstone'ları, ilk localStorage migration ve conflict testleri.

### Lifecycle
Tool mount/unmount sözleşmesi, timer/listener/SpeechRecognition cleanup, büyük `p17-workspace.js` modülünün voice/home/search/backup olarak bölünmesi.

### CSS consolidation
Token → shell → component → tool sahipliği; `!important` sayısını yeni ekleme yapmadan kademeli azaltma; tek breakpoint haritası.

### PWA/performance
Build revisionlı precache manifest, offline fallback, 192/512 maskable icon seti, home-route performans bütçesi ve ağır PDF/OCR/media modüllerinin ilk yüke karışmadığının testi.

## Kabul kriterleri

- Unit test, syntax, CSS ownership, production build ve size budget PASS.
- Chromium desktop, Chromium mobile ve WebKit mobile kritik akışlar PASS.
- 60 KB üstü senkron payload cloud state'i kısmi veriyle overwrite etmez.
- Mobil ana ekran renderları MutationObserver gerektirmez.
- Aynı speech result index'i metinde duplicate üretmez.


## P34.2 — Sync v2 ve lifecycle

Durum: uygulanıyor / release kapısından geçecek.

- `workspace_notes` ve `workspace_tasks` Appwrite tabloları oluşturuldu.
- Her kayıt `local_id`, `updated_at`, `deleted_at` ve `payload` taşır.
- Row security açık; istemci yalnız kendi satırlarını okuyup güncelleyebilir.
- İlk açılışta legacy `sync_state` önce hydrate edilir, ardından entity migration çalışır.
- Migration başarıyla tamamlandıktan sonra not ve görev koleksiyonları legacy blobtan çıkarılır; `sync_state` toplantı taslağı ve diğer küçük local-first kayıtlar için fallback olarak kalır.
- Silmeler tombstone ile korunur; başka cihazdaki eski kayıt silinen içeriği yeniden diriltmez.
- Çakışma çözümü kayıt bazında `updatedAt` üzerinden last-write-wins kullanır.
- 30 saniyelik arka plan kontrolü yalnız entity tablolarını çeker; legacy satırı gereksiz yere yeniden yazmaz.
- Araç ekranları cleanup fonksiyonu döndürebilir. Ana router yeni araca/home'a geçerken eski cleanup'ı çalıştırır.
- Not editörü debounce ve `pagehide` listener'ını unmount sırasında temizler.
- Sesli yazma hem ana ekranda hem `voice-note` aracında aynı `SpeechTranscriptBuffer` motorunu kullanır.
- Kayıt sürerken textarea düzenlenebilir. Kullanıcının elle düzelttiği mevcut recognition indexi final sonuç geldiğinde yeniden append edilmez.
