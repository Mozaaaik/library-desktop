-- ==========================================
-- 1. KATEGORİLER (7 Farklı Kategori)
-- ==========================================
INSERT INTO Kategoriler (KategoriAdi) VALUES 
('Dünya Klasikleri'),         -- ID: 1
('Bilim Kurgu & Fantastik'),  -- ID: 2
('Tarih ve Araştırma'),       -- ID: 3
('Bilgisayar ve Teknoloji'),  -- ID: 4
('Kişisel Gelişim'),          -- ID: 5
('Felsefe'),                  -- ID: 6
('Süreli Yayınlar (Dergi)');  -- ID: 7

-- ==========================================
-- 2. PERSONEL (Admin ve Görevliler)
-- ==========================================
INSERT INTO Personel (KullaniciAdi, Sifre, AdSoyad, Rol) VALUES 
('admin', '1234', 'Furkan Yönetici', 'Admin'),
('ali', '1234', 'Ali Kütüphaneci', 'Gorevli'),
('ayse', '1234', 'Ayşe Görevli', 'Gorevli'),
('mehmet', '1234', 'Mehmet Nöbetçi', 'Gorevli');

-- ==========================================
-- 3. KİTAPLAR 
-- ==========================================
-- Not: MevcutAdet'i ToplamAdet ile aynı başlatıyoruz. 
-- Aşağıdaki ödünç işlemleri (INSERT) çalıştığında Triggerlar stokları otomatik düşürecek.

INSERT INTO Kitaplar (KategoriID, Baslik, Yazar, Yayinevi, ISBN, ToplamAdet, MevcutAdet) VALUES 
-- 1. Kategori: Dünya Klasikleri
(1, 'Suç ve Ceza', 'Fyodor Dostoyevski', 'İş Bankası Yayınları', '9789754589023', 10, 10),
(1, 'Sefiller', 'Victor Hugo', 'İletişim Yayınları', '9789750500732', 5, 5),
(1, '1984', 'George Orwell', 'Can Yayınları', '9789750718533', 15, 15),
(1, 'Kürk Mantolu Madonna', 'Sabahattin Ali', 'YKY', '9789753638029', 12, 12),

-- 2. Kategori: Bilim Kurgu & Fantastik
(2, 'Dune', 'Frank Herbert', 'İthaki Yayınları', '9786053754794', 8, 8),
(2, 'Yüzüklerin Efendisi: Yüzük Kardeşliği', 'J.R.R. Tolkien', 'Metis Yayınları', '9789753420342', 6, 6),
(2, 'Fahrenheit 451', 'Ray Bradbury', 'İthaki Yayınları', '9786053757818', 4, 4),
(2, 'Otostopçunun Galaksi Rehberi', 'Douglas Adams', 'Alfa Yayınları', '9786051067605', 5, 5),

-- 3. Kategori: Tarih ve Araştırma
(3, 'Nutuk', 'Mustafa Kemal Atatürk', 'Yapı Kredi Yayınları', '9789750829931', 20, 20),
(3, 'Sapiens', 'Yuval Noah Harari', 'Kolektif Kitap', '9786055029043', 7, 7),
(3, 'Türklerin Tarihi', 'İlber Ortaylı', 'Timaş Yayınları', '9786050819434', 8, 8),

-- 4. Kategori: Bilgisayar ve Teknoloji
(4, 'Clean Code', 'Robert C. Martin', 'Pearson', '9780132350884', 3, 3),
(4, 'Introduction to Algorithms', 'Thomas H. Cormen', 'MIT Press', '9780262033848', 2, 2),
(4, 'Design Patterns', 'Erich Gamma', 'Addison-Wesley', '9780201633610', 2, 2),
(4, 'Head First Java', 'Kathy Sierra', 'O Reilly', '9780596009205', 4, 4),

-- 5. Kategori: Kişisel Gelişim 
(5, 'Atomik Alışkanlıklar', 'James Clear', 'Pegasus Yayınları', '9786052998380', 10, 10),
(5, 'Simyacı', 'Paulo Coelho', 'Can Yayınları', '9789750726439', 9, 9),

-- 6. Kategori: Felsefe 
(6, 'Devlet', 'Platon', 'İş Bankası Yayınları', '9789754587647', 6, 6),
(6, 'Böyle Buyurdu Zerdüşt', 'Friedrich Nietzsche', 'İş Bankası Yayınları', '9786053320647', 5, 5),

-- 7. Kategori: Süreli Yayınlar
(7, 'Bilim ve Teknik - Ocak 2024', 'TÜBİTAK', 'TÜBİTAK Yayınları', '9771300338001', 20, 20),
(7, 'National Geographic - Sayı 12', 'NatGeo', 'National Geographic', '9771302837007', 10, 10);

