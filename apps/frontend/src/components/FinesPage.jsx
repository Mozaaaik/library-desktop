import { useEffect, useMemo, useState } from "react";
import {
    Search,
    AlertCircle,
    CheckCircle,
    DollarSign,
    X,
    Info,
    Loader2,
} from "lucide-react";
import "../pages/FinesPage.css";

const API_URL = "http://localhost:3000";
const PAGE_SIZE = 7;

// -----------------------------
// Helpers
// -----------------------------
function moneyTry(v) {
    const n = Number(v ?? 0);
    return `₺${n.toFixed(2)}`;
}

// ✅ "unpaid" içinde "paid" geçtiği için önce UNPAID kontrol edilir.
function normalizeStatus(raw) {
    const s = String(raw ?? "").toLowerCase().trim();
    if (!s) return "Unpaid";

    if (
        s === "unpaid" ||
        s.includes("unpaid") ||
        s.includes("odenmedi") ||
        s.includes("ödenmedi") ||
        s.includes("odeme yapilmadi") ||
        s.includes("ödeme yapılmadı")
    ) {
        return "Unpaid";
    }

    if (
        s === "paid" ||
        s.includes("paid") ||
        s.includes("odendi") ||
        s.includes("ödendi") ||
        s.includes("odeme yapildi") ||
        s.includes("ödeme yapıldı")
    ) {
        return "Paid";
    }

    return "Unpaid";
}

function statusTextTR(status) {
    return status === "Paid" ? "Ödendi" : "Ödenmedi";
}

function mapDbFineToUi(row) {
    return {
        id: row.CezaID ?? row.id ?? row.FineID,
        memberId: row.UyeID ?? row.uyeId ?? row.MemberID,
        memberName: row.AdSoyad ?? row.memberName ?? row.UyeAdSoyad ?? "",
        studentId: row.OgrenciNo ?? row.studentId ?? "",
        book: row.KitapBaslik ?? row.book ?? row.Baslik ?? "",
        daysOverdue: Number(row.GecikmeGun ?? row.daysOverdue ?? 0),
        amount: Number(row.Tutar ?? row.amount ?? 0),
        status: normalizeStatus(row.Durum ?? row.status),

        // detay için
        islemId: row.IslemID ?? row.islemId ?? null,
        createdAt: row.OlusturmaTarihi ?? row.createdAt ?? null,
        dueDate: row.SonTeslimTarihi ?? row.dueDate ?? null,
        paidAt: row.OdemeTarihi ?? row.paidAt ?? null,
        teslimTarihi: row.TeslimTarihi ?? row.teslimTarihi ?? null,
        aciklama: row.Aciklama ?? row.aciklama ?? null,
    };
}

// DB’den gelen tarih formatları farklı olabilir diye “sağlam” parse
function parseAnyDate(value) {
    if (!value) return null;

    // ISO / YYYY-MM-DD / YYYY-MM-DDTHH:MM:SS
    const d1 = new Date(value);
    if (!Number.isNaN(d1.getTime())) return d1;

    // TR: DD.MM.YYYY
    const s = String(value);
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (m) {
        const dd = Number(m[1]);
        const mm = Number(m[2]);
        const yy = Number(m[3]);
        const d2 = new Date(yy, mm - 1, dd);
        if (!Number.isNaN(d2.getTime())) return d2;
    }

    return null;
}

function getPageNumbers(currentPage, totalPages) {
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;

    if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - maxButtons + 1);
    }
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
}

function formatDateTimeTR(value) {
    if (!value) return "—";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value); // bozuksa raw göster

    // TR format + saat:dk
    return d.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateTR(value) {
    if (!value) return "—";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);

    return d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}


