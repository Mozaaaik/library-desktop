USE UniversiteKutuphaneDB;

-- ==========================================
-- 1) KATEGORİLER
-- ==========================================
INSERT INTO Kategoriler (KategoriAdi) VALUES 
('Dünya Klasikleri'),
('Bilim Kurgu & Fantastik'),
('Tarih ve Araştırma'),
('Bilgisayar ve Teknoloji'),
('Kişisel Gelişim'),
('Felsefe'),
('Süreli Yayınlar (Dergi)');

-- ==========================================
-- 2) PERSONEL
-- ==========================================
INSERT INTO Personel (KullaniciAdi, Sifre, AdSoyad, Rol) VALUES 
('admin',  '1234', 'Furkan Yönetici', 'Admin'),
('ali',    '1234', 'Ali Kütüphaneci', 'Gorevli'),
('ayse',   '1234', 'Ayşe Görevli',    'Gorevli'),
('mehmet', '1234', 'Mehmet Nöbetçi',  'Gorevli');

-- ==========================================
-- 3) KİTAPLAR
-- KitapID sırası:
--  1 Suç ve Ceza
--  2 Sefiller
--  3 1984
--  4 Kürk Mantolu Madonna
--  5 Dune
--  6 LOTR
--  7 Fahrenheit 451
--  8 Otostopçu
--  9 Nutuk
-- 10 Sapiens
-- 11 Türklerin Tarihi
-- 12 Clean Code
-- 13 Introduction to Algorithms
-- 14 Design Patterns
-- 15 Head First Java
-- 16 Atomik Alışkanlıklar
-- 17 Simyacı
-- 18 Devlet
-- 19 Böyle Buyurdu Zerdüşt
-- 20 Bilim ve Teknik
-- 21 National Geographic
-- ==========================================
INSERT INTO Kitaplar (KategoriID, Baslik, Yazar, Yayinevi, ISBN, ToplamAdet, MevcutAdet) VALUES 
(1, 'Suç ve Ceza', 'Fyodor Dostoyevski', 'İş Bankası Yayınları', '9789754589023', 10, 10),
(1, 'Sefiller', 'Victor Hugo', 'İletişim Yayınları', '9789750500732', 5, 5),
(1, '1984', 'George Orwell', 'Can Yayınları', '9789750718533', 15, 15),
(1, 'Kürk Mantolu Madonna', 'Sabahattin Ali', 'YKY', '9789753638029', 12, 12),

(2, 'Dune', 'Frank Herbert', 'İthaki Yayınları', '9786053754794', 8, 8),
(2, 'Yüzüklerin Efendisi: Yüzük Kardeşliği', 'J.R.R. Tolkien', 'Metis Yayınları', '9789753420342', 6, 6),
(2, 'Fahrenheit 451', 'Ray Bradbury', 'İthaki Yayınları', '9786053757818', 4, 4),
(2, 'Otostopçunun Galaksi Rehberi', 'Douglas Adams', 'Alfa Yayınları', '9786051067605', 5, 5),

(3, 'Nutuk', 'Mustafa Kemal Atatürk', 'Yapı Kredi Yayınları', '9789750829931', 20, 20),
(3, 'Sapiens', 'Yuval Noah Harari', 'Kolektif Kitap', '9786055029043', 7, 7),
(3, 'Türklerin Tarihi', 'İlber Ortaylı', 'Timaş Yayınları', '9786050819434', 8, 8),

(4, 'Clean Code', 'Robert C. Martin', 'Pearson', '9780132350884', 3, 3),
(4, 'Introduction to Algorithms', 'Thomas H. Cormen', 'MIT Press', '9780262033848', 2, 2),
(4, 'Design Patterns', 'Erich Gamma', 'Addison-Wesley', '9780201633610', 2, 2),
(4, 'Head First Java', 'Kathy Sierra', 'O Reilly', '9780596009205', 4, 4),

(5, 'Atomik Alışkanlıklar', 'James Clear', 'Pegasus Yayınları', '9786052998380', 10, 10),
(5, 'Simyacı', 'Paulo Coelho', 'Can Yayınları', '9789750726439', 9, 9),

(6, 'Devlet', 'Platon', 'İş Bankası Yayınları', '9789754587647', 6, 6),
(6, 'Böyle Buyurdu Zerdüşt', 'Friedrich Nietzsche', 'İş Bankası Yayınları', '9786053320647', 5, 5),