-- ==========================================
-- 4. ÜYELER (Öğrenciler)
-- ==========================================
INSERT INTO Uyeler (OgrenciNo, Ad, Soyad, Telefon, Email, Durum) VALUES 
('20241001', 'Ahmet', 'Yılmaz', '5551002030', 'ahmet@ogrenci.edu.tr', 'Aktif'),
('20241002', 'Zeynep', 'Demir', '5552003040', 'zeynep@ogrenci.edu.tr', 'Aktif'),
('20241003', 'Caner', 'Erkin', '5553004050', 'caner@ogrenci.edu.tr', 'Aktif'),
('20242001', 'Elif', 'Kaya', '5554005060', 'elif@ogrenci.edu.tr', 'Aktif'),
('20242002', 'Burak', 'Yılmaz', '5555006070', 'burak@ogrenci.edu.tr', 'Aktif'),
('20243001', 'Selin', 'Şahin', '5556007080', 'selin@ogrenci.edu.tr', 'Aktif'),
('20243002', 'Mert', 'Çelik', '5557008090', 'mert@ogrenci.edu.tr', 'Aktif'),
('20243003', 'Gizem', 'Aslan', '5558009000', 'gizem@ogrenci.edu.tr', 'Aktif');

-- ==========================================
-- 5. ÖDÜNÇ İŞLEMLERİ (Senaryolar)
-- ==========================================
-- Bu işlemler eklendiğinde TR_ODUNC_INSERT trigger'ı çalışır ve stokları düşürür.

-- SENARYO 1: Ahmet "Dune" (KitapID: 5) kitabını almış, süresi devam ediyor.
INSERT INTO OduncIslemleri (UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi) 
VALUES (1, 5, 2, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY));

-- SENARYO 2: Zeynep "Nutuk" (KitapID: 9) kitabını almış, süresi devam ediyor.
INSERT INTO OduncIslemleri (UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi) 
VALUES (2, 9, 2, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY));

-- SENARYO 3: Caner "Clean Code" (KitapID: 12) almış ama TESLİM TARİHİ GEÇMİŞ (Gecikme)
-- Veriliş: 25 gün önce. Son Teslim: 10 gün önce.
INSERT INTO OduncIslemleri (UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi) 
VALUES (3, 12, 3, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY));

-- SENARYO 4: Elif "1984" (KitapID: 3) almış, teslim tarihi geçmiş.
INSERT INTO OduncIslemleri (UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi) 
VALUES (4, 3, 3, '2023-11-01', '2023-11-16');

-- SENARYO 5: Selin "Atomik Alışkanlıklar" (KitapID: 16) almış. (Yeni Kategori Testi)
INSERT INTO OduncIslemleri (UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi) 
VALUES (6, 16, 2, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY));

-- ==========================================
-- 6. GEÇMİŞ CEZALAR (Borçlu Üye Testi)
-- ==========================================
-- Simülasyon: Mert (ID: 7) daha önce "Sefiller" (KitapID: 2) kitabını geç getirmiş olsun.
-- Önce işlemi kapatalım ki stok düzelsin, sonra cezayı keselim.

-- 6.1. Kapanmış işlem (Mert kitabı aldı ve verdi)
INSERT INTO OduncIslemleri (IslemID, UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi, TeslimTarihi) 
VALUES (100, 7, 2, 2, '2023-10-01', '2023-10-15', '2023-10-20'); 

-- 6.2. Kitap geri geldiği için trigger stok artırdı. 
-- Ancak biz insert anında stok düşmedik (çünkü tek seferde insert ettik), 
-- bu yüzden yapay olarak stok dengesini bozmamak adına küçük bir düzeltme yapmıyoruz 
-- çünkü sistem zaten doğru çalışacak (Insert -> Trigger stok düşürür mü? Hayır, teslim tarihi dolu geldiği için düşürmez ama trg_OduncTeslim update bekler...)
-- DÜZELTME: Seed dosyasında manuel insert yaparken trigger mantığını korumak zordur.
-- Basitçe Mert'e doğrudan ceza yazalım, stokla oynamayalım.

INSERT INTO Cezalar (IslemID, UyeID, Tutar, Aciklama) 
VALUES (100, 7, 25.00, '5 gün gecikme cezası (Geçmiş Dönem)');
-- Not: Bu INSERT, TR_CEZA_INSERT trigger'ını tetikler ve Mert'in borcunu 25 TL yapar.