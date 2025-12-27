DELIMITER //
CREATE PROCEDURE sp_KitapOduncVer (
    IN p_UyeID INT,
    IN p_KitapID INT,
    IN p_PersonelID INT
)
BEGIN
    DECLARE v_Stok INT;

    -- Kitabın stok durumunu kontrol et
    SELECT MevcutAdet INTO v_Stok FROM Kitaplar WHERE KitapID = p_KitapID;

    IF v_Stok > 0 THEN
        -- Stok varsa kaydı ekle (Trigger devreye girip stoğu düşürecek)
        INSERT INTO OduncIslemleri (UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi)
        VALUES (p_UyeID, p_KitapID, p_PersonelID, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY)); -- Varsayılan 15 gün süre
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yetersiz stok! Kitap şu an rafta yok.';
    END IF;
END //
DELIMITER ;