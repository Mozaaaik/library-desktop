import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown // Ok ikonu eklendi
} from 'lucide-react';
import '../pages/ReturnPage.css';

const ReturnPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [resultModal, setResultModal] = useState(null);
  const [activeLoans, setActiveLoans] = useState([]);
  
  // --- KATEGORİ FİLTRELEME STATE'LERİ ---
  const [selectedCategory, setSelectedCategory] = useState('Tüm Kategoriler');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Dışarı tıklayınca menüyü kapatmak için
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterRef]);

  // VERİ ÇEKME
  useEffect(() => {
    fetch(`http://localhost:3000/returns/active?search=${searchTerm}`)
      .then((res) => res.json())
      .then((data) => setActiveLoans(data))
      .catch((err) => console.error("Veri hatası:", err));
  }, [searchTerm]);

  // --- BENZERSİZ KATEGORİLERİ BULMA ---
  // Listede olan kategorileri otomatik çeker
  const categories = ['Tüm Kategoriler', ...new Set(activeLoans.map(loan => loan.category).filter(Boolean))];

  // --- FİLTRELEME MANTIĞI (Hem Arama Hem Kategori) ---
  const filteredLoans = activeLoans.filter(loan => {
    // 1. Kategori Kontrolü
    const categoryMatch = selectedCategory === 'Tüm Kategoriler' || loan.category === selectedCategory;
    
    // 2. Arama zaten backend'de yapılıyor ama state güncellenene kadar görsel filtreleme de olsun
    // (Backend search gönderdiğimiz için burası opsiyonel ama hızlı tepki için iyi)
    return categoryMatch; 
  });

  const calculateDelayInfo = (dueDateStr) => {
    const today = new Date(); 
    const due = new Date(dueDateStr);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 0;
  };

  const handleReturnBook = async () => {
    if(!selectedLoan) return;
    try {
      const response = await fetch('http://localhost:3000/returns/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oduncId: selectedLoan.id }) 
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setResultModal({
        success: true,
        delay: result.data.delayDays,
        fine: result.data.fineAmount,
        bookName: selectedLoan.bookName,
        memberName: selectedLoan.memberName
      });
      setActiveLoans(prev => prev.filter(l => l.id !== selectedLoan.id));
      setSelectedLoan(null);
    } catch (error) {
      alert("Hata: " + error.message);
    }
  };

  const closeModal = () => setResultModal(null);

  return (
    <div className="return-page-container">
      <div className="page-header-section">
        <div className="breadcrumb">Ana Sayfa &gt; Ödünç İşlemleri &gt; <span className="active">İade</span></div>
        <h1 className="page-title">İade İşlemleri</h1>
      </div>

      <div className="content-grid">
        <div className="rp-list-panel">
          
          {/* TOOLBAR */}
          <div className="rp-toolbar">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Kitap adı, yazar veya ISBN ile ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* --- KATEGORİ FİLTRE BUTONU --- */}
            <div className="filter-wrapper" ref={filterRef}>
              <button 
                className={`filter-btn ${isFilterOpen ? 'active' : ''}`} 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <span>{selectedCategory}</span>
                {selectedCategory === 'Tüm Kategoriler' ? <Filter size={14} /> : <ChevronDown size={14}/>}
              </button>

              {/* DROPDOWN MENU */}
              {isFilterOpen && (
                <div className="filter-dropdown animate-fade-in">
                  {categories.map((cat, index) => (
                    <div 
                      key={index} 
                      className={`filter-item ${selectedCategory === cat ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsFilterOpen(false);
                      }}
                    >
                      {cat}
                      {selectedCategory === cat && <CheckCircle2 size={14} className="text-blue-400"/>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rp-table-wrapper">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Kapak</th>
                  <th>Kitap Adı</th>
                  <th>Öğrenci No</th>
                  <th>Üye Adı</th>
                  <th>Kategori</th>
                  <th>Son Tarih</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map(loan => {
                  const delay = calculateDelayInfo(loan.dueDate);
                  const isLate = delay > 0;
                  const isSelected = selectedLoan?.id === loan.id;

                  return (
                    <tr 
                      key={loan.id} 
                      className={isSelected ? 'selected-row' : ''}
                      onClick={() => setSelectedLoan(loan)}
                    >
                      <td>
                        <div className="book-cover-placeholder"><BookOpen size={16} /></div>
                      </td>
                      <td className="font-bold text-white">{loan.bookName}</td>
                      <td className="cell-student-no">{loan.memberNo}</td>
                      <td className="text-gray-300">{loan.memberName}</td>
                      <td><span className="badge badge-purple">{loan.category}</span></td>
                      <td className="text-gray-300">{loan.dueDate}</td>
                      <td>
                        {isLate ? (
                          <span className="badge badge-red">{delay} Gün Gecikme</span>
                        ) : (
                          <span className="badge badge-green">Zamanında</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredLoans.length === 0 && <div className="empty-message">Kayıt bulunamadı.</div>}
          </div>
        </div>

        {/* SAĞ PANEL (Değişiklik yok) */}
        <div className="rp-detail-panel">
            {/* ... Burası önceki kod ile aynı ... */}
             {selectedLoan ? (
            <div className="detail-card animate-fade-in">
              <div className="detail-header">
                <h3>İade Özeti</h3>
                <span className="id-badge">#{selectedLoan.id}</span>
              </div>

              <div className="detail-content">
                <div className="info-row">
                  <User className="icon-blue" size={20} />
                  <div>
                    <label>Üye</label>
                    <div className="val">{selectedLoan.memberName}</div>
                  </div>
                </div>

                <div className="info-row">
                  <BookOpen className="icon-purple" size={20} />
                  <div>
                    <label>Kitap</label>
                    <div className="val">{selectedLoan.bookName}</div>
                  </div>
                </div>

                <div className="divider"></div>

                <div className="date-info">
                    <div className="date-item">
                       <div className="label-with-icon">
                          <Calendar size={14} className="text-gray-400"/> 
                          <span>Veriliş</span>
                       </div>
                       <span className="value">{selectedLoan.borrowDate}</span>
                    </div>
                    
                    <div className="date-item">
                       <div className="label-with-icon">
                          <CalendarDays size={14} className="text-gray-400"/> 
                          <span>Son Teslim</span>
                       </div>
                       <span className="value">{selectedLoan.dueDate}</span>
                    </div>
                </div>

                {calculateDelayInfo(selectedLoan.dueDate) > 0 && (
                   <div className="warning-box">
                      <AlertTriangle size={18} />
                      <span>{calculateDelayInfo(selectedLoan.dueDate)} gün gecikme cezası uygulanacak.</span>
                   </div>
                )}
              </div>

              <button className="action-btn" onClick={handleReturnBook}>
                <ClipboardCheck size={18} />
                İade Al
              </button>
            </div>
          ) : (
            <div className="empty-state-card">
              <BookOpen size={40} opacity={0.3} />
              <p>İşlem yapmak için soldan bir kitap seçin.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal aynı kalabilir */}
      {resultModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop-in">
            <button className="modal-close" onClick={closeModal}><X size={20}/></button>
            <div className="modal-icon-wrapper">
              <CheckCircle2 size={64} className="text-green-500" />
            </div>
            <h2>İade Tamamlandı</h2>
            <p className="modal-desc">
              <b>{resultModal.bookName}</b> kitabı başarıyla teslim alındı.
            </p>
            <div className="modal-stats">
              {resultModal.delay > 0 ? (
                <div className="stat-item error">
                   <Banknote size={18}/> <span>{resultModal.fine} TL Ceza</span>
                </div>
              ) : (
                <div className="stat-item success">
                   <CheckCircle2 size={18}/> <span>Zamanında</span>
                </div>
              )}
              <div className="stat-item info">
                 <BookUp size={18}/> <span>Stok Güncellendi</span>
              </div>
            </div>
            <button className="modal-btn" onClick={closeModal}>Tamam</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnPage;