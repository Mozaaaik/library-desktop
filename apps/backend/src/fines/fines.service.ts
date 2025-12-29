import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { pool } from '../db/mysql';

type ListParams = {
  memberId: number | null;
  from: string | null; // "YYYY-MM-DD"
  to: string | null; // "YYYY-MM-DD"
};

function isYmd(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// mysql2 CALL çıktısı genelde: [ [rows], [proc meta] ]
function unwrapCallRows(result: any) {
  const rows = result?.[0];
  // rows bazen [[...]] şeklinde gelir
  if (Array.isArray(rows) && Array.isArray(rows[0])) return rows[0];
  return rows ?? [];
}

@Injectable()
export class FinesService {
  async list(params: ListParams) {
    const { memberId, from, to } = params;

    if (from && !isYmd(from))
      throw new BadRequestException('from format YYYY-MM-DD olmalı');
    if (to && !isYmd(to))
      throw new BadRequestException('to format YYYY-MM-DD olmalı');

    const [result] = await pool.query('CALL sp_CezaListele(?, ?, ?)', [
      memberId,
      from,
      to,
    ]);

    return unwrapCallRows(result);
  }

  async detail(cezaId: number) {
    const [result] = await pool.query('CALL sp_CezaDetay(?)', [cezaId]);
    const rows = unwrapCallRows(result);
    const one = rows?.[0];

    if (!one) throw new NotFoundException('Ceza bulunamadı');
    return one;
  }

  async pay(cezaId: number) {
    const [result] = await pool.query('CALL sp_CezaOde(?)', [cezaId]);
    const rows = unwrapCallRows(result);
    const affected = Number(rows?.[0]?.affected ?? 0);

    if (affected === 0)
      throw new NotFoundException('Ceza bulunamadı / güncellenmedi');
    return { ok: true, affected };
  }
}
