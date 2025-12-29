import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  ClipboardCheck,
  User,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Banknote,
  BookUp,
  Filter,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import "../pages/ReturnPage.css";

const API = "http://localhost:3000";

const ReturnPage = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [resultModal, setResultModal] = useState(null);
  const [activeLoans, setActiveLoans] = useState([]);

  // kategori filtre
  const [selectedCategory, setSelectedCategory] = useState("Tüm Kategoriler");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // dışarı tıklayınca dropdown kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // veri çek
  useEffect(() => {
    fetch(`${API}/returns/active?search=${encodeURIComponent(searchTerm)}`)
      .then((res) => res.json())
      .then((data) => setActiveLoans(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Veri hatası:", err));
  }, [searchTerm]);

  // benzersiz kategoriler
  const categories = useMemo(() => {
    const list = Array.isArray(activeLoans) ? activeLoans : [];
    return ["Tüm Kategoriler", ...new Set(list.map((l) => l.category).filter(Boolean))];
  }, [activeLoans]);

  // sadece kategori filtresi (arama zaten backend’de)
  const filteredLoans = useMemo(() => {
    const list = Array.isArray(activeLoans) ? activeLoans : [];
    return list.filter((loan) => {
      const categoryMatch =
        selectedCategory === "Tüm Kategoriler" || loan.category === selectedCategory;
      return categoryMatch;
    });
  }, [activeLoans, selectedCategory]);

  const calculateDelayInfo = (dueDateStr) => {
    const today = new Date();
    const due = new Date(dueDateStr);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleReturnBook = async () => {
    if (!selectedLoan) return;

    try {
      const response = await fetch(`${API}/returns/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oduncId: selectedLoan.id }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setResultModal({
        success: true,
        delay: result?.data?.delayDays ?? 0,
        fine: result?.data?.fineAmount ?? 0,
        bookName: selectedLoan.bookName,
        memberName: selectedLoan.memberName,
      });

      setActiveLoans((prev) => prev.filter((l) => l.id !== selectedLoan.id));
      setSelectedLoan(null);
    } catch (error) {
      alert("Hata: " + error.message);
    }
  };

  const closeModal = () => setResultModal(null);

  const goBack = () => {
    if (typeof onNavigate === "function") onNavigate("loans");
  };

  return (
    <div className="rnpPage rnpAiry">
      {/* HEADER */}
      <div className="rnpHeader">
        <div className="rnpCrumbs">
          <span>Ana Sayfa</span>
          <span className="sep">›</span>
          <span>Ödünç İşlemleri</span>
          <span className="sep">›</span>
          <span className="active">İade</span>
        </div>

        <div className="rnpHeaderRow">
          <h1 className="rnpTitle">İade İşlemleri</h1>

          {onNavigate && (
            <button className="rnpTopBtn" type="button" onClick={goBack}>
              Geri
            </button>
          )}
        </div>
      </div>

      <div className="rnpGrid airy">
        {/* SOL: LİSTE */}
        <div className="rnpCard airy">
          <div className="rnpStepHead airy">
            <div className="rnpStepIcon cyan">
              <ClipboardCheck size={18} />
            </div>
            <div className="rnpStepText">
              <div className="rnpStepTitle">Aktif Ödünçler</div>
              <div className="rnpStepSub">Arayın, filtreleyin ve iade alın</div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="rnpToolbar airy">
            <div className="rnpInputWrap airy">
              <Search size={16} />
              <input
                type="text"
                placeholder="Kitap adı, yazar veya ISBN ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* KATEGORİ FİLTRE */}
            <div className="rnpFilterWrap" ref={filterRef}>
              <button
                className={`rnpFilterBtn airy ${isFilterOpen ? "active" : ""}`}
                type="button"
                onClick={() => setIsFilterOpen((s) => !s)}
              >
                <span className="rnpFilterLabel">{selectedCategory}</span>
                {selectedCategory === "Tüm Kategoriler" ? (
                  <Filter size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              {isFilterOpen && (
                <div className="rnpDropdown airy">
                  {categories.map((cat, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`rnpDropItem ${selectedCategory === cat ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsFilterOpen(false);
                      }}
                    >
                      <span>{cat}</span>
                      {selectedCategory === cat && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LIST (TABLO YERİNE FERAH KART LİSTESİ) */}
          <div className="rnpList airy">
            {filteredLoans.length === 0 ? (
              <div className="rnpEmpty airy">Kayıt bulunamadı.</div>
            ) : (
              filteredLoans.map((loan) => {
                const delay = calculateDelayInfo(loan.dueDate);
                const isLate = delay > 0;
                const isSelected = selectedLoan?.id === loan.id;

                return (
                  <button
                    key={loan.id}
                    type="button"
                    className={`rnpLoanItem airy ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedLoan(loan)}
                  >
                    <div className="rnpLoanLeft">
                      <div className="rnpCoverLg">
                        <BookOpen size={18} />
                      </div>

                      <div className="rnpLoanText">
                        <div className="rnpLoanTitle">{loan.bookName}</div>
                        <div className="rnpLoanMeta">
                          <span className="muted">{loan.memberName}</span>
                          <span className="dot">•</span>
                          <span className="mono">{loan.memberNo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rnpLoanRight">
                      <div className="rnpBadges">
                        <span className="rnpBadge purple">{loan.category || "—"}</span>
                        {isLate ? (
                          <span className="rnpBadge red">{delay} Gün Gecikme</span>
                        ) : (
                          <span className="rnpBadge green">Zamanında</span>
                        )}
                      </div>

                      <div className="rnpDue">
                        <CalendarDays size={14} />
                        <span>{loan.dueDate}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ: DETAY */}
        <div className="rnpCard airy">
          <div className="rnpStepHead airy">
            <div className="rnpStepIcon green">
              <Calendar size={18} />
            </div>
            <div className="rnpStepText">
              <div className="rnpStepTitle">İade Özeti</div>
              <div className="rnpStepSub">Seçilen ödüncün detayları</div>
            </div>
          </div>

          {selectedLoan ? (
            <div className="rnpDetail airy">
              <div className="rnpDetailTop">
                <div className="rnpDetailTitle">Seçilen Kayıt</div>
                <span className="rnpId">#{selectedLoan.id}</span>
              </div>

              <div className="rnpInfoRow airy">
                <User className="cyanText" size={18} />
                <div>
                  <div className="rnpInfoK">Üye</div>
                  <div className="rnpInfoV">{selectedLoan.memberName}</div>
                </div>
              </div>

              <div className="rnpInfoRow airy">
                <BookOpen className="purpleText" size={18} />
                <div>
                  <div className="rnpInfoK">Kitap</div>
                  <div className="rnpInfoV">{selectedLoan.bookName}</div>
                </div>
              </div>

              <div className="rnpDivider airy" />

              <div className="rnpDates airy">
                <div className="rnpDateBox airy">
                  <div className="rnpDateK">
                    <Calendar size={14} />
                    <span>Veriliş</span>
                  </div>
                  <div className="rnpDateV">{selectedLoan.borrowDate}</div>
                </div>

                <div className="rnpDateBox airy">
                  <div className="rnpDateK">
                    <CalendarDays size={14} />
                    <span>Son Teslim</span>
                  </div>
                  <div className="rnpDateV">{selectedLoan.dueDate}</div>
                </div>
              </div>

              {calculateDelayInfo(selectedLoan.dueDate) > 0 && (
                <div className="rnpWarn airy">
                  <AlertTriangle size={16} />
                  <span>
                    {calculateDelayInfo(selectedLoan.dueDate)} gün gecikme cezası uygulanacak.
                  </span>
                </div>
              )}

              <button className="rnpBtn confirm airy" type="button" onClick={handleReturnBook}>
                <ClipboardCheck size={18} />
                İade Al
              </button>
            </div>
          ) : (
            <div className="rnpCenterEmpty airy">
              <BookOpen size={40} opacity={0.35} />
              <p>İşlem yapmak için soldan bir kayıt seçin.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {resultModal && (
        <div className="rnpModalOverlay">
          <div className="rnpModal airy">
            <button className="rnpModalClose" onClick={closeModal} type="button">
              <X size={18} />
            </button>

            <div className="rnpModalIcon">
              <CheckCircle2 size={56} />
            </div>

            <h2 className="rnpModalTitle">İade Tamamlandı</h2>
            <p className="rnpModalDesc">
              <b>{resultModal.bookName}</b> kitabı başarıyla teslim alındı.
            </p>

            <div className="rnpModalStats airy">
              {resultModal.delay > 0 ? (
                <div className="rnpStat red">
                  <Banknote size={18} />
                  <span>{resultModal.fine} TL Ceza</span>
                </div>
              ) : (
                <div className="rnpStat green">
                  <CheckCircle2 size={18} />
                  <span>Zamanında</span>
                </div>
              )}

              <div className="rnpStat blue">
                <BookUp size={18} />
                <span>Stok Güncellendi</span>
              </div>
            </div>

            <button className="rnpBtn modal airy" type="button" onClick={closeModal}>
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnPage;
