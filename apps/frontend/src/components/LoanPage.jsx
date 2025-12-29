import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  User,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import "../pages/LoanPage.css";

const API = "http://localhost:3000";
const MAX_LOANS_FALLBACK = 5;
const LOAN_DAYS = 15; // ✅ 15 gün

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatTrDate(date) {
  // Örn: 28 Ara 2024
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LoanPage({ user, onNavigate }) {
  // -----------------------------
  // DATA
  // -----------------------------
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);

  // selections
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  // member active loans (selected member detail)
  const [memberActiveLoans, setMemberActiveLoans] = useState([]);

  // search
  const [memberSearch, setMemberSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");

  // cache: listte 2/5 loans gösterebilmek için (hafif lazy fetch)
  const [memberLoansCount, setMemberLoansCount] = useState({}); // { [uyeId]: count }

  // UI
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // FETCH
  // -----------------------------
  useEffect(() => {
    fetch(`${API}/members`)
      .then((r) => r.json())
      .then((rows) => setMembers(Array.isArray(rows) ? rows : []))
      .catch(() => setMembers([]));

    fetch(`${API}/books`)
      .then((r) => r.json())
      .then((rows) => setBooks(Array.isArray(rows) ? rows : []))
      .catch(() => setBooks([]));
  }, []);

  // selected member aktif ödünçleri
  useEffect(() => {
    if (!selectedMember) {
      setMemberActiveLoans([]);
      return;
    }
    const id = selectedMember.id ?? selectedMember.UyeID;
    if (!id) {
      setMemberActiveLoans([]);
      return;
    }

    fetch(`${API}/loans/active/${id}`)
      .then((r) => r.json())
      .then((rows) => setMemberActiveLoans(Array.isArray(rows) ? rows : []))
      .catch(() => setMemberActiveLoans([]));
  }, [selectedMember]);

  // -----------------------------
  // TOAST
  // -----------------------------
  const showToast = (msg, type = "info") => {
    setToast({ show: true, msg, type });
    window.setTimeout(
      () => setToast({ show: false, msg: "", type: "info" }),
      2800
    );
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle size={18} />;
      case "error":
        return <XCircle size={18} />;
      case "warning":
        return <AlertCircle size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  // -----------------------------
  // FILTERS
  // -----------------------------
  const filteredMembers = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();
    return (members || []).filter((m) => {
      if (!term) return true;
      const fullName = `${m.ad || m.Ad || ""} ${
        m.soyad || m.Soyad || ""
      }`.toLowerCase();
      const studentNo = String(m.studentId || m.OgrenciNo || "").toLowerCase();
      return fullName.includes(term) || studentNo.includes(term);
    });
  }, [members, memberSearch]);

  const filteredBooks = useMemo(() => {
    const term = bookSearch.trim().toLowerCase();
    return (books || []).filter((b) => {
      if (!term) return true;
      const title = String(b.baslik || b.Baslik || "").toLowerCase();
      const author = String(b.yazar || b.Yazar || "").toLowerCase();
      const isbn = String(b.isbn || b.ISBN || "").toLowerCase();
      return (
        title.includes(term) || author.includes(term) || isbn.includes(term)
      );
    });
  }, [books, bookSearch]);

  // -----------------------------
  // LAZY: listte "x/5 loans" göstermek için ilk 10 üyeye count çek
  // -----------------------------
  useEffect(() => {
    const take = filteredMembers.slice(0, 10);
    const missing = take
      .map((m) => m.id ?? m.UyeID)
      .filter((id) => id && memberLoansCount[id] === undefined);

    if (missing.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const r = await fetch(`${API}/loans/active/${id}`);
              const rows = await r.json();
              const count = Array.isArray(rows) ? rows.length : 0;
              return [id, count];
            } catch {
              return [id, 0];
            }
          })
        );

        if (cancelled) return;

        setMemberLoansCount((prev) => {
          const next = { ...prev };
          for (const [id, count] of results) next[id] = count;
          return next;
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filteredMembers, memberLoansCount]);

  // -----------------------------
  // DERIVED
  // -----------------------------
  const selectedMemberId = selectedMember?.id ?? selectedMember?.UyeID ?? null;
  const selectedBookId = selectedBook?.id ?? selectedBook?.KitapID ?? null;

  const selectedMemberName = selectedMember
    ? `${selectedMember.ad || selectedMember.Ad || ""} ${
        selectedMember.soyad || selectedMember.Soyad || ""
      }`.trim()
    : "";

  const selectedMemberStudentId = selectedMember
    ? selectedMember.studentId || selectedMember.OgrenciNo || ""
    : "";

  const selectedBookTitle = selectedBook
    ? selectedBook.baslik || selectedBook.Baslik || ""
    : "";
  const selectedBookAuthor = selectedBook
    ? selectedBook.yazar || selectedBook.Yazar || ""
    : "";

  const selectedBookStock = selectedBook
    ? selectedBook.mevcutAdet ?? selectedBook.MevcutAdet ?? 0
    : 0;

  const activeLoanCountForSelected = selectedMember
    ? memberActiveLoans.length
    : 0;

  const maxLoans =
    Number(
      selectedMember?.maxLoans ||
        selectedMember?.MaxLoans ||
        selectedMember?.maksOdunc ||
        selectedMember?.MaksOdunc
    ) || MAX_LOANS_FALLBACK;

  const memberLimitReached = selectedMember
    ? activeLoanCountForSelected >= maxLoans
    : false;

  const bookOutOfStock = selectedBook ? Number(selectedBookStock) <= 0 : false;

  const canConfirm =
    !!selectedMember &&
    !!selectedBook &&
    !memberLimitReached &&
    !bookOutOfStock &&
    !loading;

  // ✅ due date 15 gün sonrası
  const loanDate = useMemo(() => new Date(), []);
  const dueDate = useMemo(() => addDays(loanDate, LOAN_DAYS), [loanDate]);

  // -----------------------------
  // ACTIONS
  // -----------------------------
  const refreshBooks = async () => {
    try {
      const r = await fetch(`${API}/books`);
      const rows = await r.json();
      setBooks(Array.isArray(rows) ? rows : []);
    } catch {
      setBooks([]);
    }
  };

  const handleConfirmLoan = async () => {
    if (!selectedMember || !selectedBook) {
      showToast("Lütfen önce bir üye ve bir kitap seçin.", "warning");
      return;
    }

    if (memberLimitReached) {
      showToast("Bu üye ödünç limitine ulaştı.", "warning");
      return;
    }

    if (bookOutOfStock) {
      showToast("Bu kitabın stoğu tükenmiş!", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        uyeId: selectedMember.id || selectedMember.UyeID,
        kitapId: selectedBook.id || selectedBook.KitapID,
        personelId: user?.id || 1,
      };

      const res = await fetch(`${API}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "İşlem başarısız");
      }

      showToast("Ödünç verme işlemi başarılı!", "success");

      // kitap stokları güncellensin
      await refreshBooks();

      // selected member aktif loan listesi güncellensin
      if (selectedMemberId) {
        try {
          const r = await fetch(`${API}/loans/active/${selectedMemberId}`);
          const rows = await r.json();
          const arr = Array.isArray(rows) ? rows : [];
          setMemberActiveLoans(arr);

          // cache'i de güncelle
          setMemberLoansCount((prev) => ({ ...prev, [selectedMemberId]: arr.length }));
        } catch {
          // ignore
        }
      }

      // seçimleri sıfırla (kitabı sıfırlıyoruz)
      setSelectedBook(null);
      setBookSearch("");
    } catch (err) {
      showToast(err.message || "Hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedMember(null);
    setSelectedBook(null);
    setMemberSearch("");
    setBookSearch("");
    setMemberActiveLoans([]);

    if (typeof onNavigate === "function") {
      onNavigate("loans");
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="nlpPage">
      <div className="nlpHeader">
        <div className="nlpCrumbs">
          <span>Ana Sayfa</span>
          <span className="sep">›</span>
          <span>Ödünç İşlemleri</span>
          <span className="sep">›</span>
          <span className="active">Yeni Ödünç</span>
        </div>
        <h1 className="nlpTitle">Yeni Ödünç</h1>
      </div>

      <div className="nlpGrid">
        {/* STEP 1 */}
        <div className="nlpCard">
          <div className="nlpStepHead">
            <div className="nlpStepIcon cyan">
              <User size={18} />
            </div>
            <div className="nlpStepText">
              <div className="nlpStepTitle">Adım 1: Üye Seç</div>
              <div className="nlpStepSub">Bir üye arayın ve seçin</div>
            </div>
          </div>

          <div className="nlpField">
            <label>Üye Ara</label>
            <div className="nlpInputWrap">
              <Search size={16} />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="İsim veya öğrenci no ile ara..."
              />
            </div>
          </div>

          <div className="nlpList">
            {filteredMembers.length === 0 ? (
              <div className="nlpEmpty">Üye bulunamadı.</div>
            ) : (
              filteredMembers.slice(0, 30).map((m) => {
                const id = m.id ?? m.UyeID;
                const name = `${m.ad || m.Ad || ""} ${m.soyad || m.Soyad || ""}`.trim();
                const studentId = m.studentId || m.OgrenciNo || "";
                const count = memberLoansCount[id] ?? 0;

                const localMax =
                  Number(m.maxLoans || m.MaxLoans || m.maksOdunc || m.MaksOdunc) ||
                  MAX_LOANS_FALLBACK;

                const isSelected = selectedMemberId === id;
                const reached = count >= localMax;

                return (
                  <button
                    key={id}
                    className={`nlpItem ${isSelected ? "selectedCyan" : ""}`}
                    onClick={() => setSelectedMember(m)}
                    type="button"
                  >
                    <div className="nlpItemTop">
                      <div>
                        <div className="nlpItemTitle">{name || "—"}</div>
                        <div className="nlpItemSub">{studentId || "—"}</div>
                      </div>

                      {isSelected && (
                        <CheckCircle className="nlpCheck cyanText" size={18} />
                      )}
                    </div>

                    <div className="nlpBadges">
                      <span className="nlpBadge purple">
                        {count}/{localMax} ödünç
                      </span>
                      {reached && <span className="nlpBadge red">Limit dolu</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selectedMember && (
            <div className="nlpNotice green">
              <CheckCircle size={16} />
              <div>
                <div className="nlpNoticeTitle">Üye Seçildi</div>
                <div className="nlpNoticeSub">
                  {selectedMemberName} daha{" "}
                  <b>{Math.max(0, maxLoans - activeLoanCountForSelected)}</b> kitap ödünç alabilir
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2 */}
        <div className="nlpCard">
          <div className="nlpStepHead">
            <div className="nlpStepIcon purple">
              <BookOpen size={18} />
            </div>
            <div className="nlpStepText">
              <div className="nlpStepTitle">Adım 2: Kitap Seç</div>
              <div className="nlpStepSub">Bir kitap arayın ve seçin</div>
            </div>
          </div>

          <div className="nlpField">
            <label>Kitap Ara</label>
            <div className="nlpInputWrap">
              <Search size={16} />
              <input
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Kitap adı, yazar veya ISBN..."
              />
            </div>
          </div>

          <div className="nlpList">
            {filteredBooks.length === 0 ? (
              <div className="nlpEmpty">Kitap bulunamadı.</div>
            ) : (
              filteredBooks.slice(0, 30).map((b) => {
                const id = b.id ?? b.KitapID;
                const title = b.baslik || b.Baslik || "—";
                const author = b.yazar || b.Yazar || "";
                const stock = Number(b.mevcutAdet ?? b.MevcutAdet ?? 0);

                const isSelected = selectedBookId === id;
                const disabled = stock <= 0;

                return (
                  <button
                    key={id}
                    className={`nlpItem ${isSelected ? "selectedPurple" : ""} ${
                      disabled ? "disabled" : ""
                    }`}
                    onClick={() => {
                      if (disabled) return;
                      setSelectedBook(b);
                    }}
                    type="button"
                    disabled={disabled}
                  >
                    <div className="nlpItemTop">
                      <div>
                        <div className="nlpItemTitle">{title}</div>
                        <div className="nlpItemSub">{author || "—"}</div>
                      </div>

                      {isSelected && (
                        <CheckCircle className="nlpCheck purpleText" size={18} />
                      )}
                    </div>

                    <div className="nlpBadges">
                      <span className={`nlpBadge ${stock > 0 ? "green" : "red"}`}>
                        {stock > 0 ? `${stock} adet mevcut` : "Stokta yok"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selectedBook && (
            <div className="nlpNotice green">
              <CheckCircle size={16} />
              <div>
                <div className="nlpNoticeTitle">Kitap Seçildi</div>
                <div className="nlpNoticeSub">{selectedBookTitle} ödünç verilebilir</div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 3 */}
        <div className="nlpCard span2 nlpStep3">
          <div className="nlpStepHead">
            <div className="nlpStepIcon green">
              <Calendar size={18} />
            </div>
            <div className="nlpStepText">
              <div className="nlpStepTitle">Adım 3: Ödüncü Onayla</div>
              <div className="nlpStepSub">Detayları kontrol edin ve onaylayın</div>
            </div>
          </div>

          {selectedMember && selectedBook ? (
            <>
              <div className="nlpSummaryGrid2">
                <div className="nlpBox">
                  <div className="nlpBoxK">Üye</div>
                  <div className="nlpBoxV">{selectedMemberName}</div>
                  <div className="nlpBoxSub">{selectedMemberStudentId}</div>
                </div>

                <div className="nlpBox">
                  <div className="nlpBoxK">Kitap</div>
                  <div className="nlpBoxV">{selectedBookTitle}</div>
                  <div className="nlpBoxSub">{selectedBookAuthor || "—"}</div>
                </div>
              </div>

              <div className="nlpSummaryGrid3">
                <div className="nlpBox">
                  <div className="nlpBoxK">Ödünç Tarihi</div>
                  <div className="nlpBoxV">{formatTrDate(new Date())}</div>
                </div>

                <div className="nlpBox">
                  <div className="nlpBoxK">Son Teslim Tarihi</div>
                  <div className="nlpBoxV">{formatTrDate(dueDate)}</div>
                </div>

                <div className="nlpBox">
                  <div className="nlpBoxK">Süre</div>
                  <div className="nlpBoxV">{LOAN_DAYS} gün</div>
                </div>
              </div>

              {memberLimitReached && (
                <div className="nlpWarn">
                  <AlertCircle size={16} />
                  <span>Bu üye ödünç limitine ulaştı.</span>
                </div>
              )}

              {bookOutOfStock && (
                <div className="nlpWarn">
                  <AlertCircle size={16} />
                  <span>Bu kitap stokta yok.</span>
                </div>
              )}

              <div className="nlpActions">
                <button className="nlpBtn ghost" type="button" onClick={handleCancel}>
                  İptal
                </button>

                <button
                  className="nlpBtn confirm"
                  type="button"
                  onClick={handleConfirmLoan}
                  disabled={!canConfirm}
                >
                  <CheckCircle size={16} />
                  {loading ? "İşleniyor..." : "Ödüncü Onayla"}
                </button>
              </div>
            </>
          ) : (
            <div className="nlpCenterEmpty">
              <AlertCircle size={44} />
              <p>Devam etmek için hem üye hem kitap seçmelisiniz</p>
            </div>
          )}
        </div>
      </div>

      {/* TOAST */}
      {toast.show && (
        <div className={`nlpToast ${toast.type}`}>
          <div className="nlpToastInner">
            {getToastIcon(toast.type)}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
