import { Injectable } from '@nestjs/common';
import { pool } from '../db/mysql';

export interface DashboardSummary {
  kpis: {
    totalMembers: number;
    activeLoans: number;
    overdueLoans: number;
    unpaidFines: number;
  };
  topOverdue: Array<{
    uyeId: number;
    memberName: string;
    studentNo: string;
    overdueDays: number;
    overdueCount: number;
  }>;
  latestFines: Array<{
    cezaId: number;
    uyeId: number;
    memberName: string;
    studentNo: string;
    amount: number;
    status: 'Paid' | 'Unpaid';
    reason: string | null;
    createdAt: string;
  }>;
}

@Injectable()
export class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    // 1) KPI (Aynı)
    const [kpiRows]: any = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM Uyeler) AS totalMembers,
        (SELECT COUNT(*) FROM OduncIslemleri WHERE TeslimTarihi IS NULL) AS activeLoans,
        (SELECT COUNT(*) FROM OduncIslemleri 
          WHERE TeslimTarihi IS NULL AND SonTeslimTarihi < NOW()
        ) AS overdueLoans,
        (SELECT COUNT(*) FROM Cezalar WHERE Durum = 'Unpaid') AS unpaidFines;
    `);

    const kpis = {
      totalMembers: Number(kpiRows?.[0]?.totalMembers ?? 0),
      activeLoans: Number(kpiRows?.[0]?.activeLoans ?? 0),
      overdueLoans: Number(kpiRows?.[0]?.overdueLoans ?? 0),
      unpaidFines: Number(kpiRows?.[0]?.unpaidFines ?? 0),
    };

    // 2) Top 3 geciken üye (Aynı)
    const [overdueRows]: any = await pool.query(`
      SELECT 
        u.UyeID,
        CONCAT(u.Ad, ' ', u.Soyad) AS memberName,
        u.OgrenciNo AS studentNo,
        MAX(DATEDIFF(CURDATE(), DATE(o.SonTeslimTarihi))) AS overdueDays,
        COUNT(*) AS overdueCount
      FROM OduncIslemleri o
      JOIN Uyeler u ON u.UyeID = o.UyeID
      WHERE o.TeslimTarihi IS NULL 
        AND o.SonTeslimTarihi < NOW()
      GROUP BY u.UyeID, u.Ad, u.Soyad, u.OgrenciNo
      ORDER BY overdueDays DESC, overdueCount DESC
      LIMIT 3;
    `);

    const topOverdue = (overdueRows || []).map((r: any) => ({
      uyeId: Number(r.UyeID),
      memberName: String(r.memberName ?? '-'),
      studentNo: String(r.studentNo ?? '-'),
      overdueDays: Number(r.overdueDays ?? 0),
      overdueCount: Number(r.overdueCount ?? 0),
    }));

    // 3) Son 3 ceza (GÜNCELLENDİ: Ödeme işlemine göre sıralama eklendi)
    // GREATEST(Olusturma, Odeme) mantığı ile en son işlem gören en üste çıkar.
    const [fineRows]: any = await pool.query(`
      SELECT 
        c.CezaID,
        c.UyeID,
        CONCAT(u.Ad, ' ', u.Soyad) AS memberName,
        u.OgrenciNo AS studentNo,
        c.Tutar AS amount,
        c.Durum AS status,
        c.Aciklama AS reason,
        c.OlusturmaTarihi AS createdAt,
        c.OdemeTarihi
      FROM Cezalar c
      JOIN Uyeler u ON u.UyeID = c.UyeID
      ORDER BY GREATEST(c.OlusturmaTarihi, COALESCE(c.OdemeTarihi, c.OlusturmaTarihi)) DESC
      LIMIT 3;
    `);

    const latestFines = (fineRows || []).map((r: any) => ({
      cezaId: Number(r.CezaID),
      uyeId: Number(r.UyeID),
      memberName: String(r.memberName ?? '-'),
      studentNo: String(r.studentNo ?? '-'),
      amount: Number(r.amount ?? 0),
      status: r.status === 'Paid' ? 'Paid' : 'Unpaid',
      reason: r.reason ?? null,
      createdAt: String(r.createdAt ?? ''),
    }));

    return { kpis, topOverdue, latestFines };
  }
}
