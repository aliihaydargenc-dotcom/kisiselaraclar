# P15 Görsel + Geliştirici Laboratuvarı

P15, Kişisel Araçlar'ı yalnız dosya işlemleri yapan bir sayfadan, birbirine bağlanabilen local-first web araç kutusuna genişletir. Katalog 45 araçtan 60 araca çıkar.

## Ürün kararı

Yeni araçlar iki kümeye ayrılır:

- Görsel: görselden renk paleti, piksel renk seçici, SVG incele/temizle, SVG → PNG, favicon/app icon paketi, en-boy oranı, şeffaflık analizi.
- Geliştirici: JSON Diff, Regex Playground, UUID v4, JWT payload okuyucu, Markdown → HTML, HTML minify, CSS minify, HTML Entity encode/decode.

Var olan URL encoder, Unix timestamp, JSON formatter ve SHA-256 araçları tekrar eklenmedi.

## UX ilkeleri

- Ana sayfa artık dosya sitesi değil, 60 küçük uzman araçtan oluşan bir web araç kutusu olarak konumlanır.
- Görsel ve Geliştirici kategorileri katalogda üst sıralara alınır.
- P15 arayüzleri ikinci seviye lazy-load edilir: ana P15 yönlendirici yalnız gerektiğinde Görsel veya Geliştirici modülünü yükler.
- Uygun araçlarda “Sonraki adım” bağlantıları vardır. Görselden Renk Paleti seçilen rengi `Site Renk Sistemi` aracına aktarabilir.
- Mobilde editörler tek kolona, aksiyonlar dokunma dostu geniş kontrollere döner.

## Teknik ve güvenlik kararları

- Görsel örnekleme Canvas `getImageData()` üzerinden cihazda yapılır.
- UUID v4 üretiminde Web Crypto `crypto.randomUUID()` veya `getRandomValues()` kullanılır.
- JWT aracı yalnız header/payload içeriğini okur; imza doğruladığını iddia etmez.
- SVG önizlemeden önce script, event handler ve aktif gömülü içerikler temizlenir; önizleme `<img>` bağlamında yapılır.
- Markdown aracı ham HTML'i escape eder; yalnız sınırlı Markdown öğeleri HTML'e çevrilir.
- Favicon ZIP üretimi için projede zaten bulunan `fflate` kullanılır; yeni runtime bağımlılığı eklenmez.

## Referanslar

- MDN CanvasRenderingContext2D.getImageData: https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/getImageData
- MDN Crypto.randomUUID: https://developer.mozilla.org/docs/Web/API/Crypto/randomUUID
- MDN SVG as an image: https://developer.mozilla.org/docs/Web/SVG/Guides/SVG_as_an_image
- WCAG 2.2 target size: https://www.w3.org/TR/WCAG22/#target-size-minimum
