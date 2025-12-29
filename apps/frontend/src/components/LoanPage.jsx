import React, { useState, useEffect, useRef } from "react"; // useRef eklendi
import {
  Search,
  User,
  BookOpen,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  X,
  Book,
} from "lucide-react";
import "../pages/LoanPage.css";

// --- YENİ: Dışarı Tıklamayı Algılayan Hook ---
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Eğer tıklanan yer ref'in (arama kutusunun) içindeyse hiçbir şey yapma
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export default function LoanPage({ user }) {
  // --- STATE ---
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);

  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [memberActiveLoans, setMemberActiveLoans] = useState([]);

  const [memberSearch, setMemberSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");

  const [isMemberFocused, setIsMemberFocused] = useState(false);
  const [isBookFocused, setIsBookFocused] = useState(false);

  // --- YENİ: Referanslar ---
  const memberWrapperRef = useRef(null);
  const bookWrapperRef = useRef(null);

  // --- YENİ: Hook Kullanımı ---
  // Üye arama kutusu dışına tıklanırsa kapat
  useOnClickOutside(memberWrapperRef, () => setIsMemberFocused(false));
  // Kitap arama kutusu dışına tıklanırsa kapat
  useOnClickOutside(bookWrapperRef, () => setIsBookFocused(false));

  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [loading, setLoading] = useState(false);

  // Verileri çek
  useEffect(() => {
    fetch("http://localhost:3000/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(console.error);
    fetch("http://localhost:3000/books")
      .then((r) => r.json())
      .then(setBooks)
      .catch(console.error);
  }, []);

  // Üye seçilince aktif borçları getir
  useEffect(() => {
    if (selectedMember) {
      const id = selectedMember.id || selectedMember.UyeID;
      fetch(`http://localhost:3000/loans/active/${id}`)
        .then((r) => r.json())
        .then(setMemberActiveLoans)
        .catch(() => setMemberActiveLoans([]));
    } else {
      setMemberActiveLoans([]);
    }
  }, [selectedMember]);

  // Toast Helper
  const showToast = (msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle size={20} />;
      case "error": return <XCircle size={20} />;
      case "warning": return <AlertCircle size={20} />;
      default: return <Info size={20} />;
    }
  };

  // --- İŞLEMLER ---
  const handleLend = async () => {
    if (!selectedMember || !selectedBook) {
      showToast("Lütfen önce bir üye ve bir kitap seçin.", "warning");
      return;
    }

    const currentStock = selectedBook.mevcutAdet ?? selectedBook.MevcutAdet;
    if (currentStock <= 0) {
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

      const res = await fetch("http://localhost:3000/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "İşlem başarısız");
      }

      showToast("Ödünç işlemi başarılı!", "success");

      setSelectedBook(null);
      setBookSearch("");

      fetch("http://localhost:3000/books")
        .then((r) => r.json())
        .then(setBooks);

      const updatedMember = { ...selectedMember };
      setSelectedMember(updatedMember);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- FİLTRELEME ---
  const filteredMembers = members
    .filter((m) => {
      const term = memberSearch.toLowerCase();
      if (!term) return true;
      
      const fullName = `${m.ad || m.Ad} ${m.soyad || m.Soyad}`.toLowerCase();
      const studentNo = (m.studentId || m.OgrenciNo || "").toLowerCase();
      return fullName.includes(term) || studentNo.includes(term);
    })
    

  const filteredBooks = books
    .filter((b) => {
      const term = bookSearch.toLowerCase();
      if (!term) return true;

      const title = (b.baslik || b.Baslik || "").toLowerCase();
      const isbn = b.isbn || b.ISBN || "";
      return title.includes(term) || isbn.includes(term);
    })
    

  return (
    <div className="loan-page">
      <div className="lp-header">
        <h1>Ödünç Verme İşlemi</h1>
      </div>

      <div className="lp-grid">
        {/* SOL: ÜYE SEÇİMİ */}
        <div className="lp-card">
          <div className="lp-card-title">
            <User size={20} /> Üye Seçimi
          </div>

          {selectedMember ? (
            <div className="selected-item-card member">
              <div className="info">
                <h3>
                  {selectedMember.ad || selectedMember.Ad}{" "}
                  {selectedMember.soyad || selectedMember.Soyad}
                </h3>
                <span>
                  No: {selectedMember.studentId || selectedMember.OgrenciNo}
                </span>
              </div>
              <button
                className="remove-btn"
                onClick={() => setSelectedMember(null)}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            // --- YENİ: Ref wrapper ---
            <div className="search-box" ref={memberWrapperRef}>
              <Search className="icon" size={18} />
              <input
                placeholder="Üye adı veya öğrenci no..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                onFocus={() => setIsMemberFocused(true)}
                // onBlur kaldırıldı
              />
              {(memberSearch || isMemberFocused) && (
                <div className="search-results">
                  {filteredMembers.map((m) => (
                    <div
                      key={m.id || m.UyeID}
                      className="result-item"
                      onClick={() => {
                        setSelectedMember(m);
                        setMemberSearch("");
                        setIsMemberFocused(false); // Seçince listeyi kapat
                      }}
                    >
                      <b>
                        {m.ad || m.Ad} {m.soyad || m.Soyad}
                      </b>{" "}
                      ({m.studentId || m.OgrenciNo})
                    </div>
                  ))}
                  {filteredMembers.length === 0 && (
                    <div className="result-item disabled">Sonuç bulunamadı</div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedMember && (
            <div className="active-loans-list">
              <h4>Mevcut Ödünçleri ({memberActiveLoans.length})</h4>
              {memberActiveLoans.length > 0 ? (
                <ul>
                  {memberActiveLoans.map((l, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Book size={16} color="#60a5fa" />
                      <span>{l.Baslik}</span>
                      <small style={{ marginLeft: "auto", color: "#64748b" }}>
                        {new Date(l.SonTeslimTarihi).toLocaleDateString()}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-text">Üyenin üzerinde kitap yok.</p>
              )}
            </div>
          )}
        </div>

        {/* SAĞ: KİTAP SEÇİMİ */}
        <div className="lp-card">
          <div className="lp-card-title">
            <BookOpen size={20} /> Kitap Seçimi
          </div>

          {selectedBook ? (
            <div className="selected-item-card book">
              <div className="info">
                <h3>{selectedBook.baslik || selectedBook.Baslik}</h3>
                <div className="stock-badge">
                  Stok:{" "}
                  <b>{selectedBook.mevcutAdet ?? selectedBook.MevcutAdet}</b>
                </div>
              </div>
              <button
                className="remove-btn"
                onClick={() => setSelectedBook(null)}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
             // --- YENİ: Ref wrapper ---
            <div className="search-box" ref={bookWrapperRef}>
              <Search className="icon" size={18} />
              <input
                placeholder="Kitap adı veya ISBN..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                onFocus={() => setIsBookFocused(true)}
                // onBlur kaldırıldı
              />
              
              {(bookSearch || isBookFocused) && (
                <div className="search-results">
                  {filteredBooks.map((b) => {
                    const stok = b.mevcutAdet ?? b.MevcutAdet;
                    return (
                      <div
                        key={b.id || b.KitapID}
                        className={`result-item ${
                          stok === 0 ? "disabled" : ""
                        }`}
                        onClick={() => {
                          if (stok > 0) {
                            setSelectedBook(b);
                            setBookSearch("");
                            setIsBookFocused(false); // Seçince listeyi kapat
                          }
                        }}
                      >
                        <div className="res-row">
                          <b>{b.baslik || b.Baslik}</b>
                          <span className={stok > 0 ? "stk-ok" : "stk-no"}>
                            {stok > 0 ? `Stok: ${stok}` : "TÜKENDİ"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredBooks.length === 0 && (
                    <div className="result-item disabled">Sonuç bulunamadı</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="lp-actions">
        <button
          className="lend-btn"
          disabled={!selectedMember || !selectedBook || loading}
          onClick={handleLend}
        >
          {loading ? "İşleniyor..." : "Ödünç Ver"}
        </button>
      </div>

      {toast.show && (
        <div className={`lp-toast ${toast.type}`}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {getToastIcon(toast.type)}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}