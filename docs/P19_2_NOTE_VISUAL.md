# P19.2 Quick Note Visual Unification

Ekran görüntüsü denetiminde üç ana sorun vardı:

1. Hızlı Not başlığı global tool-open editorial stilini miras alıp gereğinden büyük görünüyordu.
2. Sidebar/takvim ve editör farklı border/radius dilleri kullanıyordu.
3. Editör CSS Grid satırları, sidebar yüksekliğine göre stretch olup başlık-toolbar-metin arasında büyük boşluklar üretiyordu.

Çözüm:
- Quick Note'a özel kompakt tool header.
- Entegrasyon şeridi Quick Note görünümünde gizli.
- 320px sidebar + esnek editor.
- Her iki panel 22px radius, aynı border ve yüzey dili.
- Editor grid: meta / title / toolbar / content / actions.
- 10px kontrollü dikey ritim.
- Rounded input, toolbar ve button sistemi.
- Takvim/list view switch segment control.
- Mobilde 36px başlık ve tek kolon düzen.
