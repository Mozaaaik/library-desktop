import React, { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import "../pages/MembersPage.css";

export default function MembersPage({ onNavigate, user }) {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Loans modal state
  const [loanModal, setLoanModal] = useState({ open: false, member: null });
  const [loans, setLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(false);

  // Arama yapılınca sayfayı 1'e döndür
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // add | edit
  const [editingMember, setEditingMember] = useState(null);

  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState({ open: false, member: null });

  const API_URL = "http://localhost:3000/members";

  const fetchMembers = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Veri çekilemedi");
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error(error);
      showToast("Veriler yüklenirken hata oluştu ❌");
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fullName = (m) => `${m.ad} ${m.soyad}`;

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchesSearch =
        fullName(m).toLowerCase().includes(q) ||
        m.studentId.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, searchQuery, statusFilter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openAdd = () => {
    setFormMode("add");
    setEditingMember({
      // id: Date.now(), Backend oluşturacak
      ad: "",
      soyad: "",
      studentId: "",
      email: "",
      phone: "",
      activeLoans: 0,
      debt: 0,
      status: "Aktif",
    });
    setIsFormOpen(true);
  };

  const openEdit = (m) => {
    setFormMode("edit");
    setEditingMember({ ...m });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const validateMember = (m) => {
    // zorunlu: Ad, Soyad, Telefon, Email
    if (!m.ad.trim()) return "Ad zorunlu.";
    if (!m.soyad.trim()) return "Soyad zorunlu.";
    if (!m.phone.trim()) return "Telefon zorunlu.";
    if (!m.email.trim()) return "Email zorunlu.";
    // basit email kontrol
    if (!m.email.includes("@")) return "Email formatı geçersiz.";
    return "";
  };

  const saveMember = async () => {
    const err = validateMember(editingMember);
    if (err) {
      showToast(err);
      return;
    }

    let memberToSave = { ...editingMember };

    if (Number(memberToSave.debt) > 150) {
      // Borç 150'den büyükse durumu otomatik olarak "Donduruldu" yap
      memberToSave.status = "Donduruldu";
      showToast("Borç limiti aşıldığı için üye donduruldu ⚠️"); // Silinebilir
    }

    try {
      if (formMode === "add") {
        // --- CREATE (POST) ---
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberToSave),
        });

        if (res.ok) {
          showToast("Üye eklendi");
          fetchMembers(); // Listeyi yenile
          closeForm();
        } else {
          showToast("Ekleme başarısız");
        }
      } else {
        // --- UPDATE (PUT) ---
        const res = await fetch(`${API_URL}/${memberToSave.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberToSave),
        });

        if (res.ok) {
          showToast("Üye güncellendi");
          fetchMembers(); // Listeyi yenile
          closeForm();
        } else {
          showToast("Güncelleme başarısız");
        }
      }
    } catch (error) {
      console.error(error);
      showToast("Sunucu hatası ⚠️");
    }
  };

  const requestDelete = (m) => {
    // şart: aktif ödünç veya borç varsa UYARI ver (silme yapma)
    if (m.activeLoans > 0 || m.debt > 0) {
      showToast("Bu üyenin aktif ödünç kaydı veya borcu var. Silinemez.");
      return;
    }
    setConfirm({ open: true, member: m });
  };

  const confirmDelete = async () => {
    const m = confirm.member;
    try {
      const res = await fetch(`${API_URL}/${m.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Üye silindi 🗑️");
        fetchMembers(); // Listeyi yenile
      } else {
        showToast("Silme işlemi başarısız ❌");
      }
    } catch (error) {
      console.error(error);
      showToast("Sunucu hatası ⚠️");
    } finally {
      setConfirm({ open: false, member: null });
    }
  };
  const openLoans = async (m) => {
    setLoanModal({ open: true, member: m });
    setLoans([]);
    setLoansLoading(true);

    const url = `${API_URL}/${m.id}/loans?active=true`;
    console.log("[openLoans] url =>", url);

    try {
      const res = await fetch(url);
      console.log("[openLoans] status =>", res.status, res.statusText);
      console.log("[openLoans] ok =>", res.ok);

      const raw = await res.text(); // önce text al
      console.log("[openLoans] raw body =>", raw);

      // res.ok değilse body ile birlikte hata fırlat
      if (!res.ok) throw new Error(`Loans fetch failed: ${res.status} ${raw}`);

      // text'i json'a çevir
      const data = raw ? JSON.parse(raw) : [];
      console.log("[openLoans] parsed =>", data);

      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[openLoans] error =>", err);
      showToast("Ödünç kitaplar yüklenemedi ❌");
      setLoans([]);
    } finally {
      setLoansLoading(false);
    }
  };


  const closeLoans = () => {
    setLoanModal({ open: false, member: null });
    setLoans([]);
    setLoansLoading(false);
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("tr-TR");
  };


  return (
    <div className="mp">
      {/* Top area */}
      <div className="mpTop">
        <div>
          <div className="mpCrumb">
            Ana Sayfa <span>›</span> Üyeler <span>›</span> <b>Liste</b>
          </div>
          <div className="mpTitle">Üyeler</div>
          <div className="mpHello">
            Hoş geldiniz, <b>{user?.name || "Admin User"}</b>
          </div>
        </div>

        <button className="mpPrimaryBtn" type="button" onClick={openAdd}>
          <Plus size={18} />
          Üye Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="mpCard mpFilters">
        <div className="mpSearch">
          <Search size={16} />
          <input
            className="mpInput"
            placeholder="İsim, öğrenci no veya e-posta ile arayın..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mpSelectWrap">
          <select
            className="mpSelect"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Aktif">Aktif</option>
            <option value="Donduruldu">Donduruldu</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mpCard mpTableCard">
        <div className="mpTable">
          <div className="mpThead">
            <div>Öğrenciler</div>
            <div>Öğrenci No</div>
            <div>İletişim Bilgileri</div>
            <div>Ödünç Alınan</div>
            <div>Durum</div>
            <div className="right">İşlemler</div>
          </div>

          <div className="mpTbody">
            {currentMembers.map((m) => (
              <div
                key={m.id}
                className="mpRow"
                onClick={() => onNavigate?.("members", `detail-${m.id}`)}
                role="button"
                tabIndex={0}
              >
                <div className="mpCell">
                  <div className="mpUser">
                    <div className="mpAvatar">
                      <UserIcon size={18} />
                    </div>
                    <div className="mpName">{fullName(m)}</div>
                  </div>
                </div>

                <div className="mpCell muted">{m.studentId}</div>

                <div className="mpCell">
                  <div className="mpContact">
                    <div className="line">
                      <Mail size={14} />
                      <span>{m.email}</span>
                    </div>
                    <div className="line sub">
                      <Phone size={14} />
                      <span>{m.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mpCell">
                  {m.activeLoans > 0 ? (
                    <span className="mpPill mpPillCyan">
                      {m.activeLoans} kitap
                    </span>
                  ) : (
                    <span className="mpDim">Kitap ödünç alınmamış.</span>
                  )}
                  {m.debt > 0 ? (
                    <span className="mpPill mpPillRed">Borç: {m.debt}₺</span>
                  ) : null}
                </div>

                <div className="mpCell">
                  <span
                    className={`mpPill ${m.status === "Aktif" ? "mpPillGreen" : "mpPillRed"}`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="mpCell right">
                  <div
                    className="mpActions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="mpIconBtn cyan"
                      type="button"
                      onClick={() => openLoans(m)}
                    >
                      <Eye size={16} />
                    </button>


                    <button
                      className="mpIconBtn purple"
                      type="button"
                      onClick={() => openEdit(m)}
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      className="mpIconBtn red"
                      type="button"
                      onClick={() => requestDelete(m)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredMembers.length === 0 ? (
              <div className="mpEmpty">No members found.</div>
            ) : null}
          </div>
        </div>
        {/* Pagination Bar - YENİ HALİ */}
        <div className="mpPaging">
          <div>
            Toplam <b>{filteredMembers.length}</b> üyeden{" "}
            <b>
              {filteredMembers.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
              {Math.min(indexOfLastItem, filteredMembers.length)}
            </b>{" "}
            arası gösteriliyor.
          </div>

          <div className="mpPagingBtns">
            <button
              className="mpOutlineBtn"
              type="button"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Önceki
            </button>

            <button className="mpPageBtn" type="button">
              {currentPage} / {totalPages || 1}
            </button>

            <button
              className="mpOutlineBtn"
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{
                opacity:
                  currentPage === totalPages || totalPages === 0 ? 0.5 : 1,
              }}
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="mpOverlay" role="dialog" aria-modal="true">
          <div className="mpModal">
            <div className="mpModalHead">
              <div>
                <div className="mpModalTitle">
                  {formMode === "add" ? "Yeni Üye" : "Üye Güncelle"}
                </div>
                <div className="mpModalSub">
                  Ad, Soyad, Telefon, Email zorunlu.
                </div>
              </div>
              <button className="mpX" type="button" onClick={closeForm}>
                ✕
              </button>
            </div>

            <div className="mpModalBody">
              <div className="mpGrid2">
                <div className="mpField">
                  <label>Ad *</label>
                  <input
                    className="mpInput2"
                    value={editingMember.ad}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, ad: e.target.value })
                    }
                  />
                </div>
                <div className="mpField">
                  <label>Soyad *</label>
                  <input
                    className="mpInput2"
                    value={editingMember.soyad}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        soyad: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="mpGrid2">
                <div className="mpField">
                  <label>Telefon *</label>
                  <input
                    className="mpInput2"
                    value={editingMember.phone}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mpField">
                  <label>Email *</label>
                  <input
                    className="mpInput2"
                    value={editingMember.email}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="mpGrid2">
                <div className="mpField">
                  <label>Öğrenci No</label>
                  <input
                    className="mpInput2"
                    value={editingMember.studentId}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        studentId: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mpField">
                  <label>Durum</label>
                  <select
                    className="mpSelect2"
                    value={editingMember.status}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Donduruldu">Donduruldu</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mpModalFoot">
              <button
                className="mpOutlineBtn"
                type="button"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button
                className="mpPrimaryBtn2"
                type="button"
                onClick={saveMember}
              >
                {formMode === "add" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loans Modal */}
      {loanModal.open && (
        <div className="mpOverlay" role="dialog" aria-modal="true">
          <div className="mpModal">
            <div className="mpModalHead">
              <div>
                <div className="mpModalTitle">Ödünç Aldığı Kitaplar</div>
                <div className="mpModalSub">
                  <b>{fullName(loanModal.member)}</b> kullanıcısının aktif ödünçleri
                </div>
              </div>
              <button className="mpX" type="button" onClick={closeLoans}>
                ✕
              </button>
            </div>

            <div className="mpModalBody">
              {loansLoading ? (
                <div className="mpEmpty">Yükleniyor...</div>
              ) : loans.length === 0 ? (
                <div className="mpEmpty">Aktif ödünç kitap yok.</div>
              ) : (
                <div className="mpTable loanTable">
                  <div className="mpThead">
                    <div>Kitap</div>
                    <div>ISBN</div>
                    <div>Veriliş</div>
                    <div>Son Teslim</div>
                    <div>Durum</div>
                  </div>

                  <div className="mpTbody">
                    {loans.map((x) => (
                      <div key={x.islemId} className="mpRow" role="row">
                        <div className="mpCell">
                          <div className="loanBook">
                            <div className="loanTitle" title={x.title}>{x.title}</div>
                            <div className="loanCat" title={x.category}>{x.category}</div>
                          </div>
                        </div>



                        <div className="mpCell muted loanIsbn" title={x.isbn}>{x.isbn}</div>
                        <div className="mpCell">{fmtDate(x.givenAt)}</div>
                        <div className="mpCell">{fmtDate(x.dueAt)}</div>

                        <div className="mpCell">
                          <span className={`mpPill ${x.status === "Aktif" ? "mpPillCyan" : "mpPillGreen"}`}>
                            {x.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mpModalFoot">
              <button className="mpOutlineBtn" type="button" onClick={closeLoans}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Delete Confirm Modal */}
      {confirm.open && (
        <div className="mpOverlay" role="dialog" aria-modal="true">
          <div className="mpModal small">
            <div className="mpModalHead">
              <div>
                <div className="mpModalTitle">Üyeyi Sil</div>
                <div className="mpModalSub">
                  <b>{fullName(confirm.member)}</b> silinsin mi?
                </div>
              </div>
              <button
                className="mpX"
                type="button"
                onClick={() => setConfirm({ open: false, member: null })}
              >
                ✕
              </button>
            </div>

            <div className="mpModalFoot">
              <button
                className="mpOutlineBtn"
                type="button"
                onClick={() => setConfirm({ open: false, member: null })}
              >
                Vazgeç
              </button>
              <button
                className="mpDangerBtn"
                type="button"
                onClick={confirmDelete}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="mpToast">{toast}</div>}
    </div>
  );
}
