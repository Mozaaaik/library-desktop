import { Injectable } from '@nestjs/common';
import { pool } from '../db/mysql';

@Injectable()
export class BooksService {

    // Kitap arama işlemi
    async searchBooks(search: string) {
        const [rows] = await pool.query('CALL sp_KitapAra(?)', [search]);
        return rows[0];
    }

    // neden rows[0]? => mysql2 şu formatta döner:

    // [
    //   rows,           // asıl veriler
    //   fields          // sütun bilgileri
    // ]


    // Kitap ekleme veya güncelleme işlemi
    async addOrUpdateBook(data: {
        title: string,
        author: string,
        publisher: string,
        isbn: number,
        categoryId: string,
        piece: number
    }) {
        await pool.query(
            'CALL sp_KitapEkleVeyaGuncelle(?,?,?,?,?,?)',
            [
                data.title,
                data.author,
                data.publisher,
                data.isbn,
                data.categoryId,
                data.piece,
            ]
        );
        return {
            message: 'Kitap başarıyla eklendi veya güncellendi',
        };
    }
}
