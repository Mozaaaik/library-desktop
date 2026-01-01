import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Loader2,
  CheckCircle,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import "../pages/BooksPage.css";
import "../pages/MembersPage.css"; // modal tasarımı

const API_URL = "http://localhost:3000";
const PAGE_SIZE = 7;

function mapDbBookToUi(row) {
  const title = row.Baslik ?? "";
  const author = row.Yazar ?? row.author ?? row.YAZAR ?? "";
  const isbn = String(row.ISBN ?? row.isbn ?? "");

  const category =
    row.KategoriAdi ?? row.kategori ?? row.category ?? row.KATEGORI_ADI ?? "—";

  // Mevcut Stok (Ödünçtekiler düşülmüş hali)
  const stock = Number(row.MevcutAdet ?? row.stock ?? row.MEVCUT_ADET ?? 0);

  // Toplam Adet (Kütüphanedeki fiziksel toplam kitap sayısı)
  // Backend'den ToplamAdet, total, piece vb. geliyorsa onu alıyoruz, yoksa stock'a eşitliyoruz.
  const total = Number(
    row.ToplamAdet ?? row.total ?? row.TOPLAM_ADET ?? row.piece ?? stock
  );

  const status = stock > 0 ? "Uygun" : "Stok Yok";

  const publisher =
    row.Yayinevi ?? row.YayinEvi ?? row.publisher ?? row.YAYINEVI ?? "";

  return {
    id: row.KitapID ?? row.id ?? row.KITAP_ID,
    title,
    author,
    isbn,
    category,
    stock,
    total, // Yeni eklenen alan
    status,
    publisher,
    categoryId: row.KategoriID ?? row.categoryId ?? row.KATEGORI_ID ?? "",
  };
}

