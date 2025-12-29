import { Injectable, BadRequestException } from '@nestjs/common';
import { pool } from '../db/mysql';

type LoansParams = {
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  memberId: string;    // all | number
  category: string;    // all | kategoriAdi (veya kategoriID istiyorsan ayarlarız)
  status: string;      // all | returned | active | overdue
};

type OverdueParams = {
  memberId: string;    // all | number
  category: string;    // all | kategoriAdi
  minDays: string;     // '' | number
};

type MostParams = {
  startDate: string;
  endDate: string;
  category: string;    // all | kategoriAdi
  topN: string;        // number
};

function isISODate(d: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d || '');
}

@Injectable()
export class ReportsService {

  // 1) Tarih Aralığı Ödünç
  async getLoansByDateRange(p: LoansParams) {
    if (!isISODate(p.startDate) || !isISODate(p.endDate)) {
      throw new BadRequestException('startDate/endDate YYYY-MM-DD olmalı');
    }

    // date input -> full day range:
    const start = `${p.startDate} 00:00:00`;
    const end = `${p.endDate} 23:59:59`;

    // Dinamik filtre (güvenli: sadece whitelist ile ekliyoruz, değerler ? ile gidiyor)
    const where: string[] = [];
    const args: any[] = [];

    // tarih aralığı (VerilisTarihi)
    where.push(`o.VerilisTarihi BETWEEN ? AND ?`);
    args.push(start, end);

    // üye
    if (p.memberId !== 'all') {
      where.push(`u.UyeID = ?`);
      args.push(Number(p.memberId));
    }

    // kategori (KategoriAdi üzerinden)
    if (p.category !== 'all') {
      where.push(`k.KategoriAdi = ?`);
      args.push(p.category);
    }

    // status
    // returned: TeslimTarihi IS NOT NULL
    // active: TeslimTarihi IS NULL (overdue dahil)  (istersen overdue hariç yaparız)
    // overdue: TeslimTarihi IS NULL AND SonTeslimTarihi < NOW()
    if (p.status !== 'all') {
      if (p.status === 'returned') {
        where.push(`o.TeslimTarihi IS NOT NULL`);
      } else if (p.status === 'active') {
        where.push(`o.TeslimTarihi IS NULL`);
      } else if (p.status === 'overdue') {
        where.push(`o.TeslimTarihi IS NULL AND o.SonTeslimTarihi < NOW()`);
      }
    }

    const sql = `
      SELECT
        o.IslemID AS id,
        CONCAT(u.Ad, ' ', u.Soyad) AS memberName,
        u.OgrenciNo AS studentNo,
        b.Baslik AS bookName,
        k.KategoriAdi AS category,
        DATE_FORMAT(o.VerilisTarihi, '%Y-%m-%d') AS loanDate,
        DATE_FORMAT(o.SonTeslimTarihi, '%Y-%m-%d') AS dueDate,
        IFNULL(DATE_FORMAT(o.TeslimTarihi, '%Y-%m-%d'), NULL) AS returnDate,
        CASE
          WHEN o.TeslimTarihi IS NOT NULL THEN 'returned'
          WHEN o.TeslimTarihi IS NULL AND o.SonTeslimTarihi < NOW() THEN 'overdue'
          ELSE 'active'
        END AS status
      FROM OduncIslemleri o
      INNER JOIN Uyeler u ON u.UyeID = o.UyeID
      INNER JOIN Kitaplar b ON b.KitapID = o.KitapID
      LEFT JOIN Kategoriler k ON k.KategoriID = b.KategoriID
      WHERE ${where.join(' AND ')}
      ORDER BY o.VerilisTarihi DESC
    `;

    const [rows]: any = await pool.query(sql, args);
    return rows;
  }

  // 2) Geciken Kitaplar
  async getOverdueLoans(p: OverdueParams) {
    const where: string[] = [];
    const args: any[] = [];

    // kesin overdue koşulu:
    where.push(`o.TeslimTarihi IS NULL AND o.SonTeslimTarihi < NOW()`);

    if (p.memberId !== 'all') {
      where.push(`u.UyeID = ?`);
      args.push(Number(p.memberId));
    }

    if (p.category !== 'all') {
      where.push(`k.KategoriAdi = ?`);
      args.push(p.category);
    }

    if (p.minDays) {
      const n = Number(p.minDays);
      if (!Number.isNaN(n)) {
        where.push(`DATEDIFF(NOW(), o.SonTeslimTarihi) >= ?`);
        args.push(n);
      }
    }

    const sql = `
      SELECT
        o.IslemID AS id,
        CONCAT(u.Ad, ' ', u.Soyad) AS memberName,
        u.OgrenciNo AS studentNo,
        b.Baslik AS bookName,
        k.KategoriAdi AS category,
        DATE_FORMAT(o.VerilisTarihi, '%Y-%m-%d') AS loanDate,
        DATE_FORMAT(o.SonTeslimTarihi, '%Y-%m-%d') AS dueDate,
        DATEDIFF(NOW(), o.SonTeslimTarihi) AS overdueDays
      FROM OduncIslemleri o
      INNER JOIN Uyeler u ON u.UyeID = o.UyeID
      INNER JOIN Kitaplar b ON b.KitapID = o.KitapID
      LEFT JOIN Kategoriler k ON k.KategoriID = b.KategoriID
      WHERE ${where.join(' AND ')}
      ORDER BY overdueDays DESC, o.SonTeslimTarihi ASC
    `;

    const [rows]: any = await pool.query(sql, args);
    return rows;
  }

  // 3) En Çok Ödünç Alınan
  async getMostBorrowedBooks(p: MostParams) {
    if (!isISODate(p.startDate) || !isISODate(p.endDate)) {
      throw new BadRequestException('startDate/endDate YYYY-MM-DD olmalı');
    }

    const start = `${p.startDate} 00:00:00`;
    const end = `${p.endDate} 23:59:59`;

    const topN = Math.max(1, Math.min(200, Number(p.topN) || 10)); // güvenlik
    const where: string[] = [];
    const args: any[] = [start, end];

    where.push(`o.VerilisTarihi BETWEEN ? AND ?`);

    if (p.category !== 'all') {
      where.push(`k.KategoriAdi = ?`);
      args.push(p.category);
    }

    const sql = `
      SELECT
        b.Baslik AS bookName,
        b.Yazar AS author,
        k.KategoriAdi AS category,
        COUNT(*) AS count
      FROM OduncIslemleri o
      INNER JOIN Kitaplar b ON b.KitapID = o.KitapID
      LEFT JOIN Kategoriler k ON k.KategoriID = b.KategoriID
      WHERE ${where.join(' AND ')}
      GROUP BY b.KitapID, b.Baslik, b.Yazar, k.KategoriAdi
      ORDER BY count DESC
      LIMIT ${topN}
    `;

    const [rows]: any = await pool.query(sql, args);
    return rows;
  }
}
