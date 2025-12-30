-- ===== SIFIRDAN KURULUM (TEK PARÇA) =====
DROP DATABASE IF EXISTS UniversiteKutuphaneDB;
CREATE DATABASE UniversiteKutuphaneDB;
USE UniversiteKutuphaneDB;

-- 1) Personel
CREATE TABLE Personel (
    PersonelID INT AUTO_INCREMENT PRIMARY KEY,
    KullaniciAdi VARCHAR(50) NOT NULL UNIQUE,
    Sifre VARCHAR(255) NOT NULL,
    Rol ENUM('Admin', 'Gorevli') NOT NULL DEFAULT 'Gorevli',
    AdSoyad VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- 2) Kategoriler
CREATE TABLE Kategoriler (
    KategoriID INT AUTO_INCREMENT PRIMARY KEY,
    KategoriAdi VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- 3) Uyeler
CREATE TABLE Uyeler (
    UyeID INT AUTO_INCREMENT PRIMARY KEY,
    Ad VARCHAR(50) NOT NULL,
    Soyad VARCHAR(50) NOT NULL,
    Telefon VARCHAR(15),
    OgrenciNo CHAR(8) NOT NULL UNIQUE,
    Email VARCHAR(100),
    ToplamBorc DECIMAL(10, 2) DEFAULT 0.00,
    Durum ENUM('Aktif', 'Donduruldu') DEFAULT 'Aktif',
    KayitTarihi DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Dashboard / aramalar için faydalı
    INDEX idx_uye_ad_soyad (Ad, Soyad),
    INDEX idx_uye_durum (Durum)
) ENGINE=InnoDB;

-- 4) Kitaplar
CREATE TABLE Kitaplar (
    KitapID INT AUTO_INCREMENT PRIMARY KEY,
    KategoriID INT,
    Baslik VARCHAR(200) NOT NULL,
    Yazar VARCHAR(100),
    Yayinevi VARCHAR(100),
    ISBN VARCHAR(20),
    ToplamAdet INT DEFAULT 1,
    MevcutAdet INT DEFAULT 1,

    FOREIGN KEY (KategoriID) REFERENCES Kategoriler(KategoriID),

    -- Dinamik arama / filtre için çok iş görür
    INDEX idx_kitap_kategori (KategoriID),
    INDEX idx_kitap_baslik (Baslik),
    INDEX idx_kitap_yazar (Yazar),
    INDEX idx_kitap_isbn (ISBN),
    INDEX idx_kitap_mevcut (MevcutAdet)
) ENGINE=InnoDB;

-- 5) OduncIslemleri
CREATE TABLE OduncIslemleri (
    IslemID INT AUTO_INCREMENT PRIMARY KEY,
    UyeID INT,
    KitapID INT,
    PersonelID INT,
    VerilisTarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    SonTeslimTarihi DATETIME NOT NULL,
    TeslimTarihi DATETIME NULL,

    FOREIGN KEY (UyeID) REFERENCES Uyeler(UyeID),
    FOREIGN KEY (KitapID) REFERENCES Kitaplar(KitapID),
    FOREIGN KEY (PersonelID) REFERENCES Personel(PersonelID),

    -- Senin istediğin index ✅ (aktif / geciken sorguları hızlandırır)
    INDEX idx_odunc_active_due (TeslimTarihi, SonTeslimTarihi, UyeID),

    -- Ek faydalı indexler (dashboard/top listeler için)
    INDEX idx_odunc_uye (UyeID),
    INDEX idx_odunc_kitap (KitapID),
    INDEX idx_odunc_sonteslim (SonTeslimTarihi),
    INDEX idx_odunc_teslim (TeslimTarihi)
) ENGINE=InnoDB;

-- 6) Cezalar
CREATE TABLE Cezalar (
    CezaID INT AUTO_INCREMENT PRIMARY KEY,
    IslemID INT NOT NULL,
    UyeID   INT NOT NULL,
    Tutar DECIMAL(10, 2) NOT NULL,
    Aciklama VARCHAR(255),
    Durum ENUM('Unpaid','Paid') NOT NULL DEFAULT 'Unpaid',
    OlusturmaTarihi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    OdemeTarihi DATETIME NULL,

    FOREIGN KEY (IslemID) REFERENCES OduncIslemleri(IslemID),
    FOREIGN KEY (UyeID) REFERENCES Uyeler(UyeID),

    INDEX idx_ceza_uye (UyeID),
    INDEX idx_ceza_islem (IslemID),
    INDEX idx_ceza_tarih (OlusturmaTarihi),
    INDEX idx_ceza_durum (Durum),

    -- “ödenmemiş ceza” dashboard sorgusu için çok iyi
    INDEX idx_ceza_durum_tarih (Durum, OlusturmaTarihi),

    -- “son cezalar” + üye bazlı liste için iyi
    INDEX idx_ceza_uye_tarih (UyeID, OlusturmaTarihi)
) ENGINE=InnoDB;

-- 7) SistemLoglari
CREATE TABLE SistemLoglari (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    TabloAdi VARCHAR(50),
    IslemTuru VARCHAR(20),
    Aciklama TEXT,
    IslemZamani DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_log_tablo (TabloAdi),
    INDEX idx_log_zaman (IslemZamani)
) ENGINE=InnoDB;
