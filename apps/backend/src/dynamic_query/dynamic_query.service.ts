import { Injectable } from '@nestjs/common';
import { pool } from '../db/mysql';
import { RowDataPacket } from 'mysql2';

@Injectable()
export class DynamicQueryService {
  async getCategories() {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT KategoriID, KategoriAdi FROM Kategoriler ORDER BY KategoriAdi ASC',
      );
      return rows;
    } catch (error) {
      console.error('Kategori çekme hatası:', error);
      return [];
    }
  }

  async getDynamicBooks(filters: any) {
    const {
      title, // string (partial match)
      author, // string (partial match)
      categoryId, // number/string (exact match)
      onlyAvailable, // boolean/string
      sortBy, // 'title', 'price', 'stock' vb.
      sortOrder, // 'ASC' | 'DESC'
    } = filters;

    // 1. Parametre dizisi (SQL Injection koruması için değerleri buraya atacağız)
    const params: any[] = [];

    // 2. Temel Sorgu (WHERE 1=1 taktiği zincirleme eklemeyi kolaylaştırır)
    let sql = `
      SELECT 
        b.KitapID, 
        b.Baslik, 
        b.Yazar, 
        k.KategoriAdi, 
        b.Yayinevi, 
        b.ISBN, 
        b.MevcutAdet
      FROM Kitaplar b
      LEFT JOIN Kategoriler k ON b.KategoriID = k.KategoriID
      WHERE 1=1
    `;

    // 3. Dinamik Koşullar

    // Kitap Adı (LIKE - İçerir)
    if (title) {
      sql += ` AND b.Baslik LIKE ?`;
      params.push(`%${title}%`);
    }

    // Yazar (LIKE - İçerir)
    if (author) {
      sql += ` AND b.Yazar LIKE ?`;
      params.push(`%${author}%`);
    }

    // Kategori (Eşittir)
    if (categoryId && categoryId !== 'all') {
      // b.KategoriAdi yerine b.KategoriID kullanmalıyız
      sql += ` AND b.KategoriID = ?`;
      params.push(Number(categoryId)); // Sayıya çevirerek eklemek daha güvenlidir
    }

    // Sadece Mevcutlar (Stok > 0)
    // Checkbox'tan 'true' string olarak gelebilir, kontrol ediyoruz.
    if (onlyAvailable === 'true' || onlyAvailable === true) {
      sql += ` AND b.MevcutAdet > 0`;
    }

    // 4.Sıralama eşleşmesi
    const sortMap = {
      Baslik: 'b.Baslik',
      Yazar: 'b.Yazar',
      Yayinevi: 'b.Yayinevi',
      ISBN: 'b.ISBN',
      MevcutAdet: 'b.MevcutAdet',
    };

    const orderBy = sortMap[sortBy] || 'b.Baslik';
    const direction = sortOrder === 'desc' ? 'DESC' : 'ASC';

    sql += ` ORDER BY ${orderBy} ${direction}`;
    // 5. Sorguyu Çalıştır
    try {
      // execute veya query kullanabilirsin. Select işlemleri için query uygundur.
      const [rows] = await pool.query<RowDataPacket[]>(sql, params);
      return rows;
    } catch (error) {
      console.error('Dinamik Sorgu Hatası:', error);
      throw new Error('Veriler çekilirken bir hata oluştu.');
    }
  }
}
