# 📚 UniLib Management System - Kurulum Rehberi

Bu proje, bir üniversite kütüphanesinin üye yönetimi, kitap ödünç alma/iade, ceza takibi ve dinamik raporlama süreçlerini yöneten tam kapsamlı bir otomasyon sistemidir.

## 🛠 Teknik Yığın (Tech Stack)

Backend: NestJS (Node.js Framework)

Frontend: React & Lucide Icons

Veritabanı: MySQL (Stored Procedures, Triggers, Views)

Raporlama: Excel (XLSX) ve PDF (pdfmake) çıktı desteği

## 📋 Gereksinimler (Prerequisites)

Projeyi çalıştırmadan önce sisteminizde şu araçların kurulu olduğundan emin olun:

MySQL Server (v8.0+): Veritabanı motoru.

Node.js (v18+): Backend ve Frontend çalışma ortamı.

Git: Projeyi klonlamak için.

## 🛠 Adım 1: Veritabanı Kurulumu ve SQL Çalıştırma

SQL dosyalarını terminal (CMD veya PowerShell) üzerinden çalıştırmak için aşağıdaki adımları izleyin.

### 1.1. Projeyi İndirme
```
# Projeyi klonlayın
git clone https://github.com/Mozaaaik/library-desktop.git
# Proje klasörüne girin
cd library-desktop
```

### 1.2. MySQL Terminaline Giriş

Önce terminalinizi açın ve MySQL'e bağlanın (Şifreniz sorulacaktır):
```
mysql -u root -p
```
### 1.3. SQL Dosyalarını Sırayla Yükleme

Dosyaların bulunduğu klasöre giderek terminal üzerinden şu komutları sırasıyla çalıştırın. Sıralama veri bütünlüğü için kritiktir:

Şemayı Oluşturun:

``` 
mysql -u root -p < 01_schema.sql
```

Prosedürleri Ekleyin: 
```
mysql -u root -p UniversiteKutuphaneDB < 02_procedures.sql
```

Triggerları Ekleyin:
```
mysql -u root -p UniversiteKutuphaneDB < 03_triggers.sql
```

Örnek Verileri (Seed) Yükleyin: 
```
mysql -u root -p UniversiteKutuphaneDB < 04_seed.sql
```

Not: Prosedür ve Trigger dosyaları // delimiter yapısını kullanır. Terminal üzerinden < işareti ile içeri aktarmak, bu özel karakterlerin hatasız işlenmesini sağlar.

## ⚙️ Adım 2: Backend (NestJS) Yapılandırması
backend klasörüne girin: 
```
# Eğer proje dizinindeyseniz(library-desktop) bu kodu yazın değilseniz appsin önüne library-desktop/ ekleyin
cd apps/backend 
```

Bağımlılıkları yükleyin: 
```
npm install
```

Veritabanı Bağlantısı: src/db/mysql.ts dosyasını açarak user, password ve database bilgilerini kendi yerel ayarlarınıza göre güncelleyin.

Sunucuyu başlatın: 
```
npm run start:dev
```

## 💻 Adım 3: Frontend (React) Yapılandırması

frontend klasörüne girin: 
```
# Eğer proje dizinindeyseniz(library-desktop) bu kodu yazın değilseniz appsin önüne library-desktop/ ekleyin
cd apps/frontend
```

Bağımlılıkları yükleyin: 
```
npm install
```

Uygulamayı başlatın: 
```
npm start
```

Uygulama tarayıcınızda otomatik olarak http://localhost:3000 adresinde açılacaktır.

## 🚀 Öne Çıkan Teknik Özellikler

Dinamik Sorgu Paneli: Kullanıcının seçtiği kriterlere (Başlık, yazar, kategori) göre anlık SQL inşası yapan güvenli arama motoru.

Otomatik Ceza ve Gecikme Sabitleme: Kitap iade edildiği an gecikme günü hesaplanır ve TeslimTarihi girilerek cezanın ilerlemesi durdurulur.

Akıllı Sıralama: Ceza listesinde en son işlem gören (yeni eklenen veya yeni ödenen) kayıtlar otomatik olarak en üstte listelenir.

Veri Dışa Aktarımı: Excel ve PDF olarak indirme desteği.

## 💡 İpucu
Eğer terminalde mysql komutu tanınmıyorsa, MySQL'in kurulu olduğu bin klasörünü (Örn: C:\Program Files\MySQL\MySQL Server 8.0\bin) sisteminizin PATH ortam değişkenlerine eklemeniz gerekir.
