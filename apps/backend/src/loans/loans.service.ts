import { BadRequestException, Injectable } from '@nestjs/common';
import { pool } from '../db/mysql';

@Injectable()
export class LoansService {
  // Ödünç ver
  async createLoan(data: {
    uyeId: number;
    kitapId: number;
    personelId: number;
  }) {
    try {
      await pool.query('CALL sp_YeniOduncEkleme(?,?,?)', [
        data.uyeId,
        data.kitapId,
        data.personelId,
      ]);

      return {
        message: 'Book borrowed successfully',
      };
    } catch (error) {
      // SIGNAL mesajı genelde err.sqlMessage içinde gelir
      throw new BadRequestException(error.sqlMessage || 'Borrow failed');
    }
  }

  // Kitap iade et
  async returnBook(data: { islemId: number; teslimTarihi: number }) {
    try {
      await pool.query('CALL sp_KitapTeslimAl(?,?)', [
        data.islemId,
        data.teslimTarihi,
      ]);

      return {
        message: 'Book returned successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.sqlMessage || 'Book return failed');
    }
  }

  // Teslim edilmemişleri getir
  async active() {
    const [rows]: any = await pool.query(
      `SELECT 
         IslemID, UyeID, KitapID, PersonelID, VerilisTarihi, SonTeslimTarihi
       FROM OduncIslemleri
       WHERE TeslimTarihi IS NULL
       ORDER BY VerilisTarihi DESC`,
    );

    return rows;
  }
}