(7, 'Bilim ve Teknik - Ocak 2024', 'TÜBİTAK', 'TÜBİTAK Yayınları', '9771300338001', 20, 20),
(7, 'National Geographic - Sayı 12', 'NatGeo', 'National Geographic', '9771302837007', 10, 10);

-- ==========================================
-- 4) ÜYELER (Futbolcular)
-- UyeID = 50..63
-- ==========================================
INSERT INTO Uyeler (UyeID, OgrenciNo, Ad, Soyad, Telefon, Email, Durum)
VALUES
(50, '20245001', 'Lionel',    'Messi',      '5554500101', 'lionel.messi@ogrenci.edu.tr',      'Aktif'),
(51, '20245002', 'Cristiano', 'Ronaldo',    '5554500102', 'cristiano.ronaldo@ogrenci.edu.tr', 'Aktif'),
(52, '20245003', 'Xavi',      'Hernandez',  '5554500103', 'xavi.hernandez@ogrenci.edu.tr',    'Aktif'),
(53, '20245004', 'Andres',    'Iniesta',    '5554500104', 'andres.iniesta@ogrenci.edu.tr',    'Aktif'),
(54, '20245005', 'Sergio',    'Ramos',      '5554500105', 'sergio.ramos@ogrenci.edu.tr',      'Aktif'),
(55, '20245006', 'Gerard',    'Pique',      '5554500106', 'gerard.pique@ogrenci.edu.tr',      'Aktif'),
(56, '20245007', 'Karim',     'Benzema',    '5554500107', 'karim.benzema@ogrenci.edu.tr',     'Aktif'),
(57, '20245008', 'Iker',      'Casillas',   '5554500108', 'iker.casillas@ogrenci.edu.tr',     'Aktif'),
(58, '20245009', 'Neymar',    'Jr',         '5554500109', 'neymar.jr@ogrenci.edu.tr',         'Aktif'),
(59, '20245010', 'Luis',      'Suarez',     '5554500110', 'luis.suarez@ogrenci.edu.tr',       'Aktif'),
(60, '20245011', 'Luka',      'Modric',     '5554500111', 'luka.modric@ogrenci.edu.tr',       'Aktif'),
(61, '20245012', 'Marcelo',   'Vieira',     '5554500112', 'marcelo.vieira@ogrenci.edu.tr',    'Aktif'),
(62, '20245013', 'Sergio',    'Busquets',   '5554500113', 'sergio.busquets@ogrenci.edu.tr',   'Aktif'),
(63, '20245014', 'Dani',      'Alves',      '5554500114', 'dani.alves@ogrenci.edu.tr',        'Aktif');

-- ==========================================
-- 5) ÖDÜNÇLER (Karışık: bazıları teslim edilmedi, bazıları geç teslim)
-- IslemID = 400..414
-- ==========================================
INSERT INTO OduncIslemleri
(IslemID, UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi, TeslimTarihi)
VALUES
-- Teslim edilmedi (Unpaid ağırlıklı)
(400, 50,  7, 2, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL  8 DAY), NULL),  -- Messi / Fahrenheit
(401, 51, 12, 2, DATE_SUB(NOW(), INTERVAL 33 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY), NULL),  -- Ronaldo / Clean Code
(402, 52, 10, 2, DATE_SUB(NOW(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY), NULL),  -- Xavi / Sapiens
(403, 54,  5, 2, DATE_SUB(NOW(), INTERVAL 26 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), NULL),  -- Ramos / Dune
(404, 55, 16, 2, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL  6 DAY), NULL),  -- Pique / Atomik
(405, 56, 13, 3, DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY), NULL),  -- Benzema / Intro Algo
(406, 58,  6, 2, DATE_SUB(NOW(), INTERVAL 29 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY), NULL),  -- Neymar / LOTR
(407, 59, 15, 3, DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), NULL),  -- Suarez / Head First Java
(408, 60, 11, 2, DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL  7 DAY), NULL),  -- Modric / Türklerin Tarihi
(409, 61, 18, 2, DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL  6 DAY), NULL),  -- Marcelo / Devlet

