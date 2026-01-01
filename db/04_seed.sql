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
  -- 2) PERSONEL Şifre : 654321 hashlenmiş hali veritabanında
  -- ==========================================
  INSERT INTO Personel (KullaniciAdi, Sifre, AdSoyad, Rol) VALUES 
  ('admin',  '$2b$10$8O/1.CB4GW2gA/BiVuMJ3Oip5kOiCvxbA9HibQKO2EitPtpz8lcEO', 'Furkan Yönetici', 'Admin'),
  ('ali',    '$2b$10$8O/1.CB4GW2gA/BiVuMJ3Oip5kOiCvxbA9HibQKO2EitPtpz8lcEO', 'Ali Kütüphaneci', 'Gorevli'),
  ('ayse',   '$2b$10$8O/1.CB4GW2gA/BiVuMJ3Oip5kOiCvxbA9HibQKO2EitPtpz8lcEO', 'Ayşe Görevli',    'Gorevli'),
  ('mehmet', '$2b$10$8O/1.CB4GW2gA/BiVuMJ3Oip5kOiCvxbA9HibQKO2EitPtpz8lcEO', 'Mehmet Nöbetçi',  'Gorevli');

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
  (50, '20245001', 'Ahmet',   'Yılmaz',   '5554500101', 'ahmet.yilmaz@ogrenci.edu.tr',   'Aktif'),
  (51, '20245002', 'Elif',    'Kaya',     '5554500102', 'elif.kaya@ogrenci.edu.tr',     'Aktif'),
  (52, '20245003', 'Mehmet',  'Demir',    '5554500103', 'mehmet.demir@ogrenci.edu.tr',  'Aktif'),
  (53, '20245004', 'Zeynep',  'Çetin',    '5554500104', 'zeynep.cetin@ogrenci.edu.tr',  'Aktif'),
  (54, '20245005', 'Mert',    'Şahin',    '5554500105', 'mert.sahin@ogrenci.edu.tr',    'Aktif'),
  (55, '20245006', 'Ayşe',    'Koç',      '5554500106', 'ayse.koc@ogrenci.edu.tr',      'Aktif'),
  (56, '20245007', 'Kerem',   'Aydın',    '5554500107', 'kerem.aydin@ogrenci.edu.tr',   'Aktif'),
  (57, '20245008', 'Sude',    'Arslan',   '5554500108', 'sude.arslan@ogrenci.edu.tr',   'Aktif'),
  (58, '20245009', 'Berk',    'Öztürk',   '5554500109', 'berk.ozturk@ogrenci.edu.tr',   'Aktif'),
  (59, '20245010', 'Ece',     'Polat',    '5554500110', 'ece.polat@ogrenci.edu.tr',     'Aktif'),
  (60, '20245011', 'Hasan',   'Güneş',    '5554500111', 'hasan.gunes@ogrenci.edu.tr',   'Aktif'),
  (61, '20245012', 'Ceren',   'Yıldırım', '5554500112', 'ceren.yildirim@ogrenci.edu.tr','Aktif'),
  (62, '20245013', 'Oğuz',    'Karaca',   '5554500113', 'oguz.karaca@ogrenci.edu.tr',   'Aktif'),
  (63, '20245014', 'Deniz',   'Aksoy',    '5554500114', 'deniz.aksoy@ogrenci.edu.tr',   'Donduruldu');

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
    GREATEST(
      DATEDIFF(
        DATE(COALESCE(oi.TeslimTarihi, NOW())),
        DATE(oi.SonTeslimTarihi)
      ), 0
    ),
    ' gün gecikme.'
  ) AS Aciklama,

  -- ✅ Tarih + saat farkı: taban tarih + (IslemID saniye)
  DATE_ADD(
    CASE
      WHEN oi.TeslimTarihi IS NULL
        THEN DATE_ADD(oi.SonTeslimTarihi, INTERVAL 1 DAY)  -- gecikme başladığı gün
      ELSE oi.TeslimTarihi                                 -- geç teslim günü
    END,
    INTERVAL (oi.IslemID % 3600) SECOND                     -- her satıra farklı saniye
  ) AS OlusturmaTarihi,

  CASE
    WHEN oi.TeslimTarihi IS NULL THEN 'Unpaid'
    ELSE 'Paid'
  END AS Durum,

  CASE
    WHEN oi.TeslimTarihi IS NULL THEN NULL
    ELSE DATE_ADD(oi.TeslimTarihi, INTERVAL (oi.IslemID % 3600) SECOND) -- ödeme saati de farklı olsun
  END AS OdemeTarihi

FROM OduncIslemleri oi
WHERE
  oi.SonTeslimTarihi IS NOT NULL
  AND GREATEST(
    DATEDIFF(DATE(COALESCE(oi.TeslimTarihi, NOW())), DATE(oi.SonTeslimTarihi)),
    0
  ) > 0;
