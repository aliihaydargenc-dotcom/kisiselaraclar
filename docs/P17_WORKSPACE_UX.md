# P17 Çalışma Merkezi — UX kararı

P17'nin ana hedefi yeni araç sayısını artırmak değil, mevcut 68 aracı daha az düşünerek kullanılır hale getirmektir.

## Ürün kararı

Ana sayfa artık yalnız katalog değildir. İlk kullanılabilir yüzey **Bugün** çalışma merkezidir:

- bugünkü ve gecikmiş görevleri gösterir,
- son not veya toplantı taslağına dönüş verir,
- Dosyayla Başla, Yeni Not, Görev, Toplantı, Belge Tara ve PDF İmzala eylemlerini tek dokunuşa indirir,
- tüm local-first veriyi tek JSON dosyasında yedekler ve geri yükler,
- global araç aramasını not/görev/toplantı içeriğiyle birleştirir.

Araç kataloğu korunur ancak ilk karar noktası olmaktan çıkar.

## Tasarım ilkeleri

1. Önce eylem, sonra açıklama.
2. Mobilde ilk ekranda gerçek iş başlatılabilmeli.
3. Sayılar ve teknik bilgiler yalnız karar vermeye yardım ediyorsa görünmeli.
4. Yeni yüzey mevcut P16 localStorage verisini yeniden kullanmalı; kullanıcıdan yeniden kurulum istememeli.
5. Yedekleme kullanıcı kontrolünde olmalı; sunucu senkronizasyonu eklenmemeli.
6. Tasarım mevcut P11/P12 kimliğini korurken daha sakin bir çalışma alanı üretmeli.

## Referans gözlemler

- Clarity: local-first takvim/görev ürünlerinde “today / overdue / quick add” ayrımının görev başlatmayı hızlandırması.
  https://github.com/piyush-daga/clarity
- Weekplan: küçük mobil-first PWA'larda hesap gerektirmeyen, localStorage tabanlı planlama yaklaşımı.
  https://github.com/rochdesigns/weekplan
- Third Screen: program, görev ve notları tek bakışta bir araya getiren “glanceable” dashboard yaklaşımı.
  https://github.com/ericvaish/thirdscreen

Bu projelerden kod kopyalanmadı; yalnız ürün/etkileşim desenleri incelendi.
