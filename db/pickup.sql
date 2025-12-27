DELIMITER //
CREATE PROCEDURE sp_KitapTeslimAl (
    IN p_IslemID INT
)
BEGIN
    DECLARE v_SonTeslim DATETIME;
    DECLARE v_GecikmeGun INT;
    DECLARE v_CezaTutari DECIMAL(10,2);
    DECLARE v_UyeID INT;
    DECLARE v_GunlukCeza DECIMAL(10,2) DEFAULT 5.00; -- Günlük gecikme bedeli 5 TL

    -- İlgili işlemin bilgilerini al
    SELECT SonTeslimTarihi, UyeID INTO v_SonTeslim, v_UyeID
    FROM OduncIslemleri WHERE IslemID = p_IslemID;

    -- 1. Ödünç kaydını güncelle (Teslim Tarihi ata)
    -- Bu işlem 'trg_KitapTeslimSonrasi' triggerını tetikler ve stok artar.
    UPDATE OduncIslemleri SET TeslimTarihi = NOW() WHERE IslemID = p_IslemID;

    -- 2. Gecikme kontrolü
    SET v_GecikmeGun = DATEDIFF(NOW(), v_SonTeslim);

    IF v_GecikmeGun > 0 THEN
        SET v_CezaTutari = v_GecikmeGun * v_GunlukCeza;
        
        -- Ceza tablosuna ekle (Bu da 'trg_CezaEklemeSonrasi' triggerını tetikler ve üye borcu artar)
        INSERT INTO Cezalar (IslemID, UyeID, Tutar, Aciklama)
        VALUES (p_IslemID, v_UyeID, v_CezaTutari, CONCAT(v_GecikmeGun, ' gün gecikme cezası.'));
    END IF;
END //
DELIMITER ;