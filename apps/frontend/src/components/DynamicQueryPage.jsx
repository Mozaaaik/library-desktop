import { useEffect, useState } from "react";
import "../pages/DynamicQueryPage.css";

import {
  Search,
  X,
  Filter,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  Loader,
  // Sadece toast mesajları için gerekli ikonlar:
  CheckCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// Electron/Vite uyumlu vfs set
pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs;

const API = "http://localhost:3000";

function exportXlsx(filename, sheetName, rows, columns) {
  const data = rows.map((r) => {
    const obj = {};
    columns.forEach((c) => {
      obj[c.label] = r?.[c.key] ?? "";
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data);

  // kolon genişliği
  ws["!cols"] = columns.map((c) => ({
    wch: Math.min(45, Math.max(12, String(c.label).length + 2)),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, filename);
}

function exportPdf(filename, title, columns, rows) {
  const body = [
    columns.map((c) => ({ text: c.label, style: "th" })),
    ...rows.map((r) => columns.map((c) => String(r?.[c.key] ?? "-"))),
  ];

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: columns.length > 5 ? "landscape" : "portrait",
    content: [
      { text: title, style: "title", margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: columns.map(() => "*"),
          body,
        },
        layout: "lightHorizontalLines",
      },
    ],
    styles: {
      title: { fontSize: 16, bold: true },
      th: { bold: true, fontSize: 10 },
    },
    defaultStyle: { fontSize: 9 },
  };

  pdfMake.createPdf(docDefinition).getBlob((blob) => {
    saveAs(blob, filename);
  });
}

export function DynamicQueryPage() {
  // Filters
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState("Baslik");
  const [sortOrder, setSortOrder] = useState("asc");

  // Categories
  const [categories, setCategories] = useState([]);

  // Results
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/books/categories`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      } catch {
        // sessiz geç
      }
    })();
  }, []);

  const toggleSortOrder = () =>
    setSortOrder((p) => (p === "asc" ? "desc" : "asc"));

  const executeQuery = async () => {
    setIsLoading(true);
    setHasSearched(false);

    const qs = new URLSearchParams();
    if (title.trim()) qs.set("title", title.trim());
    if (author.trim()) qs.set("author", author.trim());
    if (categoryId !== "all") qs.set("categoryId", categoryId);
    if (onlyAvailable) qs.set("onlyAvailable", "true");
    if (sortBy) qs.set("sortBy", sortBy);
    if (sortOrder) qs.set("sortOrder", sortOrder);

    try {
      const res = await fetch(`${API}/books/dynamic-search?${qs.toString()}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "İstek başarısız");
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setResults(arr);
      setCurrentPage(1);

      // --- TOAST DÜZENLEMESİ ---
      // Emoji yerine CheckCircle ikonu
      toast.success(`${arr.length} kitap bulundu`, {
        icon: <CheckCircle size={18} color="#10b981" />,
      });
    } catch (e) {
      toast.error(
        "Dinamik sorgu endpointi yok / hata var. Backend’i kontrol et."
      );
      setResults([]);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  const clearFilters = () => {
    setTitle("");
    setAuthor("");
    setCategoryId("all");
    setOnlyAvailable(false);
    setSortBy("Baslik");
    setSortOrder("asc");
    setResults([]);
    setHasSearched(false);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const exportToExcel = () => {
    if (!hasSearched) return toast.error("Önce sorguyu çalıştır.");
    const cols = [
      { key: "Baslik", label: "Kitap Adı" },
      { key: "Yazar", label: "Yazar" },
      { key: "KategoriAdi", label: "Kategori" },
      { key: "Yayinevi", label: "Yayınevi" },
      { key: "ISBN", label: "ISBN" },
      { key: "MevcutAdet", label: "Mevcut Adet" },
    ];

    exportXlsx("kitap_raporu.xlsx", "KitapRaporu", results, cols);

    // --- TOAST DÜZENLEMESİ ---
    // Emoji yerine Download ikonu
    toast.success("Excel indiriliyor", {
      icon: <Download size={18} />,
    });
  };

  const exportToPDF = () => {
    if (!hasSearched) return toast.error("Önce sorguyu çalıştır.");
    const cols = [
      { key: "Baslik", label: "Kitap Adı" },
      { key: "Yazar", label: "Yazar" },
      { key: "KategoriAdi", label: "Kategori" },
      { key: "Yayinevi", label: "Yayınevi" },
      { key: "ISBN", label: "ISBN" },
      { key: "MevcutAdet", label: "Mevcut" },
    ];

    exportPdf("kitap_raporu.pdf", "Kitap Sorgu Sonuçları", cols, results);

    // --- TOAST DÜZENLEMESİ ---
    // Emoji yerine Download ikonu
    toast.success("PDF indiriliyor", {
      icon: <Download size={18} />,
    });
  };

  const canExport = hasSearched && results.length > 0;

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="dq-page">
      <div className="dq-header">
        <div className="dq-breadcrumbs">
          <span>Ana Sayfa</span>
          <span className="dq-sep">/</span>
          <span className="dq-bc-active">Dinamik Sorgu</span>
        </div>

        <div className="dq-headerRow">
          <div>
            <h1 className="dq-title">Dinamik Sorgu</h1>
            <p className="dq-desc">
              Kitap arama ve listeleme için gelişmiş parametrik sorgu
            </p>
          </div>
        </div>
      </div>

      <div className="dq-grid">
        {/* Left */}
        <div className="dq-left">
          <div className="dq-card dq-card--sticky">
            <div className="dq-card__title">
              <Filter className="dq-icon dq-icon--cyan" />
              <h3>Filtreler</h3>
            </div>

            <div className="dq-form">
              <div className="dq-field">
                <label className="dq-label">Kitap Adı</label>
                <input
                  className="dq-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Clean Code..."
                />
              </div>

              <div className="dq-field">
                <label className="dq-label">Yazar</label>
                <input
                  className="dq-input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Robert C. Martin..."
                />
              </div>

              <div className="dq-field">
                <label className="dq-label">Kategori</label>
                <select
                  className="dq-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="all">Tüm Kategoriler</option>
                  {categories.map((c) => (
                    <option key={c.KategoriID} value={String(c.KategoriID)}>
                      {c.KategoriAdi}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dq-checkboxRow">
                <input
                  id="onlyAvailable"
                  type="checkbox"
                  className="dq-checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                />
                <label htmlFor="onlyAvailable" className="dq-checkboxLabel">
                  Sadece mevcut kitaplar (MevcutAdet &gt; 0)
                </label>
              </div>

              <div className="dq-divider" />

              <div className="dq-field">
                <label className="dq-label">Sıralama</label>
                <select
                  className="dq-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Baslik">Kitap Adı</option>
                  <option value="Yazar">Yazar</option>
                  <option value="Yayinevi">Yayınevi</option>
                  <option value="ISBN">ISBN</option>
                  <option value="MevcutAdet">Mevcut Adet</option>
                </select>

                <button
                  type="button"
                  className="dq-btn dq-btn--ghost"
                  onClick={toggleSortOrder}
                >
                  <ArrowUpDown className="dq-icon" />
                  {sortOrder === "asc" ? "Artan" : "Azalan"}
                </button>
              </div>

              <div className="dq-actions">
                <button
                  type="button"
                  className="dq-btn dq-btn--primary"
                  onClick={executeQuery}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader className="dq-icon dq-spin" />
                      Sorgulanıyor...
                    </>
                  ) : (
                    <>
                      <Search className="dq-icon" />
                      Sorguyu Çalıştır
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="dq-btn dq-btn--icon"
                  onClick={clearFilters}
                  title="Temizle"
                >
                  <X className="dq-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="dq-right">
          <div className="dq-card dq-resultsCard">
            <div className="dq-resultsHeader">
              <div className="dq-resultsHeaderLeft">
                <h3>Sonuçlar</h3>
                {hasSearched && (
                  <p className="dq-subText">
                    Bulunan sonuç:{" "}
                    <span className="dq-accent">{results.length}</span>
                  </p>
                )}
              </div>

              {canExport && (
                <div className="dq-export">
                  <button
                    type="button"
                    className="dq-btn dq-btn--export dq-btn--excel"
                    onClick={exportToExcel}
                  >
                    <FileSpreadsheet className="dq-icon" />
                    Excel İndir
                  </button>
                  <button
                    type="button"
                    className="dq-btn dq-btn--export dq-btn--pdf"
                    onClick={exportToPDF}
                  >
                    <FileText className="dq-icon" />
                    PDF İndir
                  </button>
                </div>
              )}
            </div>

            <div className="dq-resultsBody">
              {!hasSearched && !isLoading ? (
                <div className="dq-empty">
                  <Search className="dq-emptyIcon" />
                  <p>Filtre girip sorguyu çalıştırın</p>
                </div>
              ) : isLoading ? (
                <div className="dq-skeletonWrap">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="dq-skeletonRow" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="dq-empty">
                  <Search className="dq-emptyIcon" />
                  <p>Sonuç bulunamadı</p>
                </div>
              ) : (
                <>
                  <div className="dq-tableWrap">
                    <table className="dq-table">
                      <thead>
                        <tr>
                          <th>Kitap Adı</th>
                          <th>Yazar</th>
                          <th>Kategori</th>
                          <th>Yayınevi</th>
                          <th>ISBN</th>
                          <th>Mevcut</th>
                        </tr>
                      </thead>

                      <tbody>
                        {currentResults.map((book) => (
                          <tr key={book.KitapID}>
                            <td className="dq-tdTitle">{book.Baslik}</td>
                            <td>{book.Yazar || "-"}</td>
                            <td>
                              <span className="dq-badge dq-badge--purple">
                                {book.KategoriAdi || "-"}
                              </span>
                            </td>
                            <td>{book.Yayinevi || "-"}</td>
                            <td className="dq-mono">{book.ISBN || "-"}</td>
                            <td>
                              {Number(book.MevcutAdet) > 0 ? (
                                <span className="dq-badge dq-badge--green">
                                  {book.MevcutAdet} Adet
                                </span>
                              ) : (
                                <span className="dq-badge dq-badge--red">
                                  Yok
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION */}
                  {totalPages > 1 && (
                    <div className="dq-tableFooter">
                      <div className="dq-showInfo">
                        Gösterilen:{" "}
                        <b>
                          {startIndex + 1} -{" "}
                          {Math.min(endIndex, results.length)}
                        </b>{" "}
                        / <b>{results.length}</b>
                      </div>

                      <div className="dq-paginationRight">
                        <button
                          className="dq-pageNavBtn"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => p - 1)}
                        >
                          Önceki
                        </button>

                        {getPageNumbers().map((num) => (
                          <button
                            key={num}
                            className={`dq-pageNumBtn ${
                              currentPage === num ? "active" : ""
                            }`}
                            onClick={() => setCurrentPage(num)}
                          >
                            {num}
                          </button>
                        ))}

                        <button
                          className="dq-pageNavBtn"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((p) => p + 1)}
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
