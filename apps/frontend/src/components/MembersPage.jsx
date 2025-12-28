import React, { useMemo, useState } from "react";
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

const initialMembers = [
  { id: 1, ad: "Ahmet", soyad: "Yılmaz", studentId: "20210001", email: "ahmet.yilmaz@university.edu", phone: "+90 532 123 4567", activeLoans: 2, debt: 0, status: "Active" },
  { id: 2, ad: "Zeynep", soyad: "Kaya", studentId: "20210002", email: "zeynep.kaya@university.edu", phone: "+90 533 234 5678", activeLoans: 1, debt: 0, status: "Active" },
  { id: 3, ad: "Mehmet", soyad: "Demir", studentId: "20200155", email: "mehmet.demir@university.edu", phone: "+90 534 345 6789", activeLoans: 3, debt: 40, status: "Active" },
  { id: 4, ad: "Ayşe", soyad: "Şahin", studentId: "20210003", email: "ayse.sahin@university.edu", phone: "+90 535 456 7890", activeLoans: 0, debt: 0, status: "Active" },
  { id: 5, ad: "Can", soyad: "Öztürk", studentId: "20190088", email: "can.ozturk@university.edu", phone: "+90 536 567 8901", activeLoans: 1, debt: 120, status: "Suspended" },
];

export default function MembersPage({ onNavigate, user }) {
  const [members, setMembers] = useState(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // add | edit
  const [editingMember, setEditingMember] = useState(null);

  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState({ open: false, member: null });

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

  const openAdd = () => {
    setFormMode("add");
    setEditingMember({
      id: Date.now(),
      ad: "",
      soyad: "",
      studentId: "",
      email: "",
      phone: "",
      activeLoans: 0,
      debt: 0,
      status: "Active",
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

  const saveMember = () => {
    const err = validateMember(editingMember);
    if (err) {
      showToast(err);
      return;
    }

    if (formMode === "add") {
      setMembers((prev) => [editingMember, ...prev]);
      showToast("Üye eklendi ✅");
    } else {
      setMembers((prev) => prev.map((x) => (x.id === editingMember.id ? editingMember : x)));
      showToast("Üye güncellendi ✅");
    }

    closeForm();
  };

  const requestDelete = (m) => {
    // şart: aktif ödünç veya borç varsa UYARI ver (silme yapma)
    if (m.activeLoans > 0 || m.debt > 0) {
      showToast("Bu üyenin aktif ödünç kaydı veya borcu var. Silinemez.");
      return;
    }
    setConfirm({ open: true, member: m });
  };

  const confirmDelete = () => {
    const m = confirm.member;
    setMembers((prev) => prev.filter((x) => x.id !== m.id));
    setConfirm({ open: false, member: null });
    showToast("Üye silindi 🗑️");
  };

  return (
    <div className="mp">
      {/* Top area */}
      <div className="mpTop">
        <div>
          <div className="mpCrumb">Home <span>›</span> Members <span>›</span> <b>List</b></div>
          <div className="mpTitle">Members</div>
          <div className="mpHello">Hoş geldiniz, <b>{user?.name || "Admin User"}</b></div>
        </div>

        <button className="mpPrimaryBtn" type="button" onClick={openAdd}>
          <Plus size={18} />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="mpCard mpFilters">
        <div className="mpSearch">
          <Search size={16} />
          <input
            className="mpInput"
            placeholder="Search by name, student ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mpSelectWrap">
          <select className="mpSelect" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
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
            {filteredMembers.map((m) => (
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
                    <span className="mpPill mpPillCyan">{m.activeLoans} loans</span>
                  ) : (
                    <span className="mpDim">No active loans</span>
                  )}
                  {m.debt > 0 ? <span className="mpPill mpPillRed">Debt: {m.debt}₺</span> : null}
                </div>

                <div className="mpCell">
                  <span className={`mpPill ${m.status === "Active" ? "mpPillGreen" : "mpPillRed"}`}>
                    {m.status}
                  </span>
                </div>

                <div className="mpCell right">
                  <div className="mpActions" onClick={(e) => e.stopPropagation()}>
                    <button className="mpIconBtn cyan" type="button" onClick={() => onNavigate?.("members", `detail-${m.id}`)}>
                      <Eye size={16} />
                    </button>

                    <button className="mpIconBtn purple" type="button" onClick={() => openEdit(m)}>
                      <Edit size={16} />
                    </button>

                    <button className="mpIconBtn red" type="button" onClick={() => requestDelete(m)}>
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

        {/* Pagination bar (şimdilik statik UI) */}
        <div className="mpPaging">
          <div>
            Showing <b>{filteredMembers.length}</b> of <b>{members.length}</b> members
          </div>
          <div className="mpPagingBtns">
            <button className="mpOutlineBtn" type="button">Previous</button>
            <button className="mpPageBtn" type="button">1</button>
            <button className="mpOutlineBtn" type="button">Next</button>
          </div>
        </div>
      </div>

      {/* Form Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="mpOverlay" role="dialog" aria-modal="true">
          <div className="mpModal">
            <div className="mpModalHead">
              <div>
                <div className="mpModalTitle">{formMode === "add" ? "Yeni Üye" : "Üye Güncelle"}</div>
                <div className="mpModalSub">Ad, Soyad, Telefon, Email zorunlu.</div>
              </div>
              <button className="mpX" type="button" onClick={closeForm}>✕</button>
            </div>

            <div className="mpModalBody">
              <div className="mpGrid2">
                <div className="mpField">
                  <label>Ad *</label>
                  <input
                    className="mpInput2"
                    value={editingMember.ad}
                    onChange={(e) => setEditingMember({ ...editingMember, ad: e.target.value })}
                  />
                </div>
                <div className="mpField">
                  <label>Soyad *</label>
                  <input
                    className="mpInput2"
                    value={editingMember.soyad}
                    onChange={(e) => setEditingMember({ ...editingMember, soyad: e.target.value })}
                  />
                </div>
              </div>

              <div className="mpGrid2">
                <div className="mpField">
                  <label>Telefon *</label>
                  <input
                    className="mpInput2"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  />
                </div>
                <div className="mpField">
                  <label>Email *</label>
                  <input
                    className="mpInput2"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="mpGrid2">
                <div className="mpField">
                  <label>Öğrenci No</label>
                  <input
                    className="mpInput2"
                    value={editingMember.studentId}
                    onChange={(e) => setEditingMember({ ...editingMember, studentId: e.target.value })}
                  />
                </div>

                <div className="mpField">
                  <label>Durum</label>
                  <select
                    className="mpSelect2"
                    value={editingMember.status}
                    onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mpModalFoot">
              <button className="mpOutlineBtn" type="button" onClick={closeForm}>Cancel</button>
              <button className="mpPrimaryBtn2" type="button" onClick={saveMember}>
                {formMode === "add" ? "Create" : "Save"}
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
              <button className="mpX" type="button" onClick={() => setConfirm({ open: false, member: null })}>✕</button>
            </div>

            <div className="mpModalFoot">
              <button className="mpOutlineBtn" type="button" onClick={() => setConfirm({ open: false, member: null })}>
                Vazgeç
              </button>
              <button className="mpDangerBtn" type="button" onClick={confirmDelete}>
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
