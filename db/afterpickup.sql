DELIMITER //
CREATE TRIGGER trg_KitapTeslimSonrasi
AFTER UPDATE ON OduncIslemleri
FOR EACH ROW
BEGIN
    -- Sadece teslim tarihi NULL'dan dolu bir tarihe geçtiyse işlem yap
    IF OLD.TeslimTarihi IS NULL AND NEW.TeslimTarihi IS NOT NULL THEN
        -- 1. Stok Artır
        UPDATE Kitaplar SET MevcutAdet = MevcutAdet + 1 WHERE KitapID = NEW.KitapID;

        -- 2. Log Kaydı At
        INSERT INTO SistemLoglari (TabloAdi, IslemTuru, Aciklama)
        VALUES ('OduncIslemleri', 'UPDATE', CONCAT('Kitap teslim alındı. IslemID: ', NEW.IslemID));
    END IF;
END //
DELIMITER ;