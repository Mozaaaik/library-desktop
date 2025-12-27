DELIMITER //
CREATE TRIGGER trg_CezaEklemeSonrasi
AFTER INSERT ON Cezalar
FOR EACH ROW
BEGIN
    -- 1. Üyenin toplam borcunu güncelle
    UPDATE Uyeler SET ToplamBorc = ToplamBorc + NEW.Tutar WHERE UyeID = NEW.UyeID;

    -- 2. Log Kaydı At
    INSERT INTO SistemLoglari (TabloAdi, IslemTuru, Aciklama)
    VALUES ('Cezalar', 'INSERT', CONCAT('Ceza kesildi. UyeID: ', NEW.UyeID, ' Tutar: ', NEW.Tutar));
END //
DELIMITER ;