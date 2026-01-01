DELIMITER //

-- 1. Yeni Ödünç Ekleme Prosedürü
-- Üyenin kitap limitini ve kitabın stok durumunu kontrol ederek ödünç verir.
CREATE PROCEDURE sp_YeniOduncEkleme (
    IN p_UyeID INT,
    IN p_KitapID INT,
    IN p_PersonelID INT
)
BEGIN
    DECLARE v_Stok INT;
    DECLARE v_AktifOduncSayisi INT;

    -- Üyenin elindeki teslim edilmemiş kitap sayısını bul
    SELECT COUNT(*) INTO v_AktifOduncSayisi 
    FROM OduncIslemleri 
    WHERE UyeID = p_UyeID AND TeslimTarihi IS NULL;

    -- Maksimum 5 kitap kuralı kontrolü
    IF v_AktifOduncSayisi >= 5 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'HATA: Üye kitap limitini (5) doldurmuş.';
    END IF;

    -- Kitap stoğunu kontrol et
    SELECT MevcutAdet INTO v_Stok FROM Kitaplar WHERE KitapID = p_KitapID;

    IF v_Stok <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'HATA: Yetersiz stok. Kitap şu an rafta yok.';
    ELSE
        -- Kayıt Ekle (Son teslim tarihi bugünden 15 gün sonrası olarak ayarlanır)
        -- Not: Stok düşme işlemi Trigger tarafından otomatik yapılacaktır.
        INSERT INTO OduncIslemleri (UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi)
        VALUES (p_UyeID, p_KitapID, p_PersonelID, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY));
    END IF;
END //


-- 2. Kitap Teslim Alma Prosedürü
-- Kitabı teslim alır, gecikme varsa hesaplar ve otomatik ceza yazar.
CREATE PROCEDURE sp_KitapTeslimAl (
    IN p_IslemID INT,
    IN p_TeslimTarihi DATETIME
)
BEGIN
    DECLARE v_SonTeslim DATETIME;
    DECLARE v_UyeID INT;
    DECLARE v_GecikmeGun INT;
    DECLARE v_CezaTutari DECIMAL(10,2);
    
    -- İşlem bilgilerini al
    SELECT SonTeslimTarihi, UyeID INTO v_SonTeslim, v_UyeID
    FROM OduncIslemleri WHERE IslemID = p_IslemID;

    -- Teslim tarihini güncelle
    -- Not: Stok artırma işlemi Trigger tarafından otomatik yapılacaktır.
    UPDATE OduncIslemleri SET TeslimTarihi = p_TeslimTarihi WHERE IslemID = p_IslemID;

    -- Gecikme kontrolü
    IF p_TeslimTarihi > v_SonTeslim THEN
        SET v_GecikmeGun = DATEDIFF(p_TeslimTarihi, v_SonTeslim);
        
        -- Günlük ceza bedeli: 5.00 birim
        SET v_CezaTutari = v_GecikmeGun * 5.00;

        -- Ceza tablosuna ekle
        -- Not: Üye bakiyesi güncelleme Trigger tarafından otomatik yapılacaktır.
        INSERT INTO Cezalar (IslemID, UyeID, Tutar, Aciklama)
        VALUES (p_IslemID, v_UyeID, v_CezaTutari, CONCAT(v_GecikmeGun, ' gün gecikme.'));
    END IF;
END //


-- 3. Üye Özet Raporu Prosedürü
-- Üyenin aldığı toplam kitap, iade etmedikleri ve borç durumunu getirir.
CREATE PROCEDURE sp_UyeOzetRapor (
    IN p_UyeID INT
)
BEGIN
    SELECT 
        u.OgrenciNo,
        u.Ad,
        u.Soyad,
        u.Durum,
        (SELECT COUNT(*) FROM OduncIslemleri WHERE UyeID = p_UyeID) AS ToplamAlinanKitap,
        (SELECT COUNT(*) FROM OduncIslemleri WHERE UyeID = p_UyeID AND TeslimTarihi IS NULL) AS TeslimEdilmeyenKitap,
        u.ToplamBorc AS GuncelBorcTutari
    FROM Uyeler u
    WHERE u.UyeID = p_UyeID;
END //


-- 4. Kitap Arama Prosedürü
-- Kitap başlığı, yazar veya ISBN içinde arama yapar.


CREATE PROCEDURE sp_KitapAra (
    IN p_AramaMetni VARCHAR(100)
)
BEGIN
    SELECT * FROM Kitaplar k
    LEFT JOIN Kategoriler kat 
        ON kat.KategoriID = k.KategoriID
    WHERE
        k.Baslik LIKE CONCAT('%', p_AramaMetni, '%')
        OR k.Yazar LIKE CONCAT('%', p_AramaMetni, '%')
        OR k.ISBN LIKE CONCAT('%', p_AramaMetni, '%');
END //



-- 5. Kitap Ekle veya Güncelle Prosedürü
-- ISBN sistemde varsa stoğu artırır, yoksa yeni kitap kaydı oluşturur.
CREATE PROCEDURE sp_KitapEkle (
    IN p_Baslik VARCHAR(200),
    IN p_Yazar VARCHAR(100),
    IN p_Yayinevi VARCHAR(100),
    IN p_ISBN VARCHAR(20),
    IN p_KategoriID INT,
    IN p_Adet INT
)
BEGIN
    DECLARE v_VarMi INT;

    SELECT COUNT(*) INTO v_VarMi FROM Kitaplar WHERE ISBN = p_ISBN;

    IF v_VarMi > 0 THEN
        -- Kitap zaten varsa stoğu artır
        UPDATE Kitaplar SET ToplamAdet = ToplamAdet + p_Adet, MevcutAdet = MevcutAdet + p_Adet
        WHERE ISBN = p_ISBN;
    ELSE
        -- Kitap yoksa yeni kayıt oluştur
        INSERT INTO Kitaplar (KategoriID, Baslik, Yazar, Yayinevi, ISBN, ToplamAdet, MevcutAdet)
        VALUES (p_KategoriID, p_Baslik, p_Yazar, p_Yayinevi, p_ISBN, p_Adet, p_Adet);
    END IF;
