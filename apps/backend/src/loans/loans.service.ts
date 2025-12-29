import { BadRequestException, Injectable } from '@nestjs/common';
import { pool } from '../db/mysql';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface SqlError extends Error {
  sqlMessage?: string;
  code?: string;
  errno?: number;
}

export interface ActiveLoanRow extends RowDataPacket {
  IslemID: number;
  UyeID: number;
  KitapID: number;
  PersonelID: number;
  VerilisTarihi: Date;
  SonTeslimTarihi: Date;
}

export interface MemberActiveLoanRow extends RowDataPacket {
  IslemID: number;
  Baslik: string;
  ISBN: string;
  VerilisTarihi: Date;
  SonTeslimTarihi: Date;
}

@Injectable()
export class LoansService {
  // Ödünç ver
  async createLoan(data: {
    uyeId: number;
    kitapId: number;
    personelId: number;
  }) {
    try {
      await pool.query<ResultSetHeader>('CALL sp_YeniOduncEkleme(?,?,?)', [
        data.uyeId,
        data.kitapId,
        data.personelId,
      ]);

      return {
        message: 'Kitap başarıyla ödünç alındı.',
      };
    } catch (error) {
      // SIGNAL mesajı genelde err.sqlMessage içinde gelir
      const err = error as SqlError;
      throw new BadRequestException(err.sqlMessage || 'Ödünç alma başarısız');
    }
  }

  // Kitap iade et
  async returnBook(data: { islemId: number; teslimTarihi: number }) {
    try {
      await pool.query<ResultSetHeader>('CALL sp_KitapTeslimAl(?,?)', [
        data.islemId,
        data.teslimTarihi,
      ]);

      return {
        message: 'Kitap başarıyla geri alındı',
      };
    } catch (error) {
      const err = error as SqlError;
      throw new BadRequestException(err.sqlMessage || 'Book return failed');
    }
  }

  // Teslim edilmemişleri getir
  async active() {
    const [rows] = await pool.query<ActiveLoanRow[]>(
      `SELECT 
         IslemID, UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi
       FROM OduncIslemleri
       WHERE TeslimTarihi IS NULL
       ORDER BY VerilisTarihi DESC`,
    );

    return rows;
  }

  async activeForMember(uyeId: number) {
    // Sadece o üyenin (ve henüz teslim etmediği) kitapları getir
    const sql = `
       SELECT 
         o.IslemID, k.Baslik, k.ISBN, o.VerilisTarihi, o.SonTeslimTarihi
       FROM OduncIslemleri o
       JOIN Kitaplar k ON o.KitapID = k.KitapID
       WHERE o.UyeID = ? AND o.TeslimTarihi IS NULL
       ORDER BY o.SonTeslimTarihi ASC
    `;
    const [rows] = await pool.query<MemberActiveLoanRow[]>(sql, [uyeId]);
    return rows;
  }
}
