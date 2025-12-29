import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { pool } from '../db/mysql';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  // (Opsiyonel) Personel oluştururken şifre hashlemek için
  async createPersonel(data: {
    kullaniciAdi: string;
    sifre: string;
    rol?: 'Admin' | 'Gorevli';
    adSoyad: string;
  }) {
    const saltRounds = 10;
    const hashed = await bcrypt.hash(data.sifre, saltRounds);

    try {
      await pool.query(
        `INSERT INTO Personel (KullaniciAdi, Sifre, Rol, AdSoyad)
         VALUES (?,?,?,?)`,
        [data.kullaniciAdi, hashed, data.rol ?? 'Gorevli', data.adSoyad],
      );

      return { message: 'Personel created' };
    } catch (err: any) {
      throw new BadRequestException(err.sqlMessage || 'Create failed');
    }
  }

  //  LOGIN
  async login(data: { kullaniciAdi: string; sifre: string }) {
    const [rows]: any = await pool.query(
      `SELECT PersonelID, KullaniciAdi, Sifre, Rol, AdSoyad
       FROM Personel
       WHERE KullaniciAdi = ?
       LIMIT 1`,
      [data.kullaniciAdi],
    );

    const user = rows?.[0];
    if (!user) throw new UnauthorizedException('Invalid username or password');

    const ok = await bcrypt.compare(data.sifre, user.Sifre);
    if (!ok) throw new UnauthorizedException('Invalid username or password');

    // JWT şart değil dedin → sadece kullanıcı bilgisi dönelim
    return {
      personelId: user.PersonelID,
      kullaniciAdi: user.KullaniciAdi,
      rol: user.Rol,
      adSoyad: user.AdSoyad,
    };
  }
}
