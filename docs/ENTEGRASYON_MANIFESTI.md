# Entegrasyon Manifesti

Bu dosya ürün içinde kullanılan dış motorların kaynak, lisans ve veri davranışını kayıt altında tutar.

## PapaParse

- Kaynak: https://github.com/mholt/PapaParse
- Kullanılan sürüm: **5.7.0**
- Lisans: **MIT**
- Kullanım: CSV ayrıştırma, delimiter algılama, CSV → JSON
- Çalışma yeri: **browser**
- Ağ gereksinimi: **yok**
- Kullanıcı verisi cihazdan çıkar mı?: **hayır**
- Entegrasyon biçimi: npm dependency, sürüm sabit
- Neden seçildi?: Olgun CSV parser; bozuk/büyük CSV girdilerinde native split yaklaşımından daha güvenilir, delimiter algılama ve header desteği hazır.
- Alternatif: Kendi parser'ımızı yazmak. Reddedildi; CSV quoting/escaping/delimiter edge-case'lerini gereksiz yere yeniden üretir.
- Testler: delimiter algılama, Türkçe kolon adı, CSV→JSON, manifest güvenlik kontrolü.
- Kaldırma/fallback: Entegrasyon tek modülde tutulur; katalogtan ve `tool-engines.js` importundan kaldırılabilir.

## Native Web Platform

Base64, URL, JSON, metin, SHA-256 ve tarih araçlarında tarayıcının yerleşik API'leri kullanılır.

- Harici dependency: yok
- Ağ: yok
- Veri dışarı çıkışı: yok

## Bundle bütçesi

İlk koruma:
- JavaScript: maksimum **250 KB** (build çıktısındaki toplam JS)
- CSS: maksimum **100 KB**

Bu bütçe ağır PDF/medya motorları geldiğinde lazy-load/chunk stratejisini zorlamak için bilinçli olarak düşük tutulmuştur.
