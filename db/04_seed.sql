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
-- 4) ÜYELER (ToplamBorc seed'de yazmıyoruz)
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

UPDATE Uyeler SET ToplamBorc = 0 WHERE ToplamBorc IS NULL;

-- ==========================================
-- 5) ÖDÜNÇLER
-- ==========================================
INSERT INTO OduncIslemleri
(IslemID, UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi, TeslimTarihi)
VALUES
(400, 50,  7, 2, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL  8 DAY), NULL),
(401, 51, 12, 2, DATE_SUB(NOW(), INTERVAL 33 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY), NULL),
(402, 52, 10, 2, DATE_SUB(NOW(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY), NULL),
(403, 54,  5, 2, DATE_SUB(NOW(), INTERVAL 26 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), NULL),
(404, 55, 16, 2, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL  6 DAY), NULL),
(405, 56, 13, 3, DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY), NULL),
(406, 58,  6, 2, DATE_SUB(NOW(), INTERVAL 29 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY), NULL),
(407, 59, 15, 3, DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), NULL),
(408, 60, 11, 2, DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL  7 DAY), NULL),
(409, 61, 18, 2, DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL  6 DAY), NULL),

(410, 50,  2, 2, DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
(411, 51,  4, 3, DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 35 DAY)),
(412, 53,  1, 3, DATE_SUB(NOW(), INTERVAL 34 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL  9 DAY)),
(413, 57,  9, 2, DATE_SUB(NOW(), INTERVAL 31 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
(414, 62,  8, 3, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL  6 DAY));

-- ==========================================
-- 6) CEZALAR (HESAPLA: gecikmeGunu * 5TL)
-- Kural:
--   - Teslim edildiyse gecikme = Teslim - SonTeslim
--   - Teslim edilmediyse gecikme = Bugün - SonTeslim
--   - gecikme <= 0 ise ceza yok (insert edilmez)
-- Durum:
--   - Teslim edilmediyse -> Unpaid
--   - Teslim edildiyse    -> Paid
-- ==========================================

-- (opsiyonel) Cezalar tablosunu boşaltmak istersen:
-- TRUNCATE TABLE Cezalar;

INSERT INTO Cezalar (IslemID, UyeID, Tutar, Aciklama, OlusturmaTarihi, Durum, OdemeTarihi)
SELECT
  oi.IslemID,
  oi.UyeID,
  (GREATEST(
     DATEDIFF(
       DATE(COALESCE(oi.TeslimTarihi, NOW())),
       DATE(oi.SonTeslimTarihi)
     ), 0
   ) * 5.00) AS Tutar,
  CONCAT(
    'Gecikme: ',
    GREATEST(
      DATEDIFF(
        DATE(COALESCE(oi.TeslimTarihi, NOW())),
        DATE(oi.SonTeslimTarihi)
      ), 0
    ),
    ' gün x 5TL'
  ) AS Aciklama,
  NOW() AS OlusturmaTarihi,
  CASE
    WHEN oi.TeslimTarihi IS NULL THEN 'Unpaid'
    ELSE 'Paid'
  END AS Durum,
  CASE
    WHEN oi.TeslimTarihi IS NULL THEN NULL
    ELSE oi.TeslimTarihi
  END AS OdemeTarihi
FROM OduncIslemleri oi
WHERE
  oi.SonTeslimTarihi IS NOT NULL
  AND GREATEST(
    DATEDIFF(
      DATE(COALESCE(oi.TeslimTarihi, NOW())),
      DATE(oi.SonTeslimTarihi)
    ), 0
  ) > 0;