END //

-- 6. Kitap Güncelleme Prosedürü
-- Kitap bilgilerini günceller, toplam adet emanet adedinden az olamaz
CREATE PROCEDURE sp_KitapGuncelle (
  IN p_KitapID INT,
  IN p_Baslik VARCHAR(200),
  IN p_Yazar VARCHAR(100),
  IN p_Yayinevi VARCHAR(100),
  IN p_ISBN VARCHAR(20),
  IN p_KategoriID INT,
  IN p_ToplamAdet INT
)
BEGIN
  DECLARE v_Emanet INT DEFAULT 0;

  -- emanet sayısı = toplam - mevcut (emanet sistemi yoksa da 0 kalır)
  SELECT (ToplamAdet - MevcutAdet) INTO v_Emanet
  FROM Kitaplar
  WHERE KitapID = p_KitapID;

  IF v_Emanet IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kitap bulunamadı';
  END IF;

  IF p_ToplamAdet < v_Emanet THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ToplamAdet emanet adedinden küçük olamaz';
  END IF;

  UPDATE Kitaplar
  SET Baslik     = p_Baslik,
      Yazar      = p_Yazar,
      Yayinevi   = p_Yayinevi,
      ISBN       = p_ISBN,
      KategoriID = p_KategoriID,
      ToplamAdet = p_ToplamAdet,
      MevcutAdet = p_ToplamAdet - v_Emanet
  WHERE KitapID = p_KitapID;
END//


-- 7. Cezaları Listeleme Prosedürü
-- İsteğe bağlı üye ve tarih aralığı filtreleme
CREATE PROCEDURE sp_CezaListele(
  IN p_UyeID INT,
  IN p_From DATE,
  IN p_To DATE
)
BEGIN
  SELECT
    c.CezaID,
    c.UyeID,
    CONCAT(u.Ad, ' ', u.Soyad) AS AdSoyad,
    u.OgrenciNo,
    c.IslemID,
    k.Baslik AS KitapBaslik,
    oi.SonTeslimTarihi,
    c.Tutar,
    c.Durum,
    c.OlusturmaTarihi,
    c.OdemeTarihi,
    CASE
      WHEN oi.SonTeslimTarihi IS NULL THEN 0
      WHEN oi.TeslimTarihi IS NOT NULL THEN
        GREATEST(DATEDIFF(DATE(oi.TeslimTarihi), DATE(oi.SonTeslimTarihi)), 0)
      ELSE
        GREATEST(DATEDIFF(CURDATE(), DATE(oi.SonTeslimTarihi)), 0)
    END AS GecikmeGun
  FROM Cezalar c
  JOIN Uyeler u ON u.UyeID = c.UyeID
  LEFT JOIN OduncIslemleri oi ON oi.IslemID = c.IslemID
  LEFT JOIN Kitaplar k ON k.KitapID = oi.KitapID
  WHERE (p_UyeID IS NULL OR c.UyeID = p_UyeID)
    AND (p_From IS NULL OR DATE(c.OlusturmaTarihi) >= p_From)
    AND (p_To   IS NULL OR DATE(c.OlusturmaTarihi) <= p_To)
  ORDER BY GREATEST(c.OlusturmaTarihi, COALESCE(c.OdemeTarihi, c.OlusturmaTarihi)) DESC;
END//

-- 8. Ceza Detay Prosedürü
-- Belirli bir cezanın detaylarını getirir
CREATE PROCEDURE sp_CezaDetay(IN p_CezaID INT)
BEGIN
  SELECT
    c.CezaID,
    c.UyeID,
    CONCAT(u.Ad, ' ', u.Soyad) AS AdSoyad,
    u.OgrenciNo,
    c.IslemID,
    k.Baslik AS KitapBaslik,
    oi.SonTeslimTarihi,
    oi.TeslimTarihi,
    c.Tutar,
    c.Durum,
    c.OlusturmaTarihi,
    c.OdemeTarihi,
    c.Aciklama,
    CASE
      WHEN oi.SonTeslimTarihi IS NULL THEN 0
      WHEN oi.TeslimTarihi IS NOT NULL THEN
        GREATEST(DATEDIFF(DATE(oi.TeslimTarihi), DATE(oi.SonTeslimTarihi)), 0)
      ELSE
        GREATEST(DATEDIFF(CURDATE(), DATE(oi.SonTeslimTarihi)), 0)
    END AS GecikmeGun
  FROM Cezalar c
  JOIN Uyeler u ON u.UyeID = c.UyeID
  LEFT JOIN OduncIslemleri oi ON oi.IslemID = c.IslemID
  LEFT JOIN Kitaplar k ON k.KitapID = oi.KitapID
  WHERE c.CezaID = p_CezaID
  LIMIT 1;
END//

-- 9. Ceza Ödeme Prosedürü
-- Belirli bir cezayı ödenmiş olarak işaretler
CREATE PROCEDURE sp_CezaOde(IN p_CezaID INT)
BEGIN
  UPDATE Cezalar
  SET Durum = 'Paid',
      OdemeTarihi = NOW()
  WHERE CezaID = p_CezaID;

  SELECT ROW_COUNT() AS affected;
END//

DELIMITER ;