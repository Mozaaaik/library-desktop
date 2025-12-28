import { Injectable } from '@nestjs/common';
import { pool } from '../db/mysql';

export interface Book {
  KitapID: number;
  KategoriID: number;
  KategoriAdi?: string; // bazı sorgularda geliyor, bazılarında gelmeyebilir
  Baslik: string;
  Yazar: string;
  Yayinevi: string;
  ISBN: string;
  ToplamAdet: number;
  MevcutAdet: number;
}

@Injectable()
export class BooksService {
  // Kitap arama işlemi
  async searchBooks(search: string): Promise<Book[]> {
    const [rows]: any = await pool.query('CALL sp_KitapAra(?)', [search]);
    return (rows as any[])[0] as Book[];
  }

  // neden rows[0]? => mysql2 şu formatta döner:

  // [
  //   rows,           // asıl veriler
  //   fields          // sütun bilgileri
  // ]

  // Kitap ekleme veya güncelleme işlemi
  async addOrUpdateBook(data: {
    title: string;
    author: string;
    publisher: string;
    isbn: string;
    categoryId: number;
    piece: number;
  }): Promise<{ message: string }> {
    await pool.query('CALL sp_KitapEkleVeyaGuncelle(?,?,?,?,?,?)', [
      data.title,
      data.author,
      data.publisher,
      data.isbn,
      data.categoryId,
      data.piece,
    ]);

    return {
      message: 'Kitap başarıyla eklendi veya güncellendi',
    };
  }
}
