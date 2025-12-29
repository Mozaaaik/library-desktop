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
        -- Gecikmeyi hesaplayıp frontend'e ön bilgi verelim (Opsiyonel)
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

  // 2. İADE İŞLEMİNİ YAP (SP ÇAĞIR + CEZA KONTROLÜ)
  async processReturn(islemId: number) {
    const today =
      new Date().toISOString().slice(0, 10) +
      ' ' +
      new Date().toTimeString().split(' ')[0]; // '2025-12-29 14:30:00'

    const connection = await pool.getConnection(); // Transaction veya ardışık işlem için connection alıyoruz

    try {
      // A) Prosedürü Çağır: sp_KitapTeslimAl
      // Bu prosedür teslim tarihini günceller ve gecikme varsa Cezalar tablosuna insert yapar.
      // Stok artışı ise senin TR_ODUNC_UPDATE_TESLIM trigger'ın sayesinde otomatik olur.
      await connection.query('CALL sp_KitapTeslimAl(?, ?)', [islemId, today]);

      // B) Ceza Oluştu mu? Kontrol Et
      // Prosedürün geriye değer dönmediği senaryoda, oluşan cezayı tablodan buluyoruz.
      const [cezaRows]: any = await connection.query(
        `
        SELECT Tutar, Aciklama 
        FROM Cezalar 
        WHERE IslemID = ? 
        ORDER BY CezaID DESC LIMIT 1
      `,
        [islemId],
      );

      const cezaBilgisi = cezaRows[0];

      // Gecikme gününü bulmak için basit bir hesaplama (Mesaj için)
      // Aciklama içinde "15 gün gecikme" yazıyor zaten, oradan parsing yapabiliriz veya null döneriz.
      let gecikmeGun = 0;
      let cezaTutar = 0;

      if (cezaBilgisi) {
        cezaTutar = cezaBilgisi.Tutar;
        // Aciklama örn: "5 gün gecikme." -> Buradan sayıyı çekebiliriz veya direkt tutara bakarız.
        const match = cezaBilgisi.Aciklama.match(/(\d+)\s+gün/);
        if (match) gecikmeGun = parseInt(match[1]);
      }

      return {
        success: true,
        data: {
          delayDays: gecikmeGun,
          fineAmount: cezaTutar,
        },
      };
    } catch (error) {
      console.error('İade Hatası:', error);
      throw new BadRequestException('İade işlemi yapılamadı: ' + error.message);
    } finally {
      connection.release(); // Bağlantıyı havuza geri bırak
    }
  }
}
