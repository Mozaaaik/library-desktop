-- Veritabanını oluştur
CREATE DATABASE UniversiteKutuphaneDB;
USE UniversiteKutuphaneDB;

-- 1. Personel Tablosu (Admin ve Görevliler)
CREATE TABLE Personel (
    PersonelID INT AUTO_INCREMENT PRIMARY KEY,
    KullaniciAdi VARCHAR(50) NOT NULL UNIQUE,
    Sifre VARCHAR(255) NOT NULL, -- Gerçek uygulamada hashlenmiş olmalı
    Rol ENUM('Admin', 'Gorevli') NOT NULL DEFAULT 'Gorevli',
    AdSoyad VARCHAR(100) NOT NULL
);

-- 2. Kategoriler Tablosu
CREATE TABLE Kategoriler (
    KategoriID INT AUTO_INCREMENT PRIMARY KEY,
    KategoriAdi VARCHAR(100) NOT NULL
);

-- 3. Üyeler (Öğrenciler) Tablosu
CREATE TABLE Uyeler (
    UyeID INT AUTO_INCREMENT PRIMARY KEY,
    AdSoyad VARCHAR(100) NOT NULL,
    Telefon VARCHAR(15),
    OgrenciNo CHAR(8) NOT NULL UNIQUE,
    Email VARCHAR(100),
    ToplamBorc DECIMAL(10, 2) DEFAULT 0.00,
    KayitTarihi DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Kitaplar Tablosu
CREATE TABLE Kitaplar (
    KitapID INT AUTO_INCREMENT PRIMARY KEY,
    KategoriID INT,
    Baslik VARCHAR(200) NOT NULL,
    Yazar VARCHAR(100),
    Yayinevi VARCHAR(100),
    ISBN VARCHAR(20),
    ToplamAdet INT DEFAULT 1,
    MevcutAdet INT DEFAULT 1,
    FOREIGN KEY (KategoriID) REFERENCES Kategoriler(KategoriID)
);

-- 5. Ödünç İşlemleri Tablosu
CREATE TABLE OduncIslemleri (
    IslemID INT AUTO_INCREMENT PRIMARY KEY,
    UyeID INT,
    KitapID INT,
    PersonelID INT, -- İşlemi yapan görevli
    VerilisTarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    SonTeslimTarihi DATETIME NOT NULL,
    TeslimTarihi DATETIME NULL, -- NULL ise henüz teslim edilmedi
    FOREIGN KEY (UyeID) REFERENCES Uyeler(UyeID),
    FOREIGN KEY (KitapID) REFERENCES Kitaplar(KitapID),
    FOREIGN KEY (PersonelID) REFERENCES Personel(PersonelID)
);

-- 6. Cezalar Tablosu
CREATE TABLE Cezalar (
    CezaID INT AUTO_INCREMENT PRIMARY KEY,
    IslemID INT, -- Hangi ödünç işlemine ait olduğu
    UyeID INT,
    Tutar DECIMAL(10, 2) NOT NULL,
    Aciklama VARCHAR(255),
    OlusturmaTarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IslemID) REFERENCES OduncIslemleri(IslemID),
    FOREIGN KEY (UyeID) REFERENCES Uyeler(UyeID)
);

-- 7. Sistem Logları Tablosu
CREATE TABLE SistemLoglari (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    TabloAdi VARCHAR(50),
    IslemTuru VARCHAR(20), -- INSERT, UPDATE, DELETE
    Aciklama TEXT,
    IslemZamani DATETIME DEFAULT CURRENT_TIMESTAMP
);