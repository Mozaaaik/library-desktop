import { Injectable } from '@nestjs/common';
import { pool } from '../db/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 1. Veritabanından SELECT ile gelen verinin tipi (Okuma için)
interface MemberRow extends RowDataPacket {
  UyeID: number;
  Ad: string;
  Soyad: string;
  OgrenciNo: string;
  Email: string;
  Telefon: string;
  active_loans: number; // Subquery ile hesaplayacağız
  ToplamBorc: number;
  Durum: string;
}

// 2. Frontend'den CREATE işlemi için gelen verinin tipi (Yazma için)
export interface CreateMemberDto {
  ad: string;
  soyad: string;
  studentId: string;
  email: string;
  phone: string;
  activeLoans?: number; // ? işareti, bu alanın zorunlu olmadığını belirtir
  debt?: number;
  status?: string;
}

@Injectable()
export class MembersService {
  async update(id: number, body: CreateMemberDto) {
    const sql = `
      UPDATE Uyeler 
      SET Ad=?, Soyad=?, OgrenciNo=?, Email=?, Telefon=?, Durum=? 
      WHERE UyeID=?
    `;

    // Frontend 'studentId' gönderiyor, biz DB'ye 'student_id' yazıyoruz
    const params = [
      body.ad,
      body.soyad,
      body.studentId,
      body.email,
      body.phone,
      body.status, // "Aktif" veya "Donduruldu"
      id,
    ];

    const [result] = await pool.execute<ResultSetHeader>(sql, params);
    return result;
  }

  async findAll() {
    try {
      // SORGUNUN GÜNCELLENMESİ GEREKİYORDU:
      // 1. Tablo adı 'members' -> 'Uyeler' oldu.
      // 2. active_loans veritabanında kolon değil, o yüzden COUNT ile hesaplatıyoruz.
      const sql = `
        SELECT 
          u.*, 
          (SELECT COUNT(*) FROM OduncIslemleri o WHERE o.UyeID = u.UyeID AND o.TeslimTarihi IS NULL) as active_loans 
        FROM Uyeler u
      `;

      const [rows] = await pool.execute<MemberRow[]>(sql);

      // MAPPING HATASI VARDI, DÜZELTİLDİ:
      // Artık 'row.Ad' -> 'ad' şeklinde eşleştiriyoruz.
      return rows.map((row) => ({
        id: row.UyeID, // DB: UyeID -> Front: id
        ad: row.Ad, // DB: Ad -> Front: ad
        soyad: row.Soyad, // DB: Soyad -> Front: soyad
        studentId: row.OgrenciNo, // DB: OgrenciNo -> Front: studentId
        email: row.Email,
        phone: row.Telefon, // DB: Telefon -> Front: phone
        activeLoans: row.active_loans || 0,
        debt: Number(row.ToplamBorc), // DB: ToplamBorc -> Front: debt
        status: row.Durum, // DB: Durum -> Front: status
      }));
    } catch (error) {
      console.error('Veritabanı hatası:', error);
      throw error;
    }
  }

  async create(body: CreateMemberDto) {
    const sql = `
      INSERT INTO Uyeler (Ad, Soyad, OgrenciNo, Email, Telefon, ToplamBorc, Durum) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      body.ad,
      body.soyad,
      body.studentId,
      body.email,
      body.phone,
      body.debt || 0,
      'Aktif',
    ];

    const [result] = await pool.execute<ResultSetHeader>(sql, params);
    return result;
  }
  async remove(id: number) {
    const sql = 'DELETE FROM Uyeler WHERE UyeID=?';
    const [result] = await pool.execute<ResultSetHeader>(sql, [id]);
    return result;
  }
}
