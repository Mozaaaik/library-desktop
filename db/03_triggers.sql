DELIMITER //

-- 1. TR_ODUNC_INSERT
-- Yeni ödünç verildiğinde stok düşer ve log kaydı oluşturulur.
CREATE TRIGGER TR_ODUNC_INSERT
AFTER INSERT ON OduncIslemleri
FOR EACH ROW
BEGIN
    -- Kitap stoğunu azalt
    UPDATE Kitaplar SET MevcutAdet = MevcutAdet - 1 WHERE KitapID = NEW.KitapID;

    -- Log tablosuna kayıt at
    INSERT INTO SistemLoglari (TabloAdi, IslemTuru, Aciklama) 
    VALUES ('OduncIslemleri', 'INSERT', 'ODUNC tablosuna kayıt eklendi');
END //

-- 2. TR_ODUNC_UPDATE_TESLIM
-- Teslim tarihi girildiğinde stok artar ve log kaydı oluşturulur.
CREATE TRIGGER TR_ODUNC_UPDATE_TESLIM
AFTER UPDATE ON OduncIslemleri
FOR EACH ROW
BEGIN
    -- Sadece teslim tarihi NULL'dan dolu bir değere değiştiyse çalışır
    IF OLD.TeslimTarihi IS NULL AND NEW.TeslimTarihi IS NOT NULL THEN
        -- Kitap stoğunu artır
        UPDATE Kitaplar SET MevcutAdet = MevcutAdet + 1 WHERE KitapID = NEW.KitapID;

        -- Log tablosuna kayıt at
        INSERT INTO SistemLoglari (TabloAdi, IslemTuru, Aciklama) 
        VALUES ('OduncIslemleri', 'UPDATE', CONCAT('Kitap teslim alındı. IslemID: ', NEW.IslemID));
    END IF;
END //

-- 3. TR_CEZA_INSERT
-- Yeni ceza eklendiğinde üyenin toplam borcu artırılır ve loglanır.
CREATE TRIGGER TR_CEZA_INSERT
AFTER INSERT ON Cezalar
FOR EACH ROW
BEGIN
    -- Üyenin toplam borcunu ceza tutarı kadar artır
    UPDATE Uyeler SET ToplamBorc = ToplamBorc + NEW.Tutar WHERE UyeID = NEW.UyeID;

    -- Log tablosuna kayıt at
    INSERT INTO SistemLoglari (TabloAdi, IslemTuru, Aciklama) 
    VALUES ('Cezalar', 'INSERT', CONCAT('Ceza işlemi uygulandı. Tutar: ', NEW.Tutar));
END //

-- 4. TR_UYE_DELETE_BLOCK
-- Borcu olan veya üzerinde kitap bulunan üyenin silinmesini engeller.
CREATE TRIGGER TR_UYE_DELETE_BLOCK
BEFORE DELETE ON Uyeler
FOR EACH ROW
BEGIN
    DECLARE v_AktifOduncSayisi INT;
    
    -- Üyenin teslim etmediği (aktif) ödünç kaydı var mı kontrol et
    SELECT COUNT(*) INTO v_AktifOduncSayisi 
    FROM OduncIslemleri 
    WHERE UyeID = OLD.UyeID AND TeslimTarihi IS NULL;

    -- Eğer borcu varsa VEYA üzerinde kitap varsa silme işlemini durdur
    IF OLD.ToplamBorc > 0 OR v_AktifOduncSayisi > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'HATA: Üyenin borcu veya iade etmediği kitaplar var. Silinemez!';
    END IF;
END //

DELIMITER ;