export default function BooksPage({ onNavigate, user }) {
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // add | edit
  const [editingBook, setEditingBook] = useState(null);

  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategoryId("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // ✅ Members gibi: kitapları TEK SEFER çek (arama sırasında fetch yok)
  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/books`);
      if (!res.ok) throw new Error("Kitaplar alınamadı");

      const rows = await res.json();
      const mapped = (Array.isArray(rows) ? rows : []).map(mapDbBookToUi);
      setBooks(mapped);
    } catch (e) {
      console.error("Books fetch error:", e);
      // Hata Toast Iconlu
      showToast(
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          Kitaplar yüklenirken hata oluştu <AlertCircle size={18} />
        </div>
      );
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/books/categories`);
      if (!res.ok) throw new Error("Kategoriler alınamadı");

      const rows = await res.json();
      setCategories(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("Categories fetch error:", e);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  // ✅ Members gibi: search/status/category değişince sadece sayfayı 1'e çek
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryId, statusFilter]);

  // ✅ Local search + local filter (Members mantığı)
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        !q ||
        (book.title ?? "").toLowerCase().includes(q) ||
        (book.author ?? "").toLowerCase().includes(q) ||
        String(book.isbn ?? "")
          .toLowerCase()
          .includes(q);

      const matchesCategory =
        selectedCategoryId === "all" ||
        Number(book.categoryId) === Number(selectedCategoryId);

      const matchesStatus =
        statusFilter === "all" || book.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [books, searchQuery, selectedCategoryId, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBooks.slice(start, start + PAGE_SIZE);
  }, [filteredBooks, currentPage]);

  const pageNumbers = useMemo(() => {
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
  }, [currentPage, totalPages]);

  // -----------------------------
  // Modal open/close
  // -----------------------------
  const openAdd = () => {
    setFormMode("add");
    setEditingBook({
      title: "",
      author: "",
      isbn: "",
      publisher: "",
      categoryId: "",
      piece: 1,
    });
    setIsFormOpen(true);
  };

  const openEdit = (book) => {
    setFormMode("edit");
    setEditingBook({
      id: book.id,
      title: book.title ?? "",
      author: book.author ?? "",
      isbn: book.isbn ?? "",
      publisher: book.publisher ?? "",
      categoryId: book.categoryId ?? "",
      // Düzenlerken toplam sayıyı (total) baz al, yoksa stock'u al
      piece: Number.isFinite(book.total)
        ? book.total
        : Number.isFinite(book.stock)
          ? book.stock
          : 1,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingBook(null);
  };

  const validateBook = (b) => {
    if (!b.title?.trim()) return "Kitap adı zorunlu.";
    if (!b.author?.trim()) return "Yazar zorunlu.";
    if (!String(b.isbn ?? "").trim()) return "ISBN zorunlu.";
    if (!String(b.categoryId ?? "").trim()) return "Kategori ID zorunlu.";
    const pieceNum = Number(b.piece);
    if (!Number.isFinite(pieceNum) || pieceNum < 0)
      return "Stok (adet) geçersiz.";
    if (!Number.isFinite(Number(b.categoryId)))
      return "Kategori ID sayı olmalı.";
    return "";
  };

  const saveBook = async () => {
    const err = validateBook(editingBook);
    if (err) return showToast(err);

    const payload = {
      title: editingBook.title,
      author: editingBook.author,
      publisher: editingBook.publisher ?? "",
      isbn: String(editingBook.isbn),
      categoryId: Number(editingBook.categoryId),
      piece: Number(editingBook.piece),
    };

    const keepPage = currentPage;

    try {
      const url =
        formMode === "edit"
          ? `${API_URL}/books/${editingBook.id}`
          : `${API_URL}/books`;

      const method = formMode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      console.log(method, url, res.status, raw);

      if (!res.ok) throw new Error("Kitap kaydedilemedi");

      // Başarılı Toast Iconlu
      showToast(
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {formMode === "add" ? "Kitap eklendi" : "Kitap güncellendi"}
          <CheckCircle size={18} />
        </div>
      );
      closeForm();

      // ✅ Members gibi: işlem sonrası listeyi yenile
      await fetchBooks();

      setCurrentPage(keepPage);
    } catch (e) {
      console.error(e);
      showToast("Hata: Kitap kaydedilemedi.");
    }
  };

  const deleteBook = async (book) => {
    if (!book?.id) return;

    const ok = window.confirm(`"${book.title}" kitabını silmek istiyor musun?`);
    if (!ok) return;

    const keepPage = currentPage;

    try {
      const res = await fetch(`${API_URL}/books/${book.id}`, {
        method: "DELETE",
      });

      const raw = await res.text();
      console.log("DELETE", book.id, res.status, raw);

      if (!res.ok) throw new Error("Kitap silinemedi");

      // Silme Başarılı Toast Iconlu
      showToast(
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          Kitap silindi <CheckCircle size={18} />
        </div>
      );

      // Anında UI’dan kaldır
      setBooks((prev) => prev.filter((b) => b.id !== book.id));

      setCurrentPage(keepPage);
    } catch (e) {
      console.error(e);
      showToast("Hata: Kitap silinemedi.");
    }
  };

  return (
    <div className="booksPage">
      {/* Header */}
      <div className="pageHeader">
        <div>
          <div className="breadcrumbs">
            <span>Ana Sayfa</span>
            <ChevronRight className="crumbSep" size={14} />
            <span>Kitaplar</span>
            <ChevronRight className="crumbSep" size={14} />
            <span className="crumbActive">Liste</span>
          </div>

          <h1 className="pageTitle">Kitaplar</h1>
        </div>

        <button className="primaryBtn" onClick={openAdd}>
          <Plus size={18} />
          <span>Kitap Ekle</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card filtersCard">
        <div className="filtersGrid">
          <div className="searchBox">
            <Search className="searchIcon" size={18} />
            <input
              className="textInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kitap adı, yazar veya ISBN ile ara..."
            />
          </div>

          <select
            className="selectInput"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.KategoriID} value={String(c.KategoriID)}>
                {c.KategoriAdi}
              </option>
            ))}
          </select>

          <select
            className="selectInput"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Uygun">Uygun</option>
            <option value="Stok Yok">Stok Yok</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="card tableCard">
        {isLoading ? (
          <div className="centerBox">
            <Loader2 className="spin" size={34} />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="emptyState">
            <div className="emptyIcon">
              <BookOpen size={26} />
            </div>
            <h3>Kayıt bulunamadı</h3>
            <p>Arama/filtreleri değiştirip tekrar deneyebilirsin.</p>
            <button className="ghostBtn" onClick={clearFilters}>
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          <>
            <div className="tableWrap">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th>Kapak</th>
                    <th>Kitap Adı</th>
                    <th>Yazar</th>
                    <th>ISBN</th>
                    <th>Kategori</th>
                    <th>Stok</th>
                    <th>Durum</th>
                    <th className="thRight">İşlemler</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedBooks.map((book) => (
                    <tr key={book.id} className="rowHover">
                      <td>
                        <div className="coverBox">
                          <BookOpen size={18} />
                        </div>
                      </td>

                      <td className="tdStrong">{book.title}</td>
                      <td className="tdMuted">{book.author}</td>
                      <td className="tdSub">{book.isbn}</td>

                      <td>
                        <span className="badge badgePurple">
                          {book.category}
                        </span>
                      </td>

                      <td className="tdMuted">
                        {book.stock} / {book.total}
                      </td>

                      <td>
                        <span
                          className={
                            book.status === "Uygun"
                              ? "badge badgeGreen"
                              : "badge badgeRed"
                          }
                        >
                          {book.status}
                        </span>
                      </td>

                      <td className="tdRight">
                        <div
                          className="actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="iconBtn iconPurple"
                            title="Düzenle"
                            onClick={() => openEdit(book)}
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            className="iconBtn iconRed"
                            title="Sil"
                            onClick={() => deleteBook(book)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="tableFooter">
              <div className="footerText">
                Gösteriliyor: <b>{(currentPage - 1) * PAGE_SIZE + 1}</b> -{" "}
                <b>{Math.min(currentPage * PAGE_SIZE, filteredBooks.length)}</b>{" "}
                / <b>{filteredBooks.length}</b> kitap
              </div>

              <div className="pager">
                <button
                  className="pagerBtn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Önceki
                </button>

                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    className={`pagerBtn ${p === currentPage ? "pagerActive" : ""}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}

                <button
                  className="pagerBtn"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isFormOpen && (
        <div className="mpOverlay" role="dialog" aria-modal="true">
          <div className="mpModal">
            <div className="mpModalHead">
              <div>
                <div className="mpModalTitle">
                  {formMode === "add" ? "Yeni Kitap" : "Kitap Güncelle"}
                </div>
                <div className="mpModalSub">
                  Kitap adı, yazar, ISBN, kategori ve stok zorunlu.
                </div>
              </div>
              <button className="mpX" type="button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <div className="mpModalBody">
              <div className="mpGrid2">
                <div className="mpField">
                  <label>Kitap Adı *</label>
                  <input
                    className="mpInput2"
                    value={editingBook.title}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, title: e.target.value })
                    }
                  />
                </div>

                <div className="mpField">
                  <label>Yazar *</label>
                  <input
                    className="mpInput2"
                    value={editingBook.author}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, author: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mpGrid2">
                <div className="mpField">
                  <label>ISBN *</label>
                  <input
                    className="mpInput2"
                    value={editingBook.isbn}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, isbn: e.target.value })
                    }
                  />
                </div>

                <div className="mpField">
                  <label>Yayınevi</label>
                  <input
                    className="mpInput2"
                    value={editingBook.publisher}
                    onChange={(e) =>
                      setEditingBook({
                        ...editingBook,
                        publisher: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="mpGrid2">
                <div className="mpField">
                  <label>Kategori ID *</label>
                  <input
                    className="mpInput2"
                    placeholder="Örn: 3"
                    value={editingBook.categoryId}
                    onChange={(e) =>
                      setEditingBook({
                        ...editingBook,
                        categoryId: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mpField">
                  <label>Stok (Adet) *</label>
                  <input
                    className="mpInput2"
                    type="number"
                    min="0"
                    value={editingBook.piece}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, piece: e.target.value })
                    }
                  />
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
                onClick={saveBook}
              >
                {formMode === "add" ? "Create" : "Save"}
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