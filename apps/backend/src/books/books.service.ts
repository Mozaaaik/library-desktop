import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../db/mysql';

export interface Book {
    KitapID: number;
    KategoriID: number;
    KategoriAdi?: string;
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


    // Kitap ekleme işlemi
    async addBook(data: {
        title: string;
        author: string;
        publisher: string;
        isbn: string;
        categoryId: number;
        piece: number;
    }): Promise<{ message: string }> {
        try {
            await pool.query('CALL sp_KitapEkle(?,?,?,?,?,?)', [
                data.title,
                data.author,
                data.publisher ?? '',
                data.isbn,          // string kalsın
                data.categoryId,    // number
                data.piece,         // number
            ]);

            return { message: 'Kitap başarıyla eklendi veya güncellendi' };
        } catch (err: any) {
            console.log("MYSQL ERROR:", err); // ✅ terminalde net gör
            throw new BadRequestException(err?.sqlMessage || err?.message || "DB error");
        }
    }

    // Kitap güncelleme işlemi
    async updateBook(id: number, data: {
        title: string;
        author: string;
        publisher: string;
        isbn: string;
        categoryId: number;
        piece: number;
    }): Promise<{ message: string }> {

        await pool.query(
            'CALL sp_KitapGuncelle(?,?,?,?,?,?,?)',
            [
                id,
                data.title,
                data.author,
                data.publisher,
                data.isbn,
                data.categoryId,
                data.piece,
            ],
        );

        return { message: 'Kitap güncellendi' };
    }

    // Kitap silme işlemi
    async deleteBook(bookId: number): Promise<{ message: string }> {
        try {
            // Direkt query ile sil (prosedür şart değil)
            const [result]: any = await pool.query(
                'DELETE FROM Kitaplar WHERE KitapID = ?',
                [bookId],
            );

            if (!result || result.affectedRows === 0) {
                throw new NotFoundException('Kitap bulunamadı.');
            }

            return { message: 'Kitap silindi' };
        } catch (err: any) {
            // FK varsa (ödünç/işlem tablosu vs.) kitap silinemeyebilir
            // MySQL: ER_ROW_IS_REFERENCED_2 => errno 1451
            if (err?.errno === 1451) {
                throw new ConflictException(
                    'Bu kitap başka kayıtlara bağlı (örn. ödünç). Önce ilişkili kayıtları silmelisin.',
                );
            }
            throw err;
        }
    }

    // Kategori listeleme (BooksService içinde)
    async listCategories(): Promise<{ KategoriID: number; KategoriAdi: string }[]> {
        // Prosedür kullanmadan:
        const [rows]: any = await pool.query(
            'SELECT KategoriID, KategoriAdi FROM Kategoriler ORDER BY KategoriAdi'
        );
        return rows as { KategoriID: number; KategoriAdi: string }[];

    }
}