export default function FinesPage({ onNavigate, user }) {
    // -----------------------------
    // DATA
    // -----------------------------
    const [allFines, setAllFines] = useState([]); // ✅ tek sefer çekilen tüm cezalar
    const [isLoading, setIsLoading] = useState(false);

    // -----------------------------
    // FILTERS (local)
    // -----------------------------
    const [searchQuery, setSearchQuery] = useState(""); // ✅ Üye ara artık local search
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // -----------------------------
    // UI
    // -----------------------------
    const [toast, setToast] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // detail modal
    const [detailFineId, setDetailFineId] = useState(null);
    const [detailFine, setDetailFine] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const showToast = (msg) => {
        setToast(msg);
        window.setTimeout(() => setToast(""), 2200);
    };

    // -----------------------------
    // API
    // -----------------------------
    const fetchFinesOnce = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/fines`);
            if (!res.ok) throw new Error("fines fetch failed");

            const rows = await res.json();
            const mapped = (Array.isArray(rows) ? rows : []).map(mapDbFineToUi);
            setAllFines(mapped);
        } catch (e) {
            console.error("fetchFinesOnce error:", e);
            setAllFines([]);
            showToast("Hata: Cezalar alınamadı.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFineDetail = async (id) => {
        if (!id) return;
        setDetailLoading(true);
        setDetailFine(null);

        try {
            const res = await fetch(`${API_URL}/fines/${id}`);
            if (!res.ok) throw new Error("detail fetch failed");

            const row = await res.json();
            setDetailFine(mapDbFineToUi(row));
        } catch (e) {
            console.error("fetchFineDetail error:", e);
            showToast("Hata: Ceza detayı alınamadı.");
            setDetailFine(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const markAsPaid = async (fine) => {
        if (!fine?.id) return;

        try {
            const res = await fetch(`${API_URL}/fines/${fine.id}/pay`, {
                method: "PATCH",
            });
            if (!res.ok) throw new Error("pay failed");

            showToast("Ceza 'Ödendi' olarak işaretlendi ✅");

            // ✅ local listede anında güncelle
            setAllFines((prev) =>
                prev.map((x) => (x.id === fine.id ? { ...x, status: "Paid" } : x))
            );

            // detay açıksa onu da güncelle
            setDetailFine((prev) =>
                prev && prev.id === fine.id
                    ? { ...prev, status: "Paid", paidAt: new Date().toISOString() }
                    : prev
            );
        } catch (e) {
            console.error(e);
            showToast("Hata: Ödeme güncellenemedi.");
        }
    };

    // -----------------------------
    // EFFECTS
    // -----------------------------
    useEffect(() => {
        fetchFinesOnce();
    }, []);

    // filtre değişince sayfa 1 (BooksPage gibi)
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, dateFrom, dateTo]);

    // detail id değişince detail çek
    useEffect(() => {
        if (detailFineId) fetchFineDetail(detailFineId);
    }, [detailFineId]);

    // -----------------------------
    // LOCAL FILTER (BooksPage gibi)
    // -----------------------------
    const filteredFines = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        // date range (input type="date" → YYYY-MM-DD)
        const fromD = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
        const toD = dateTo ? new Date(dateTo + "T23:59:59") : null;

        return allFines.filter((f) => {
            // text search: üye adı / öğrenci no / kitap
            const matchesSearch =
                !q ||
                (f.memberName ?? "").toLowerCase().includes(q) ||
                String(f.studentId ?? "").toLowerCase().includes(q) ||
                (f.book ?? "").toLowerCase().includes(q);

            // date filter: createdAt varsa onu kullan, yoksa dueDate dene
            let okDate = true;
            if (fromD || toD) {
                const d = parseAnyDate(f.createdAt) || parseAnyDate(f.dueDate);
                if (!d) {
                    // tarih yoksa filtreyi bozmasın diye “geçsin” diyebilirsin,
                    // ama genelde tarih filtresinde tarih olmayanlar görünmesin istenir:
                    okDate = false;
                } else {
                    if (fromD && d < fromD) okDate = false;
                    if (toD && d > toD) okDate = false;
                }
            }

            return matchesSearch && okDate;
        });
    }, [allFines, searchQuery, dateFrom, dateTo]);

    // -----------------------------
    // DERIVED (kartlar artık filtrelenmiş listeye göre)
    // -----------------------------
    const totalUnpaid = useMemo(() => {
        return filteredFines
            .filter((f) => f.status === "Unpaid")
            .reduce((sum, f) => sum + Number(f.amount || 0), 0);
    }, [filteredFines]);

    const totalPaid = useMemo(() => {
        return filteredFines
            .filter((f) => f.status === "Paid")
            .reduce((sum, f) => sum + Number(f.amount || 0), 0);
    }, [filteredFines]);

    const totalPages = Math.max(1, Math.ceil(filteredFines.length / PAGE_SIZE));

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
        if (currentPage < 1) setCurrentPage(1);
    }, [currentPage, totalPages]);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredFines.slice(start, start + PAGE_SIZE);
    }, [filteredFines, currentPage]);

    const pageNumbers = useMemo(
        () => getPageNumbers(currentPage, totalPages),
        [currentPage, totalPages]
    );

    // -----------------------------
    // ACTIONS
    // -----------------------------
    const clearFilters = () => {
        setSearchQuery("");
        setDateFrom("");
        setDateTo("");
        setCurrentPage(1);
    };

    const openDetail = (fine) => setDetailFineId(fine.id);
    const closeDetail = () => {
        setDetailFineId(null);
        setDetailFine(null);
    };

    // -----------------------------
    // RENDER
    // -----------------------------
    return (
        <div className="finesPage">
            {/* Header */}
            <div className="fpHeader">
                <div className="fpCrumbs">
                    <span>Ana Sayfa</span>
                    <span className="sep">›</span>
                    <span className="active">Cezalar</span>
                </div>
                <h1 className="fpTitle">Cezalar / Gecikme</h1>
            </div>

            {/* Summary Cards */}
            <div className="fpCards">
                <div className="fpCard fpCardRed">
                    <div>
                        <div className="fpCardValue">{moneyTry(totalUnpaid)}</div>
                        <div className="fpCardLabel">Toplam Ödenmemiş</div>
                    </div>
                    <div className="fpIcon fpIconRed">
                        <AlertCircle size={22} />
                    </div>
                </div>

                <div className="fpCard fpCardGreen">
                    <div>
                        <div className="fpCardValue">{moneyTry(totalPaid)}</div>
                        <div className="fpCardLabel">Toplam Ödenmiş</div>
                    </div>
                    <div className="fpIcon fpIconGreen">
                        <CheckCircle size={22} />
                    </div>
                </div>

                <div className="fpCard fpCardCyan">
                    <div>
                        <div className="fpCardValue">{moneyTry(totalPaid + totalUnpaid)}</div>
                        <div className="fpCardLabel">Toplam Ceza</div>
                    </div>
                    <div className="fpIcon fpIconCyan">
                        <DollarSign size={22} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="fpFilters">
                {/* Search */}
                <div className="fpField">
                    <label>Üye Ara</label>
                    <div className="fpSearchWrap">
                        <Search size={16} className="fpSearchIcon" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="fpInput"
                            placeholder="Üye adı / öğrenci no / kitap ile ara..."
                        />
                        {searchQuery.trim() && (
                            <button
                                type="button"
                                className="fpClearChip"
                                onClick={() => setSearchQuery("")}
                                title="Aramayı temizle"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Date from */}
                <div className="fpField">
                    <label>Başlangıç Tarihi</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="fpInput"
                    />
                </div>

                {/* Date to */}
                <div className="fpField">
                    <label>Bitiş Tarihi</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="fpInput"
                    />
                </div>

                <div className="fpFilterActions">
                    <button className="fpGhostBtn" onClick={clearFilters} type="button">
                        Temizle
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="fpTableCard">
                {isLoading ? (
                    <div className="fpLoading">
                        <Loader2 className="spin" size={34} />
                    </div>
                ) : filteredFines.length === 0 ? (
                    <div className="fpEmpty">
                        <div className="fpEmptyTitle">Ceza bulunamadı</div>
                        <div className="fpEmptySub">Arama/filtreleri değiştirip tekrar dene.</div>
                        <button className="fpGhostBtn" onClick={clearFilters} type="button">
                            Filtreleri Temizle
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="fpTableWrap">
                            <table className="fpTable">
                                <thead>
                                    <tr>
                                        <th>Üye</th>
                                        <th>Öğrenci No</th>
                                        <th>Kitap</th>
                                        <th>Gecikme</th>
                                        <th>Tutar</th>
                                        <th>Durum</th>
                                        <th className="right">İşlemler</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginated.map((fine) => (
                                        <tr
                                            key={fine.id}
                                            className={fine.status === "Unpaid" ? "rowUnpaid" : ""}
                                            onClick={() => openDetail(fine)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <td className="strong">{fine.memberName}</td>
                                            <td className="muted">{fine.studentId}</td>
                                            <td className="muted">{fine.book}</td>
                                            <td className="overdue">{fine.daysOverdue} gün</td>
                                            <td className="amount">{moneyTry(fine.amount)}</td>
                                            <td>
                                                <span
                                                    className={
                                                        fine.status === "Paid"
                                                            ? "fpBadge fpBadgeGreen"
                                                            : "fpBadge fpBadgeRed"
                                                    }
                                                >
                                                    {statusTextTR(fine.status)}
                                                </span>
                                            </td>

                                            <td className="right" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="fpIconBtn"
                                                    title="Detay"
                                                    type="button"
                                                    onClick={() => openDetail(fine)}
                                                >
                                                    <Info size={16} />
                                                </button>

                                                {fine.status === "Unpaid" ? (
                                                    <button
                                                        className="fpPayBtn"
                                                        type="button"
                                                        onClick={() => markAsPaid(fine)}
                                                    >
                                                        Ödendi İşaretle
                                                    </button>
                                                ) : (
                                                    <span className="paidText">Ödendi</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="fpTableFooter">
                            <div className="fpFooterText">
                                Gösterilen:{" "}
                                <b>{(currentPage - 1) * PAGE_SIZE + 1}</b> -{" "}
                                <b>{Math.min(currentPage * PAGE_SIZE, filteredFines.length)}</b> /{" "}
                                <b>{filteredFines.length}</b>
                            </div>

                            <div className="fpPager">
                                <button
                                    className="fpPagerBtn"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    type="button"
                                >
                                    Önceki
                                </button>

                                {pageNumbers.map((p) => (
                                    <button
                                        key={p}
                                        className={`fpPagerBtn ${p === currentPage ? "fpPagerActive" : ""}`}
                                        onClick={() => setCurrentPage(p)}
                                        type="button"
                                    >
                                        {p}
                                    </button>
                                ))}

                                <button
                                    className="fpPagerBtn"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    type="button"
                                >
                                    Sonraki
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {detailFineId && (
                <div className="fpModalOverlay" role="dialog" aria-modal="true">
                    <div className="fpModal">
                        <div className="fpModalHead">
                            <div>
                                <div className="fpModalTitle">Ceza Detayı</div>
                                <div className="fpModalSub">
                                    {detailFine?.memberName ?? "—"} • {detailFine?.studentId ?? "—"}
                                </div>
                            </div>
                            <button className="fpModalX" type="button" onClick={closeDetail}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="fpModalBody">
                            {detailLoading ? (
                                <div className="fpLoading" style={{ minHeight: 120 }}>
                                    <Loader2 className="spin" size={28} />
                                </div>
                            ) : !detailFine ? (
                                <div className="fpEmpty">
                                    <div className="fpEmptyTitle">Detay bulunamadı</div>
                                    <div className="fpEmptySub">Tekrar dene.</div>
                                </div>
                            ) : (
                                <div className="fpDetailGrid">
                                    <div className="fpDetailItem">
                                        <div className="k">Kitap</div>
                                        <div className="v">{detailFine.book || "—"}</div>
                                    </div>
                                    <div className="fpDetailItem">
                                        <div className="k">Gecikme</div>
                                        <div className="v">{detailFine.daysOverdue} gün</div>
                                    </div>
                                    <div className="fpDetailItem">
                                        <div className="k">Tutar</div>
                                        <div className="v">{moneyTry(detailFine.amount)}</div>
                                    </div>
                                    <div className="fpDetailItem">
                                        <div className="k">Durum</div>
                                        <div className="v">
                                            <span
                                                className={
                                                    detailFine.status === "Paid"
                                                        ? "fpBadge fpBadgeGreen"
                                                        : "fpBadge fpBadgeRed"
                                                }
                                            >
                                                {statusTextTR(detailFine.status)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="fpDetailItem">
                                        <div className="k">İşlem ID</div>
                                        <div className="v">{detailFine.islemId ?? "—"}</div>
                                    </div>
                                    <div className="fpDetailItem">
                                        <div className="k">Oluşturma Tarihi</div>
                                        <div className="v">{formatDateTimeTR(detailFine.createdAt)}</div>
                                    </div>
                                    <div className="fpDetailItem">
                                        <div className="k">Son Teslim Tarihi</div>
                                        <div className="v">{formatDateTimeTR(detailFine.dueDate)}</div>
                                    </div>
                                    <div className="fpDetailItem">
                                        <div className="k">Ödeme Tarihi</div>
                                      <div className="v">{formatDateTimeTR(detailFine.paidAt)}</div>
                                    </div>

                                    <div className="fpDetailItem" style={{ gridColumn: "1 / -1" }}>
                                        <div className="k">Açıklama</div>
                                        <div className="v">{detailFine.aciklama ?? "—"}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="fpModalFoot">
                            {detailFine?.status === "Unpaid" ? (
                                <button
                                    className="fpPayBtn"
                                    type="button"
                                    onClick={() => {
                                        markAsPaid(detailFine);
                                        closeDetail();
                                    }}
                                >
                                    Ödendi İşaretle
                                </button>
                            ) : (
                                <button className="fpGhostBtn" type="button" onClick={closeDetail}>
                                    Kapat
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="fpToast">{toast}</div>}
        </div>
    );
}