-- Geç teslim edilen (Paid örnekleri)
(410, 50,  2, 2, DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)), -- Messi / Sefiller
(411, 51,  4, 3, DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 35 DAY)), -- Ronaldo / Kürk Mantolu
(412, 53,  1, 3, DATE_SUB(NOW(), INTERVAL 34 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL  9 DAY)), -- Iniesta / Suç ve Ceza
(413, 57,  9, 2, DATE_SUB(NOW(), INTERVAL 31 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)), -- Casillas / Nutuk
(414, 62,  8, 3, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL  6 DAY)); -- Busquets / Otostopçu


-- ==========================================
-- 6) CEZALAR (Karışık: Paid + Unpaid, bazı kişilere 2 ceza)
-- Not: Durum ENUM değilse VARCHAR ise yine çalışır.
-- ==========================================
INSERT INTO Cezalar
(IslemID, UyeID, Tutar, Aciklama, OlusturmaTarihi, Durum, OdemeTarihi)
VALUES
-- Messi: 1 unpaid + 1 paid
(400, 50, 24.00, 'Fahrenheit 451 - Teslim edilmedi (gecikme)', NOW(), 'Unpaid', NULL),
(410, 50, 15.00, 'Sefiller - Geç teslim cezası',               DATE_SUB(NOW(), INTERVAL 20 DAY), 'Paid', DATE_SUB(NOW(), INTERVAL 18 DAY)),

-- Ronaldo: 1 unpaid + 1 paid
(401, 51, 55.00, 'Clean Code - Teslim edilmedi (gecikme)',     NOW(), 'Unpaid', NULL),
(411, 51, 18.00, 'Kürk Mantolu Madonna - Geç teslim',          DATE_SUB(NOW(), INTERVAL 35 DAY), 'Paid', DATE_SUB(NOW(), INTERVAL 33 DAY)),

-- Xavi: 1 unpaid
(402, 52, 32.00, 'Sapiens - Teslim edilmedi',                  NOW(), 'Unpaid', NULL),

-- Iniesta: 1 paid
(412, 53, 20.00, 'Suç ve Ceza - Geç teslim',                   DATE_SUB(NOW(), INTERVAL 9 DAY), 'Paid', DATE_SUB(NOW(), INTERVAL 7 DAY)),

-- Ramos: 1 unpaid (borç)
(403, 54, 40.00, 'Dune - Teslim edilmedi',                     NOW(), 'Unpaid', NULL),

-- Pique: 2 ceza (1 unpaid + 1 paid) -> karışık örnek
(404, 55, 18.00, 'Atomik Alışkanlıklar - Teslim edilmedi',     NOW(), 'Unpaid', NULL),
(413, 55, 12.00, 'Ek kayıt: Kısa gecikme (Nutuk işlemine bağlandı)', DATE_SUB(NOW(), INTERVAL 12 DAY), 'Paid', DATE_SUB(NOW(), INTERVAL 11 DAY)),

-- Benzema: 1 unpaid
(405, 56, 60.00, 'Introduction to Algorithms - Teslim edilmedi', NOW(), 'Unpaid', NULL),

-- Casillas: 1 paid
(413, 57, 25.00, 'Nutuk - Geç teslim',                         DATE_SUB(NOW(), INTERVAL 10 DAY), 'Paid', DATE_SUB(NOW(), INTERVAL 9 DAY)),

-- Neymar: 1 unpaid
(406, 58, 28.00, 'LOTR - Teslim edilmedi',                     NOW(), 'Unpaid', NULL),

-- Suarez: 2 ceza (1 unpaid + 1 paid) -> daha dolu
(407, 59, 45.00, 'Head First Java - Teslim edilmedi',          NOW(), 'Unpaid', NULL),
(412, 59, 10.00, 'Ek kayıt: Küçük gecikme cezası',             DATE_SUB(NOW(), INTERVAL 25 DAY), 'Paid', DATE_SUB(NOW(), INTERVAL 23 DAY)),

-- Modric: 1 unpaid
(408, 60, 22.00, 'Türklerin Tarihi - Teslim edilmedi',         NOW(), 'Unpaid', NULL),

-- Marcelo: 1 unpaid
(409, 61, 14.00, 'Devlet - Teslim edilmedi',                   NOW(), 'Unpaid', NULL),

-- Busquets: 1 paid
(414, 62, 12.00, 'Otostopçu - Geç teslim',                     DATE_SUB(NOW(), INTERVAL 6 DAY), 'Paid', DATE_SUB(NOW(), INTERVAL 5 DAY));
