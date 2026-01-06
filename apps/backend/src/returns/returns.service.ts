import { Injectable, BadRequestException } from '@nestjs/common';
import { pool } from '../db/mysql';

@Injectable()
export class ReturnsService {
  constructor() {}

  // 1. AKTİF (TESLİM EDİLMEMİŞ) KİTAPLARI LİSTELE
  async getActiveLoans(search: string = '') {
    let sql = `
      SELECT 
        oi.IslemID as id,
        u.OgrenciNo as memberNo,
        CONCAT(u.Ad, ' ', u.Soyad) as memberName,
        k.Baslik as bookName,
        kat.KategoriAdi as category,
        k.ISBN as isbn,
        DATE_FORMAT(oi.VerilisTarihi, '%Y-%m-%d') as borrowDate,
        DATE_FORMAT(oi.SonTeslimTarihi, '%Y-%m-%d') as dueDate,
        GREATEST(DATEDIFF(NOW(), oi.SonTeslimTarihi), 0) as currentDelay
      FROM OduncIslemleri oi
      JOIN Uyeler u ON oi.UyeID = u.UyeID
      JOIN Kitaplar k ON oi.KitapID = k.KitapID
      LEFT JOIN Kategoriler kat ON k.KategoriID = kat.KategoriID
      WHERE oi.TeslimTarihi IS NULL
    `;

    const params: any[] = [];

    if (search) {
      sql += ` AND (
        u.Ad LIKE ? OR 
        u.Soyad LIKE ? OR 
        k.Baslik LIKE ? OR 
        u.OgrenciNo LIKE ? OR
        k.ISBN LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    sql += ` ORDER BY oi.SonTeslimTarihi ASC`;

    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  // 2. İADE İŞLEMİNİ VE CEZA KONTROLÜNÜ YAP
  async processReturn(islemId: number) {
    const todayDate = new Date();
    // Tarihi MySQL formatına çevir (YYYY-MM-DD HH:mm:ss)
    const todayStr =
      todayDate.toISOString().slice(0, 10) +
      ' ' +
      todayDate.toTimeString().split(' ')[0];

    // Transaction için bağlantı al
    const connection = await pool.getConnection();

    try {
      // İşlemleri başlat (Hata olursa geri alabilmek için)
      await connection.beginTransaction();

      // A) Ödünç Bilgisini Çek (Tarih ve Üye ID lazım)
      const [loanRows]: any = await connection.query(
        'SELECT UyeID, SonTeslimTarihi FROM OduncIslemleri WHERE IslemID = ?',
        [islemId],
      );

      if (loanRows.length === 0) {
        throw new Error('Ödünç kaydı bulunamadı.');
      }

      const loan = loanRows[0];

      // B) Kitabı İade Al (Teslim Tarihini Güncelle)
      await connection.query(
        'UPDATE OduncIslemleri SET TeslimTarihi = ? WHERE IslemID = ?',
        [todayStr, islemId],
      );

      // C) Gecikme Hesapla
      // Saat farkını yoksaymak için sadece günleri alıyoruz
      const dueDate = new Date(loan.SonTeslimTarihi);
      dueDate.setHours(0, 0, 0, 0);

      const cleanToday = new Date(todayDate);
      cleanToday.setHours(0, 0, 0, 0);

      const diffTime = cleanToday.getTime() - dueDate.getTime();
      const delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let fineAmount = 0;

      // D) Eğer Gecikme Varsa CEZA İşlemleri
      if (delayDays > 0) {
        const dailyFine = 5.0; // Günlük Ceza Tutarı (Örn: 5 TL)
        fineAmount = delayDays * dailyFine;

        // D1. KONTROL: Bu işlem için daha önce ceza yazılmış mı?
        const [existingFine]: any = await connection.query(
          'SELECT CezaID FROM Cezalar WHERE IslemID = ? LIMIT 1',
          [islemId],
        );

        // D2. Sadece kayıt YOKSA ekle
        if (existingFine.length === 0) {
          await connection.query(
            'INSERT INTO Cezalar (UyeID, IslemID, Tutar, Durum, Aciklama) VALUES (?, ?, ?, ?, ?)',
            [
              loan.UyeID,
              islemId,
              fineAmount,
              'Odenmedi',
              `${delayDays} gün gecikme.`,
            ],
          );
        } else {
          console.log(
            `IslemID: ${islemId} için zaten ceza mevcut. Tekrar kayıt engellendi.`,
          );
        }
      }

      // Her şey yolundaysa onayla
      await connection.commit();

      return {
        success: true,
        data: {
          delayDays: delayDays > 0 ? delayDays : 0,
          fineAmount: fineAmount,
        },
      };
    } catch (error) {
      // Hata varsa tüm işlemleri geri al
      await connection.rollback();
      console.error('İade Hatası:', error);
      throw new BadRequestException('İade işlemi yapılamadı: ' + error.message);
    } finally {
      connection.release(); // Bağlantıyı havuza bırak
-    }
  }
}
